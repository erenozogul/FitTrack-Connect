
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface MapExplorerProps {
  lang: 'tr' | 'en';
}

const MapExplorer: React.FC<MapExplorerProps> = ({ lang }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Near Me');

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-white dark:bg-background-dark md:pl-64 transition-colors">
      {/* Map Mock */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/90 dark:from-background-dark/80 dark:via-transparent dark:to-background-dark/90 pointer-events-none z-10"></div>
        <img 
          className="h-full w-full object-cover grayscale opacity-40 dark:opacity-40 contrast-125 brightness-110 dark:brightness-75 scale-110" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVX-EgFecyLqFpKuBLMxsd-Y781iRB5Zn3Wf6jTZyJtg5Q_dItfkEMD6NlnOlnmZgnQXUrcKnX-PyIRpLHkbQLWQQN2LXDsSZnkGvkyM8Ov_E5_cyyp364aqIYSu4KzP-_sw4QeK2ovWzdOSpwKjE6tLuOe-Fkn-g8lmJ1LImiztx8m_QqoKEasFWD0tIAq8S3nPxoKCV1A9mrQ7qqZqSLCO1CgcoL2JFzug8gecZ60gFYfl1sQJ6Por4kFHItAPE4QmfPKVhYB2M" 
          alt="Map" 
        />
        
        {/* User Location */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative flex h-8 w-8">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-8 w-8 bg-primary border-4 border-white shadow-2xl"></span>
          </div>
        </div>

        {/* Pin 1 - Gym */}
        <div className="absolute top-[30%] left-[20%] z-20 group">
          <div className="bg-white dark:bg-card-dark border-2 border-primary rounded-xl p-3 shadow-2xl group-hover:scale-110 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-primary text-2xl fill-1">fitness_center</span>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/90 dark:bg-background-dark/90 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white whitespace-nowrap shadow-xl">
            Iron Paradise
          </div>
        </div>

        {/* Pin 2 - Active Selection */}
        <div className="absolute top-[60%] right-[20%] z-30">
          <div className="flex flex-col items-center">
            <div className="bg-primary text-white dark:text-background-dark rounded-full p-2 shadow-[0_0_30px_rgba(0,122,255,0.6)] animate-bounce">
              <span className="material-symbols-outlined text-2xl fill-1">person</span>
            </div>
            <div className="w-1 h-4 bg-primary rounded-full"></div>
            <div className="bg-primary px-4 py-2 rounded-full text-white dark:text-background-dark text-[10px] font-black uppercase mt-1 shadow-2xl">
              Alex Rivera (PT)
            </div>
          </div>
        </div>
      </div>

      {/* Overlay UI */}
      <header className="relative z-40 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <button className="bg-white/60 dark:bg-background-dark/60 backdrop-blur-xl size-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl text-slate-600 dark:text-white">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex-1">
            <div className="flex h-12 w-full items-center bg-white/60 dark:bg-background-dark/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl px-4 gap-3 shadow-xl">
              <span className="material-symbols-outlined text-slate-400 dark:text-white/40">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-xs flex-1 placeholder:text-slate-400 dark:placeholder:text-white/20 text-slate-900 dark:text-white" placeholder="Gyms, coaches, studios..." type="text"/>
            </div>
          </div>
          <button className="bg-white/60 dark:bg-background-dark/60 backdrop-blur-xl size-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl text-slate-600 dark:text-white">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { label: 'Near Me', icon: 'explore' },
            { label: 'Gyms', icon: 'fitness_center' },
            { label: 'Trainers', icon: 'person' },
            { label: 'Studios', icon: 'self_improvement' }
          ].map((chip) => (
            <button key={chip.label} onClick={() => setActiveFilter(chip.label)} className={`flex h-10 items-center justify-center gap-2 rounded-full px-6 whitespace-nowrap shadow-xl transition-all ${chip.label === activeFilter ? 'bg-primary text-white dark:text-background-dark' : 'bg-white/60 dark:bg-background-dark/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'}`}>
              <span className={`material-symbols-outlined text-sm ${chip.label === activeFilter ? 'fill-1' : ''}`}>{chip.icon}</span>
              <span className="text-xs font-black uppercase">{chip.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Map Zoom Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
        <button className="bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl size-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white shadow-2xl active:scale-90 transition-transform"><span className="material-symbols-outlined font-black">add</span></button>
        <button className="bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl size-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white shadow-2xl active:scale-90 transition-transform"><span className="material-symbols-outlined font-black">remove</span></button>
        <div className="h-4"></div>
        <button className="bg-primary size-12 flex items-center justify-center rounded-2xl text-white dark:text-background-dark shadow-[0_0_20px_rgba(0,122,255,0.4)] active:scale-90 transition-transform"><span className="material-symbols-outlined fill-1 font-black">my_location</span></button>
      </div>

      {/* Detail Card Overlay */}
      <div className="absolute bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 z-40">
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
          <div className="flex">
            <div className="w-32 h-40 shrink-0 relative">
              <img className="h-full w-full object-cover" src="https://picsum.photos/seed/coach2/200/300" alt="Profile" />
              <div className="absolute top-3 left-3 bg-primary px-2 py-0.5 rounded text-[8px] font-black text-white dark:text-background-dark shadow-lg">ACTIVE</div>
            </div>
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Alex Rivera</h3>
                    <p className="text-[10px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-widest mt-1">Strength & HIIT</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                    <span className="material-symbols-outlined text-primary text-sm fill-1">star</span>
                    <span className="text-[10px] font-black text-slate-900 dark:text-white">4.9</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-white/60">
                    <span className="material-symbols-outlined text-base">distance</span>
                    <span className="text-[10px] font-bold">0.4 MI</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-white/60">
                    <span className="material-symbols-outlined text-base">payments</span>
                    <span className="text-[10px] font-bold">$65/HR</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button className="flex-1 bg-primary text-white dark:text-background-dark font-black text-[10px] py-2.5 rounded-xl hover:brightness-110 transition-all uppercase tracking-widest">Book Session</button>
                <button 
                  onClick={() => navigate('/chat')}
                  className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 size-10 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white"
                >
                  <span className="material-symbols-outlined text-sm">chat_bubble</span>
                </button>
              </div>
            </div>
          </div>
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-slate-200 dark:bg-white/10 rounded-full mx-auto my-2"></div>
        </div>
      </div>

      <BottomNav role="student" lang={lang} />
    </div>
  );
};

export default MapExplorer;
