
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { translations } from '../App';
import { addNotification } from '../utils/notifications';

interface SignUpScreenProps {
  role: UserRole;
  onSignUp: (name: string) => void;
  lang: 'tr' | 'en';
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ role, onSignUp, lang }) => {
  const navigate = useNavigate();
  const t = translations[lang];
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [inviteCode, setInviteCode] = useState('');
  const [codeError, setCodeError] = useState('');


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, firstName, lastName, username, email, password, gender }),
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
      localStorage.setItem('fittrack_user', JSON.stringify({ ...data.user, gender }));
      localStorage.setItem('fittrack_gender', gender);

      onSignUp(`${firstName} ${lastName}`);
      if (role === 'trainer') {
        navigate('/library');
      } else {
        setIsLoading(false);
        setStep(2);
        return;
      }
    } catch {
      setError(lang === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectByCode = async () => {
    setCodeError('');
    const code = inviteCode.trim().toUpperCase();
    if (!code) { setCodeError(lang === 'tr' ? 'Lütfen bir kod girin.' : 'Please enter a code.'); return; }
    try {
      const res = await fetch('/api/trainer/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('fittrack_token')}` },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      const trainer = {
        ...data.trainer,
        avatar: `https://picsum.photos/seed/${data.trainer.username}/100/100`,
      };
      localStorage.setItem('fittrack_connected_trainer', JSON.stringify(trainer));
      addNotification({
        type: 'system',
        title: lang === 'tr' ? `${trainer.name} ile bağlantı kuruldu!` : `Connected with ${trainer.name}!`,
        body: lang === 'tr' ? 'Antrenörünüz sizin için program oluşturabilir ve sizi takip edebilir.' : 'Your trainer can now create programs and track your progress.',
      });
      navigate('/dashboard');
    } catch {
      setCodeError(lang === 'tr' ? 'Geçersiz davet kodu. Lütfen tekrar deneyin.' : 'Invalid invite code. Please try again.');
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-background-dark transition-colors duration-300 relative">
        <div className="w-full max-w-[440px] flex flex-col items-center pb-20 md:pb-0">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-4xl">bolt</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cta-orange/10 border border-cta-orange/20 mb-3">
              <span className="text-cta-orange text-xs font-black uppercase tracking-widest">
                {lang === 'tr' ? 'Adım 2/2' : 'Step 2/2'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {lang === 'tr' ? 'Antrenörünü Seç' : 'Choose Your Trainer'}
            </h1>
            <p className="text-slate-500 dark:text-white/40 text-sm mt-2">
              {lang === 'tr'
                ? 'İsterseniz şimdi atla, daha sonra profilinden bağlanabilirsin'
                : 'You can skip this and connect later from your profile'}
            </p>
          </div>

          {/* Invite Code Section */}
          <div className="w-full mb-4 bg-white dark:bg-card-dark border border-slate-200 dark:border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1">
              {lang === 'tr' ? 'Davet Kodu ile Bağlan' : 'Connect with Invite Code'}
            </p>
            <p className="text-slate-400 dark:text-white/30 text-xs mb-3">
              {lang === 'tr' ? 'Antrenörünüzden aldığınız kodu girin.' : 'Enter the code you received from your trainer.'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={e => { setInviteCode(e.target.value.toUpperCase()); setCodeError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleConnectByCode()}
                placeholder={lang === 'tr' ? 'Örn: ERNBNGL2026' : 'e.g. ERNBNGL2026'}
                className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 text-sm focus:outline-none focus:border-primary font-mono tracking-widest uppercase"
              />
              <button
                onClick={handleConnectByCode}
                disabled={!inviteCode.trim()}
                className="px-4 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">link</span>
                {lang === 'tr' ? 'Bağlan' : 'Connect'}
              </button>
            </div>
            {codeError && (
              <p className="text-red-500 text-xs mt-2 font-semibold">{codeError}</p>
            )}
          </div>

          {/* Skip Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-bold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            {lang === 'tr' ? 'Şimdi Atla' : 'Skip for Now'}
          </button>
        </div>
        <div className="fixed -z-10 top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-background-dark transition-colors duration-300 relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-6 p-2 rounded-full bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white hover:scale-105 active:scale-95 transition-all z-20"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="w-full max-w-[440px] flex flex-col items-center pb-20 md:pb-0 justify-center">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-4xl fill-1">bolt</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t.brand}</h1>
          <p className="text-slate-500 dark:text-white/40 mt-2 font-medium">{t.createAccount}</p>
        </div>

        <div className={`mb-6 px-6 py-2 rounded-full border text-xs font-bold uppercase tracking-widest ${role === 'trainer' ? 'border-primary/30 text-primary bg-primary/5' : 'border-cta-orange/30 text-cta-orange bg-cta-orange/5'}`}>
          {role === 'trainer' ? t.trainer : t.student} {t.signUp}
        </div>

        {/* Gender selector */}
        <div className="w-full mb-6">
          <p className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">
            {lang === 'tr' ? 'Cinsiyet' : 'Gender'}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all active:scale-95 ${gender === 'male' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60'}`}
            >
              <span className="material-symbols-outlined text-xl">man</span>
              {lang === 'tr' ? 'Erkek' : 'Male'}
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all active:scale-95 ${gender === 'female' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60'}`}
            >
              <span className="material-symbols-outlined text-xl">woman</span>
              {lang === 'tr' ? 'Kadın' : 'Female'}
            </button>
          </div>
        </div>

        {error && (
          <div className="w-full mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          </div>
        )}

        <form className="w-full space-y-5" onSubmit={handleSignUp}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-600 dark:text-white/60 ml-1">{t.firstName}</label>
              <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <input
                  required
                  disabled={isLoading}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-transparent border-none py-4 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:ring-0 disabled:opacity-50"
                  placeholder="John"
                  type="text"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-600 dark:text-white/60 ml-1">{t.lastName}</label>
              <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <input
                  required
                  disabled={isLoading}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-transparent border-none py-4 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:ring-0 disabled:opacity-50"
                  placeholder="Doe"
                  type="text"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600 dark:text-white/60 ml-1">{t.username}</label>
            <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">alternate_email</span>
              <input
                required
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:ring-0 disabled:opacity-50"
                placeholder="johndoe"
                type="text"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600 dark:text-white/60 ml-1">{t.email}</label>
            <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">mail</span>
              <input
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:ring-0 disabled:opacity-50"
                placeholder="coach@fittrack.com"
                type="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600 dark:text-white/60 ml-1">{t.password}</label>
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
            ) : t.signUp}
          </button>
        </form>

        <p className="text-slate-500 dark:text-white/40 text-sm font-medium mt-8">
          {t.haveAccount}
          <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline ml-1">{t.login}</button>
        </p>

        <div className="fixed -z-10 top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
};

export default SignUpScreen;
