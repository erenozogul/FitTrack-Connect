
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { translations } from '../App';

interface WelcomeScreenProps {
  onSelectRole: (role: UserRole) => void;
  lang: 'tr' | 'en';
  setLang: (lang: 'tr' | 'en') => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectRole, lang, setLang, isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const t = translations[lang];

  const handleSelect = (role: UserRole) => {
    onSelectRole(role);
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-background-dark overflow-hidden transition-colors duration-300">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Header branding */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-primary text-xl fill-1">bolt</span>
          </div>
          <h1 className="text-lg font-black italic tracking-tighter text-slate-900 dark:text-white">
            PT<span className="text-slate-400 dark:text-white/60">Board</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="size-9 flex items-center justify-center bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl hover:bg-slate-300 dark:hover:bg-white/10 active:scale-95 transition-all text-slate-600 dark:text-white/60 hover:text-primary dark:hover:text-primary"
            title={isDarkMode ? t.lightMode : t.darkMode}
          >
            <span className="material-symbols-outlined text-lg fill-1">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-1">
            <button
              onClick={() => setLang('tr')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${lang === 'tr' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'}`}
            >
              TR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${lang === 'en' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Title */}
        <div className="text-center mb-2">
          <p className="text-[10px] font-bold tracking-[0.4em] text-primary/70 uppercase mb-3">{t.elevateYourTraining}</p>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            <span className="text-primary">{t.welcomeTitle2}</span>
          </h2>
        </div>

        {/* Role cards */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* Trainer Card */}
          <button
            onClick={() => handleSelect('trainer')}
            className="group w-full bg-white dark:bg-card-dark border border-slate-200 dark:border-white/10 hover:border-primary/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-primary/5 dark:hover:bg-primary/10 active:scale-[0.98] shadow-lg"
          >
            <div className="size-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl">fitness_center</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-0.5">{t.roleLabel}</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.trainer}</h3>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 leading-snug">{t.trainerDesc}</p>
            </div>
            <span className="material-symbols-outlined text-slate-300 dark:text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward_ios</span>
          </button>

          {/* Student Card */}
          <button
            onClick={() => handleSelect('student')}
            className="group w-full bg-white dark:bg-card-dark border border-slate-200 dark:border-white/10 hover:border-cta-orange/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-cta-orange/5 active:scale-[0.98] shadow-lg"
          >
            <div className="size-14 rounded-2xl bg-cta-orange/10 border border-cta-orange/20 flex items-center justify-center shrink-0 group-hover:bg-cta-orange/20 transition-colors">
              <span className="material-symbols-outlined text-cta-orange text-3xl">school</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-black text-cta-orange/70 uppercase tracking-widest mb-0.5">{t.roleLabel}</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.student}</h3>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 leading-snug">{t.studentDesc}</p>
            </div>
            <span className="material-symbols-outlined text-slate-300 dark:text-white/20 group-hover:text-cta-orange group-hover:translate-x-1 transition-all">arrow_forward_ios</span>
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-slate-400 dark:text-white/20 uppercase tracking-widest font-bold mt-2">
          {t.selectRoleToContinue}
        </p>
      </main>
    </div>
  );
};

export default WelcomeScreen;
