
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
      localStorage.setItem('fittrack_user', JSON.stringify(data.user));

      onLogin(`${data.user.firstName} ${data.user.lastName}`, data.user.role);
      navigate(data.user.role === 'trainer' ? '/library' : '/dashboard');
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
              <button type="button" className="text-xs font-bold text-primary hover:underline">{t.forgot}</button>
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
    </div>
  );
};

export default LoginScreen;
