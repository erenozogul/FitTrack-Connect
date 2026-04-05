
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { translations } from '../App';

interface LoginScreenProps {
  role: UserRole;
  onLogin: (name: string, role: UserRole) => void;
  lang: 'tr' | 'en';
}

const LoginScreen: React.FC<LoginScreenProps> = ({ role, onLogin, lang }) => {
  const navigate = useNavigate();
  const t = translations[lang];
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [forgotConfirmPw, setForgotConfirmPw] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const openForgot = () => {
    setShowForgot(true);
    setForgotStep(1);
    setForgotEmail('');
    setForgotNewPw('');
    setForgotConfirmPw('');
    setForgotError('');
    setForgotSuccess(false);
  };
  const closeForgot = () => setShowForgot(false);

  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(
          data.error === 'error_email_not_found'
            ? (lang === 'tr' ? 'Bu e-posta adresiyle kayıtlı hesap bulunamadı.' : 'No account found with this email.')
            : (lang === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.')
        );
      } else {
        setForgotStep(2);
      }
    } catch {
      setForgotError(lang === 'tr' ? 'Sunucuya bağlanılamadı.' : 'Could not connect to server.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (forgotNewPw !== forgotConfirmPw) {
      setForgotError(lang === 'tr' ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.');
      return;
    }
    if (forgotNewPw.length < 6) {
      setForgotError(lang === 'tr' ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email: forgotEmail, newPassword: forgotNewPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(lang === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.');
      } else {
        setForgotSuccess(true);
        setTimeout(() => closeForgot(), 1800);
      }
    } catch {
      setForgotError(lang === 'tr' ? 'Sunucuya bağlanılamadı.' : 'Could not connect to server.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, usernameOrEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorKey = data.error as keyof typeof t;
        setError(t[errorKey] || t.error_generic);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('fittrack_token', data.token);
      if (data.refreshToken) localStorage.setItem('fittrack_refresh_token', data.refreshToken);
      localStorage.setItem('fittrack_user', JSON.stringify(data.user));

      onLogin(`${data.user.firstName} ${data.user.lastName}`, data.user.role);
      navigate('/dashboard');
    } catch {
      setError(t.error_generic);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-background-dark transition-colors duration-300 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-6 p-2 rounded-full bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white hover:scale-105 active:scale-95 transition-all z-20"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="w-full max-w-[440px] flex flex-col items-center pb-20 md:pb-0">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-4xl fill-1">bolt</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t.brand}</h1>
          <p className="text-slate-500 dark:text-white/40 mt-2 font-medium">{t.elevateYourTraining}</p>
        </div>

        <div className={`mb-8 px-6 py-2 rounded-full border text-xs font-bold uppercase tracking-widest ${role === 'trainer' ? 'border-primary/30 text-primary bg-primary/5' : 'border-cta-orange/30 text-cta-orange bg-cta-orange/5'}`}>
          {role === 'trainer' ? t.trainer : t.student} {t.login}
        </div>

        {error && (
          <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          </div>
        )}

        <form className="w-full space-y-5" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600 dark:text-white/60 ml-1">{t.usernameOrEmail}</label>
            <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">person</span>
              <input
                required
                disabled={isLoading}
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:ring-0 disabled:opacity-50"
                placeholder="johndoe / coach@fittrack.com"
                type="text"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="block text-sm font-semibold text-slate-600 dark:text-white/60">{t.password}</label>
              <button type="button" onClick={openForgot} className="text-xs font-bold text-primary hover:underline">{t.forgot}</button>
            </div>
            <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">lock</span>
              <input
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:ring-0 disabled:opacity-50"
                placeholder="••••••••"
                type="password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-primary/30 uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? (
              <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : t.login}
          </button>
        </form>

        <p className="text-slate-500 dark:text-white/40 text-sm font-medium mt-8">
          {t.noAccount}
          <button onClick={() => navigate('/signup')} className="text-primary font-bold hover:underline ml-1">{t.signUp}</button>
        </p>

        <div className="fixed -z-10 top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeForgot}>
          <div
            className="w-full max-w-md bg-white dark:bg-[#0f1923] border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 flex flex-col gap-5 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {forgotStep === 2 && !forgotSuccess && (
                  <button onClick={() => setForgotStep(1)} className="size-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </button>
                )}
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {forgotSuccess
                    ? (lang === 'tr' ? 'Şifre Değiştirildi!' : 'Password Changed!')
                    : forgotStep === 1
                      ? (lang === 'tr' ? 'Şifremi Unuttum' : 'Forgot Password')
                      : (lang === 'tr' ? 'Yeni Şifre Belirle' : 'Set New Password')}
                </h2>
              </div>
              <button onClick={closeForgot} className="size-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {forgotSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="size-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500 text-3xl">check_circle</span>
                </div>
                <p className="text-slate-500 dark:text-white/50 text-sm text-center">
                  {lang === 'tr' ? 'Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.' : 'Your password has been updated. You can now log in with your new password.'}
                </p>
              </div>
            ) : forgotStep === 1 ? (
              <form onSubmit={handleForgotStep1} className="flex flex-col gap-4">
                <p className="text-sm text-slate-500 dark:text-white/40">
                  {lang === 'tr' ? 'Kayıtlı e-posta adresinizi girin, şifrenizi sıfırlayalım.' : 'Enter your registered email address to reset your password.'}
                </p>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1">
                    {lang === 'tr' ? 'E-posta Adresi' : 'Email Address'}
                  </label>
                  <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg">mail</span>
                    <input
                      required
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full bg-transparent border-none py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:ring-0 text-sm"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>
                {forgotError && <p className="text-red-400 text-xs font-semibold">{forgotError}</p>}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {forgotLoading
                    ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : (lang === 'tr' ? 'Devam Et' : 'Continue')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotStep2} className="flex flex-col gap-4">
                <p className="text-sm text-slate-500 dark:text-white/40">
                  <span className="font-bold text-primary">{forgotEmail}</span>{' '}
                  {lang === 'tr' ? 'hesabı için yeni şifrenizi belirleyin.' : 'account — set your new password.'}
                </p>
                {[
                  { label: lang === 'tr' ? 'Yeni Şifre' : 'New Password', value: forgotNewPw, setter: setForgotNewPw },
                  { label: lang === 'tr' ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password', value: forgotConfirmPw, setter: setForgotConfirmPw },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1">{field.label}</label>
                    <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg">lock</span>
                      <input
                        required
                        type="password"
                        value={field.value}
                        onChange={e => field.setter(e.target.value)}
                        className="w-full bg-transparent border-none py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder:text-white/30 focus:ring-0 text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                ))}
                {forgotError && <p className="text-red-400 text-xs font-semibold">{forgotError}</p>}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {forgotLoading
                    ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : (lang === 'tr' ? 'Şifreyi Güncelle' : 'Update Password')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
