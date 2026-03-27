
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface LiveSessionProps {
  lang: 'tr' | 'en';
}

const LiveSession: React.FC<LiveSessionProps> = ({ lang }) => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);

  const participants = [
    { name: 'John Doe', progress: 85, bpm: 145, set: '3/3', isTop: true, avatar: 'https://picsum.photos/seed/p1/100/100' },
    { name: 'Sarah Miller', progress: 40, bpm: 132, set: '2/3', avatar: 'https://picsum.photos/seed/p2/100/100' },
    { name: 'Alex Rivera', progress: 60, bpm: 158, set: '2/3', avatar: 'https://picsum.photos/seed/p3/100/100' },
    { name: 'Maya Chen', progress: 0, bpm: 110, set: '1/3', isResting: true, avatar: 'https://picsum.photos/seed/p4/100/100' },
    { name: 'Lucas G.', progress: 15, bpm: 140, set: '1/3', avatar: 'https://picsum.photos/seed/p5/100/100' }
  ];

  return (
    <div className="h-screen flex flex-col bg-background-dark md:pl-64">
      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">Live Session</h1>
            <h2 className="text-sm font-bold">HIIT: Morning Blast</h2>
          </div>
        </div>
        <div className="bg-primary/20 border border-primary/30 px-3 py-1 rounded-full flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-primary text-[10px] font-black uppercase">12 Active</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-y-auto pb-44 md:pb-32 no-scrollbar max-w-5xl mx-auto w-full">
        {/* Current Move Visualization */}
        <section className="p-4">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            <img alt="Workout" className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIBifeiwYKNJpECTOVNphZvjK4qylsQBIB8-6yeUMZHtHRvq1nlzOmo_DaPzpK6e3fVo77f4xZPtSYJyCB7eXeUKtY51wXdnu-tHBUrg31lJw8tsI0zXy3vB7moqrUlDQVNkmuukhPp133Yl4aNd5hJ6LVxnDY_xSwJnVVRkVw-GIj7nDIqTNxQvwhEhNGX14i722Y7FMQjHpU0sQsHmiCBEkKNfbRGS4gPAiFyymoxMDDqbvqK6pBzHrmrNBOeLAEGMOLCQz7Z7k" />
            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10">
                  <p className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1">Current Move</p>
                  <h3 className="text-xl font-black italic">KETTLEBELL SWINGS</h3>
                </div>
                <div className="size-12 rounded-full bg-primary flex items-center justify-center text-background-dark shadow-[0_0_20px_rgba(0,122,255,0.5)]">
                  <span className="material-symbols-outlined font-black">play_arrow</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-7xl font-black leading-none tracking-tighter text-primary animate-pulse">45</div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Seconds Left</p>
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase">
                  <span>Round 2 of 4</span>
                  <span className="text-primary">Next: Burpees</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[65%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="px-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Equip', val: '16kg KB', icon: 'fitness_center' },
            { label: 'Inten', val: 'High', icon: 'bolt' },
            { label: 'Time', val: '32m', icon: 'timer' }
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-xl bg-card-dark border border-white/5 flex flex-col items-center gap-1 text-center">
              <span className="material-symbols-outlined text-primary text-sm">{s.icon}</span>
              <p className="text-[8px] text-white/40 uppercase font-bold">{s.label}</p>
              <p className="text-[10px] font-bold">{s.val}</p>
            </div>
          ))}
        </section>

        {/* Participants Leaderboard */}
        <section className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Class Progress</h3>
            <span className="text-[10px] text-primary font-bold uppercase">Live Ranking</span>
          </div>

          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${p.isTop ? 'border-primary/20 bg-primary/5' : 'border-white/5 bg-card-dark'}`}>
                <div className="relative">
                  <img src={p.avatar} alt={p.name} className={`size-8 rounded-full border ${p.isTop ? 'border-primary' : 'border-white/10'} ${p.isResting ? 'opacity-40 grayscale' : ''}`} />
                  {p.isTop && <div className="absolute -bottom-1 -right-1 size-3 bg-primary rounded-full border-2 border-background-dark"></div>}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-[11px]">{p.name}</p>
                    {p.isTop && <span className="text-[8px] font-black bg-primary text-background-dark px-1.5 py-0.5 rounded italic">TOP</span>}
                    {p.isResting && <span className="text-[8px] font-bold text-blue-400 uppercase">Resting</span>}
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${p.isTop ? 'bg-primary' : 'bg-primary/30'}`} style={{ width: `${p.progress}%` }}></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-primary">Set {p.set}</p>
                  <p className="text-[8px] text-white/30">{p.bpm} BPM</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Control Footer */}
      <footer className="fixed bottom-0 left-0 md:left-64 right-0 bg-card-dark/95 backdrop-blur-xl border-t border-primary/20 p-4 md:pb-4 shadow-2xl">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
          <div className="flex gap-4 justify-between items-center px-2">
            <div className="text-center">
              <p className="text-[8px] text-white/40 uppercase font-black">Avg. Intensity</p>
              <p className="text-base font-black text-primary">84%</p>
            </div>
            <div className="h-6 w-px bg-white/10"></div>
            <div className="text-center">
              <p className="text-[8px] text-white/40 uppercase font-black">Total Kcal</p>
              <p className="text-base font-black text-white">4,280</p>
            </div>
            <div className="h-6 w-px bg-white/10"></div>
            <div className="flex gap-2">
              <button className="size-10 rounded-full border border-white/10 flex items-center justify-center text-white/40"><span className="material-symbols-outlined text-xl">skip_previous</span></button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="size-10 rounded-full bg-white text-background-dark flex items-center justify-center shadow-lg transition-transform active:scale-90"><span className="material-symbols-outlined font-black">{isPlaying ? 'pause' : 'play_arrow'}</span></button>
            </div>
          </div>
          <button 
            onClick={() => navigate('/analysis')}
            className="w-full h-12 rounded-xl bg-white text-[#0B2B53] flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-cta-orange/20"
          >
            <span className="material-symbols-outlined font-bold">skip_next</span>
            Next Move
          </button>
        </div>
      </footer>

      {/* Fixed: Pass lang to BottomNav */}
      <BottomNav role="trainer" lang={lang} />
    </div>
  );
};

export default LiveSession;