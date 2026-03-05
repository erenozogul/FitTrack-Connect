
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface ChatScreenProps {
  lang: 'tr' | 'en';
}

const ChatScreen: React.FC<ChatScreenProps> = ({ lang }) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-background-dark transition-colors">
      <header className="flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 border-b border-slate-100 dark:border-white/5 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="relative">
            <div className="size-12 rounded-full border-2 border-primary overflow-hidden">
              <img src="https://picsum.photos/seed/mike/100/100" alt="Coach Mike" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 size-3 bg-primary rounded-full border-2 border-white dark:border-background-dark"></div>
          </div>
          <div>
            <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight tracking-tight">Coach Mike</h2>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Online • Level 4 PT</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/40">
            <span className="material-symbols-outlined">analytics</span>
          </button>
          <button className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/40">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-44">
        <div className="flex justify-center">
          <span className="bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">Today</span>
        </div>

        {/* Coach Msg */}
        <div className="flex items-start gap-3">
          <img src="https://picsum.photos/seed/mike/100/100" className="size-8 rounded-full shrink-0" alt="" />
          <div className="flex flex-col gap-1 max-w-[80%]">
            <div className="bg-slate-100 dark:bg-card-dark rounded-2xl rounded-tl-none px-4 py-3 text-xs leading-relaxed text-slate-800 dark:text-white/90 shadow-sm border border-slate-200 dark:border-white/5">
              Great form on those squats today! Check this PDF for your updated macros. Let's push for 5 more reps on the next set.
            </div>
            <span className="text-[8px] text-slate-400 dark:text-white/20 font-bold ml-1 uppercase">09:41 AM</span>
          </div>
        </div>

        {/* PDF Attachment */}
        <div className="flex items-start gap-3 pl-11">
          <div className="group flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-card-dark p-3 border border-slate-200 dark:border-white/5 hover:border-primary/40 transition-all cursor-pointer w-full max-w-[240px]">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 dark:text-white text-[11px] font-bold truncate">Week4_Nutrition.pdf</p>
              <p className="text-slate-400 dark:text-white/30 text-[8px] font-bold">1.2 MB • PDF</p>
            </div>
            <span className="material-symbols-outlined text-slate-300 dark:text-white/20 group-hover:text-primary">download</span>
          </div>
        </div>

        {/* Student Msg */}
        <div className="flex items-start gap-3 justify-end">
          <div className="flex flex-col gap-1 max-w-[80%] items-end">
            <div className="bg-primary text-white dark:text-background-dark font-bold rounded-2xl rounded-tr-none px-4 py-3 text-xs leading-relaxed shadow-lg shadow-primary/20">
              Thanks! Quick question about the supplement timing—sending a voice note.
            </div>
            <span className="text-[8px] text-slate-400 dark:text-white/20 font-bold mr-1 uppercase">09:45 AM • Read</span>
          </div>
          <img src="https://picsum.photos/seed/alex/100/100" className="size-8 rounded-full shrink-0" alt="" />
        </div>

        {/* Typing */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex gap-1">
            <span className="size-1.5 bg-primary rounded-full animate-bounce"></span>
            <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
          <span className="text-[10px] text-primary/70 font-bold italic">Coach Mike is typing...</span>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-24 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-white/5">
        <div className="flex items-end gap-3 bg-slate-50 dark:bg-card-dark rounded-2xl p-2 border border-slate-200 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-inner">
          <div className="flex flex-col gap-2 mb-1 pl-1">
            <button className="size-8 flex items-center justify-center text-slate-400 dark:text-white/20 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">attach_file</span>
            </button>
            <button className="size-8 flex items-center justify-center text-slate-400 dark:text-white/20 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            </button>
          </div>
          <div className="flex-1 pb-2">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 resize-none max-h-32 py-1" 
              placeholder="Type a message..." 
              rows={1}
            ></textarea>
          </div>
          <div className="flex items-center gap-1 mb-1 pr-1">
            <button className="size-10 flex items-center justify-center text-primary hover:text-primary/70 transition-colors">
              <span className="material-symbols-outlined text-[24px]">mic</span>
            </button>
            <button className="size-10 rounded-xl flex items-center justify-center bg-primary text-white dark:text-background-dark shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform">
              <span className="material-symbols-outlined font-black">send</span>
            </button>
          </div>
        </div>
      </footer>

      <BottomNav role="student" lang={lang} />
    </div>
  );
};

export default ChatScreen;
