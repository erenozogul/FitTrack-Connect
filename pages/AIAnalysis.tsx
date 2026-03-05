
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface AIAnalysisProps {
  lang: 'tr' | 'en';
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ lang }) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background-dark">
      <header className="sticky top-0 z-10 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[8px] font-black tracking-[0.3em] text-white/30 uppercase leading-none mb-1">FitTrack Connect</h1>
            <p className="text-sm font-black uppercase italic">AI Form Analysis</p>
          </div>
        </div>
        <button className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-44 no-scrollbar">
        {/* Student Profile */}
        <section className="p-4 flex items-center gap-4 bg-card-dark border-b border-white/5">
          <div className="relative">
            <div className="size-16 rounded-full border-2 border-primary p-0.5">
              <img alt="Sarah" className="w-full h-full rounded-full object-cover" src="https://picsum.photos/seed/sarah/100/100" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-background-dark rounded-full p-0.5 flex items-center justify-center border-2 border-background-dark shadow-lg">
              <span className="material-symbols-outlined text-[14px] font-bold">check</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Sarah Jenkins</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary/80 uppercase">
              <span className="material-symbols-outlined text-xs">calendar_today</span>
              <span>Session: Oct 24, 2023</span>
            </div>
          </div>
        </section>

        {/* Skeleton Visualization */}
        <section className="p-4">
          <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-primary/20 shadow-2xl bg-black">
            <img 
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800" 
              className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale" 
              alt="Pose" 
            />
            {/* Skeletal Mockup */}
            <svg className="absolute inset-0 w-full h-full p-8" viewBox="0 0 400 500">
              <circle cx="200" cy="80" fill="#007AFF" r="6" />
              <line x1="160" y1="140" x2="240" y2="155" stroke="#007AFF" strokeWidth="4" strokeLinecap="round" />
              <circle cx="160" cy="140" fill="#007AFF" r="5" />
              <circle cx="240" cy="155" fill="#007AFF" r="5" />
              <line x1="200" y1="148" x2="200" y2="300" stroke="#007AFF" strokeWidth="3" strokeDasharray="6 4" />
              <line x1="170" y1="300" x2="230" y2="330" stroke="#007AFF" strokeWidth="6" strokeLinecap="round" />
              <circle cx="170" cy="300" fill="#007AFF" r="8" />
              <circle cx="230" cy="330" fill="#007AFF" r="8" />
              <text x="245" y="350" fill="#007AFF" fontSize="16" fontWeight="900">15° Tilt</text>
              <text x="255" y="175" fill="#007AFF" fontSize="14" fontWeight="900">8° Depr.</text>
            </svg>
            <div className="absolute top-4 left-4 bg-background-dark/80 backdrop-blur px-3 py-1.5 rounded-lg border border-primary/20 text-[9px] font-black text-primary flex items-center gap-2 uppercase tracking-widest shadow-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              AI Live Analysis Active
            </div>
          </div>
        </section>

        {/* Diagnostics */}
        <section className="px-4 space-y-4 mt-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Diagnostic Findings</h3>
          
          <div className="bg-card-dark border border-primary/20 rounded-2xl p-4 shadow-xl">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">warning</span>
                <h4 className="font-bold text-white text-sm">Anterior Pelvic Tilt</h4>
              </div>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black uppercase rounded border border-red-500/30">Severe</span>
            </div>
            <p className="text-[11px] text-white/40 mb-4 leading-relaxed">Significant forward rotation of the pelvis detected during neutral stance. Correction advised.</p>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-background-dark rounded border border-primary/30 text-primary text-[10px] font-black">Metric: 15.2°</div>
              <div className="px-3 py-1 bg-background-dark rounded border border-white/5 text-white/20 text-[10px] font-black">Target: &lt; 5°</div>
            </div>
          </div>

          <div className="bg-card-dark border border-primary/20 rounded-2xl p-4 shadow-xl">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">straighten</span>
                <h4 className="font-bold text-white text-sm">Right Shoulder Depression</h4>
              </div>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase rounded border border-yellow-500/30">Moderate</span>
            </div>
            <p className="text-[11px] text-white/40 mb-4 leading-relaxed">Right acromion dropped relative to horizontal axis. Balanced loading recommended.</p>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-background-dark rounded border border-primary/30 text-primary text-[10px] font-black">Metric: 8.4°</div>
              <div className="px-3 py-1 bg-background-dark rounded border border-white/5 text-white/20 text-[10px] font-black">Target: &lt; 3°</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-20 bg-background-dark border-t border-primary/20">
        <div className="px-2 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-primary/70 uppercase">Monthly Quota</span>
            <span className="text-[9px] font-black text-white uppercase">1 / 1 Analysis Credits Used</span>
          </div>
          <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full shadow-[0_0_10px_rgba(0,122,255,0.5)] transition-all duration-1000"></div>
          </div>
        </div>
        <button className="w-full bg-cta-orange text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cta-orange/20 uppercase text-xs">
          <span className="material-symbols-outlined font-black">picture_as_pdf</span>
          Generate PDF Report
        </button>
      </footer>

      {/* Fixed: Pass lang to BottomNav */}
      <BottomNav role="trainer" lang={lang} />
    </div>
  );
};

export default AIAnalysis;