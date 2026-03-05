
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
    <div className="h-screen flex flex-col snap-container bg-white dark:bg-background-dark transition-colors duration-300">
      <section className="h-screen snap-section relative flex flex-col overflow-hidden">
        {/* Background Accent */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] select-none pointer-events-none">
          <span className="text-[15rem] font-black italic tracking-tighter text-slate-900 dark:text-white">PREP</span>
        </div>

        {/* Branding Overlay */}
        <div className="fixed top-8 left-0 right-0 pointer-events-none z-50 flex flex-col items-center">
          <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 backdrop-blur-xl rounded-lg flex items-center justify-center border border-primary/20 dark:border-primary/30 mb-2 shadow-sm">
            <span className="material-symbols-outlined text-primary text-2xl fill-1">bolt</span>
          </div>
          <h1 className="text-[10px] font-bold tracking-[0.5em] text-slate-400 dark:text-white/40 uppercase">{t.brand}</h1>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Trainer Option */}
          <button 
            onClick={() => handleSelect('trainer')}
            className="group relative flex-1 w-full overflow-hidden transition-all duration-500 hover:flex-[1.5] border-b border-slate-100 dark:border-white/5 outline-none"
          >
            <img 
              alt="Personal Trainer" 
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-110 group-hover:scale-100" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBemTHvlekMEEDN1JHU-mQgSp6mdFKAw6uD_NGEl1Z8OZG_4ClZ5wENfVQFTvF9RimTZ6QewKUSNfn6w6jCwUqS1jOPG9joChwTXY-fD-AUytqhXMEquKolPJxDgkovtGaeD4H4gOJp_gI_qEhdRbowX5bCfMVai3Apo6LNvnAQPgdROGns2I8RUfZK8tJLpADBgzpHtwiyq5cG_eUg1DTeZGheANS6oBIsxzbpJg7fg7NfplUWc9jDjyW-GxDRw7Qc8q7Zoj3bUdQ"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 dark:from-background-dark dark:via-background-dark/40 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-center">
              <span className="text-xs font-bold tracking-[0.3em] text-primary mb-2 uppercase">{t.iAmA}</span>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2 group-hover:scale-110 transition-transform uppercase text-slate-900 dark:text-white">{t.trainer}</h2>
              <p className="text-slate-500 dark:text-white/60 text-sm max-w-[240px] opacity-0 group-hover:opacity-100 transition-opacity">{t.trainerDesc}</p>
              <div className="mt-6 w-12 h-12 rounded-full border border-slate-200 dark:border-white/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-colors group-hover:shadow-lg">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-white">arrow_forward</span>
              </div>
            </div>
          </button>

          {/* Student Option */}
          <button 
            onClick={() => handleSelect('student')}
            className="group relative flex-1 w-full overflow-hidden transition-all duration-500 hover:flex-[1.5] outline-none"
          >
            <img 
              alt="Student" 
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-110 group-hover:scale-100" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaK5a6PY-OHy3rNPyHFM4kZnvGgaQFABO5gpAo2fzGBOlVBSLhod7qvnnKIvDNQgLYToygz10EAZSybGml0yzqyl7MN26D5DnhCp7EKaJObE09s3Yw7-qHhbvSHlYL8x4Jzvv46RAuPrlvyWzJ6aABxwYqzaVkVCU-mEqIahgMhyzidKezzM6rwoLM4nHnCmTgVA_v3xnHUo62UlfIuwVm50PNqEfCfGAefDbvDLlcOz_GmjA4dwz3eYs7Qjd3knqRLTB2VPbVDfQ"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 dark:from-background-dark dark:via-background-dark/40 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-center">
              <div className="mb-6 w-12 h-12 rounded-full border border-slate-200 dark:border-white/20 flex items-center justify-center group-hover:bg-cta-orange group-hover:border-cta-orange transition-colors group-hover:shadow-lg">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-white rotate-180">arrow_forward</span>
              </div>
              <span className="text-xs font-bold tracking-[0.3em] text-cta-orange mb-2 uppercase">{t.iAmA}</span>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2 group-hover:scale-110 transition-transform uppercase text-slate-900 dark:text-white">{t.student}</h2>
              <p className="text-slate-500 dark:text-white/60 text-sm max-w-[240px] opacity-0 group-hover:opacity-100 transition-opacity">{t.studentDesc}</p>
            </div>
          </button>
        </div>

        {/* Footer Settings Area (Bottom Center/Right) */}
        <div className="absolute bottom-8 left-0 right-0 z-50 px-6 flex justify-between items-center pointer-events-none">
           <div className="flex-1"></div>
           
           <div className="flex items-center gap-3 pointer-events-auto">
             {/* Dark Mode Toggle */}
             <button 
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="size-11 flex items-center justify-center bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-primary"
               title={isDarkMode ? t.lightMode : t.darkMode}
             >
               <span className="material-symbols-outlined text-2xl fill-1">
                 {isDarkMode ? 'light_mode' : 'dark_mode'}
               </span>
             </button>

             {/* Language Selector */}
             <div className="flex items-center bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-1 shadow-xl">
               <button 
                 onClick={() => setLang('tr')}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${lang === 'tr' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white'}`}
               >
                 TR
               </button>
               <button 
                 onClick={() => setLang('en')}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${lang === 'en' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white'}`}
               >
                 EN
               </button>
             </div>
           </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-white/40">{t.scroll}</span>
          <span className="material-symbols-outlined animate-bounce text-slate-400 dark:text-white/40">expand_more</span>
        </div>
      </section>
    </div>
  );
};

export default WelcomeScreen;
