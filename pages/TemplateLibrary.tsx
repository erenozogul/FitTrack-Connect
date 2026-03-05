
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { WorkoutTemplate } from '../types';

interface TemplateLibraryProps {
  onLogout: () => void;
  lang: 'tr' | 'en';
  userName?: string;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onLogout, lang, userName }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const templates: WorkoutTemplate[] = [
    {
      id: '1',
      title: 'Advanced HIIT Shred',
      level: 'Advanced',
      duration: '45 Mins',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOXuLerp0UK594Guv4nrzLeGKrxHhbsKzNPFH180S2DCKTMVRkqfNT1c8kEC_MGqoh_AGD0BeguMh2uWNvrmSkva7Z97ZXCU4Ot3uXwVE_gOU7jZn8qP6xG5jpxZ8U8A4JkRoFPln1-qy78ocnjPTSuWKRGLJ8UFfZ3F8t-qFPlqxxw77MP-39Dqqw7yR8S0mTfSaDh1BM8kRCJlZzM73-_nvDedHjFM8YPw-SHd0SNuVbyPgVTOP7eUldZyJALk5FN8WFwdspqP4',
      updatedAt: '2 days ago'
    },
    {
      id: '2',
      title: 'Foundation Mobility',
      level: 'Beginner',
      duration: '20 Mins',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3KtbbkRy-0cEnBg1lQUOODaSrdq83LjmtIHOJza6jPexcMWW4v5Af9A6n67GIuWqdsY1iHCYUQpUX8nJ0mTddt1ojyV-7GaUXfMO6zuV5Llyou-hcU3bQgNdNdtBte6nbT2ByQziu-FHmsKTIw75OyqgeRU5xjlwiSV2vpkmaD6lwYZeZOlgYnArcBD-O_hzfxTxFw8aqQoCKfrUg0Ymz0XIc_8Gp1c_qPdT8j0QdDRXCjjq1FMW3rY9A3OX5OFbPmblw5onIC9E',
      updatedAt: '1 week ago'
    },
    {
      id: '3',
      title: 'Powerlifting Basics',
      level: 'Intermediate',
      duration: '60 Mins',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHFCa6r4ZIHjp3OZoVYKYQUCi72NIUHqxK5REG5JsAkSqoWIT_p3lze9EIEX1uMjmEZrbzeIS-BOpBczT2nAD-_6u9cv9nnDvfo2MrC6mQ_0ynrVRfJswgCjUbdGNUjv0G1iAOEkl8ntW3rQk8IYYbvCX6zcotX2BbC-ifevUbN_SzV7rewY78w8iMlycQ_tpllWFq-t77D25odxjHEgHOUZVuu0y2aezadmx0goPubKgXPmOWNIYpiww1ClxawxwhGCrxUTQvN3M',
      updatedAt: '5 days ago'
    }
  ];

  return (
    <div className="min-h-screen bg-background-dark pb-32">
      <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined">folder</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Template Library</h1>
          </div>
          <div className="flex gap-2 relative">
            <button className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-white/40">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="size-10 rounded-full border-2 border-primary overflow-hidden active:scale-95 transition-transform"
            >
              <img className="w-full h-full object-cover" src="https://picsum.photos/seed/coach/100/100" alt="Profile" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                <div className="absolute top-12 right-0 w-48 bg-card-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-white/5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Signed in as {userName || 'Coach'}</p>
                    <p className="text-xs font-bold text-white truncate">coach@fittrack.com</p>
                  </div>
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 mt-6 space-y-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20">search</span>
          <input 
            className="w-full bg-card-dark border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-primary focus:border-primary transition-all"
            placeholder="Search workout templates..."
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          {['All', 'Fat Loss', 'Muscle Gain', 'Mobility', 'Strength'].map((cat, i) => (
            <button key={cat} className={`flex h-10 shrink-0 items-center justify-center rounded-full px-6 font-semibold text-xs transition-colors ${i === 0 ? 'bg-primary text-white' : 'bg-card-dark border border-white/5 text-white/60'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="rounded-xl border-2 border-dashed border-white/10 bg-card-dark p-6 text-center group cursor-pointer hover:border-primary/60 transition-all">
          <div className="flex flex-col items-center gap-2">
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">video_call</span>
            </div>
            <h3 className="font-bold text-lg text-primary">New Media Asset</h3>
            <p className="text-xs text-white/40">Upload workout videos or animations (MP4, GIF)</p>
            <button className="mt-4 px-6 py-2 bg-cta-orange text-white rounded-lg text-xs font-bold shadow-lg shadow-cta-orange/20">
              Upload Video
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="group relative overflow-hidden rounded-xl bg-card-dark border border-white/5 hover:border-primary/40 transition-all">
              <div className="flex h-32">
                <div className="w-1/3 relative">
                  <img className="w-full h-full object-cover" src={template.image} alt={template.title} />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background-dark/80"></div>
                </div>
                <div className="w-2/3 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{template.title}</h3>
                      <button className="text-white/20 hover:text-white">
                        <span className="material-symbols-outlined text-xl">more_vert</span>
                      </button>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        template.level === 'Advanced' ? 'bg-red-500/20 text-red-400' : 
                        template.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {template.level}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-black uppercase tracking-wider">
                        {template.duration}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-white/40">Updated {template.updatedAt}</p>
                    <button 
                      onClick={() => navigate('/live')}
                      className="flex items-center gap-1 bg-cta-orange text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase"
                    >
                      Assign <span className="material-symbols-outlined text-[14px]">person_add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button className="fixed bottom-24 right-6 size-14 bg-cta-orange text-white rounded-full shadow-lg shadow-cta-orange/20 flex items-center justify-center group hover:scale-110 transition-transform z-40">
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </button>

      <BottomNav role="trainer" lang={lang} />
    </div>
  );
};

export default TemplateLibrary;
