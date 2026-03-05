
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { translations } from '../App';

interface StudentDashboardProps {
  onLogout: () => void;
  lang: 'tr' | 'en';
  role: 'trainer' | 'student';
  userName?: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout, lang, role, userName }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const t = translations[lang];

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const isTrainer = role === 'trainer';
  const displayUserName = userName || (isTrainer ? "Coach Mike" : "Alex Rivera");

  // Dynamic Content Data
  const profileData = isTrainer ? {
    name: displayUserName,
    email: "coach.mike@fittrack.com",
    avatar: "https://picsum.photos/seed/mike/100/100",
    roleLabel: t.trainer,
    metrics: [
      { label: t.activeStudents, value: "12", unit: "" },
      { label: t.totalRevenue, value: "14.2", unit: "k TL" }
    ],
    heroTitle: t.coachingOverview,
    heroSub: lang === 'tr' ? 'Bugünkü Seanslar' : "Today's Sessions"
  } : {
    name: displayUserName,
    email: "alex.rivera@fittrack.com",
    avatar: "https://picsum.photos/seed/alex/100/100",
    roleLabel: t.student,
    metrics: [
      { label: t.weight, value: "82.4", unit: "kg" },
      { label: t.bodyFat, value: "14.2", unit: "%" }
    ],
    heroTitle: t.todaysWorkout,
    heroSub: lang === 'tr' ? 'Bacak Günü - Parçalayıcı' : 'Leg Day - Destroyer'
  };

  const days = [
    { label: lang === 'tr' ? 'Pzt' : 'Mon', num: 16 },
    { label: lang === 'tr' ? 'Sal' : 'Tue', num: 17, hasEvent: true },
    { label: lang === 'tr' ? 'Çar' : 'Wed', num: 18, isActive: true },
    { label: lang === 'tr' ? 'Per' : 'Thu', num: 19 },
    { label: lang === 'tr' ? 'Cum' : 'Fri', num: 20, hasEvent: true },
    { label: lang === 'tr' ? 'Cmt' : 'Sat', num: 21 },
    { label: lang === 'tr' ? 'Paz' : 'Sun', num: 22 }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark pb-32 transition-colors">
      <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`size-10 rounded-full flex items-center justify-center border overflow-hidden active:scale-95 transition-transform ${isTrainer ? 'border-primary shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-primary/20 border-slate-200 dark:border-primary/30'}`}
          >
            <img alt="Profile" className="w-full h-full object-cover" src={profileData.avatar} />
          </button>
          
          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
              <div className="absolute top-12 left-0 w-48 bg-white dark:bg-card-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-white/5">
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Signed in as</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{profileData.email}</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-sm">settings</span>
                  {t.settings}
                </button>
                <button 
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-slate-100 dark:border-white/5"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  {t.logout}
                </button>
              </div>
            </>
          )}

          <div>
            <p className="text-[10px] text-primary dark:text-primary/70 font-bold uppercase tracking-widest">{t.welcomeBack}</p>
            <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">{profileData.name}</h1>
          </div>
        </div>
        <button className="relative p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-white dark:border-background-dark"></span>
        </button>
      </header>

      <main className="px-4 mt-6 space-y-6">
        {/* Weekly Schedule */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">{t.weeklySchedule}</h2>
            <span className="text-[10px] text-primary font-black uppercase">{lang === 'tr' ? 'Ekim' : 'October'} 2023</span>
          </div>
          <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {days.map((day) => (
              <div 
                key={day.num}
                className={`flex flex-col items-center min-w-[48px] py-3 rounded-xl border transition-all ${
                  day.isActive 
                  ? 'bg-primary border-primary text-white dark:text-background-dark shadow-lg shadow-primary/20' 
                  : 'bg-slate-50 dark:bg-card-dark border-slate-100 dark:border-white/5 text-slate-900 dark:text-white'
                }`}
              >
                <span className={`text-[8px] uppercase font-bold ${day.isActive ? 'text-white/80 dark:text-background-dark/80' : 'text-slate-400'}`}>{day.label}</span>
                <span className="text-sm font-black">{day.num}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Hero Section */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 mb-3">{profileData.heroTitle}</h2>
          <div className="relative overflow-hidden rounded-2xl aspect-[16/9] group shadow-xl">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-80 dark:opacity-60 group-hover:scale-105 transition-transform duration-700"
              style={{ backgroundImage: `url('${isTrainer ? 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=800' : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk6wWEzhw3jnLB_qr5kd4g1gRbYMIdoym9ZI66uFW2DA-v6zPbNfGdqWptiUWL__knkGgnjMmOth2FPtpWFI9KRgQUgs1cmnlQDddRE-iiNmf4kGa2QJ4q_QEfnQVYmdv9xuDQ1Vxxy7qiGWkTeu35C7-4rQHGWZ4VciIwEaS76Gbp6Ncbfdm3IZvBmw1DG42P8bhIaLHDAVA8Vn4ekmuvxovtDKwX1YVM7APcaAwUWJT85rT1Exf5A4m6w1GTs1da_oySIVhOP7o' }')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent dark:from-background-dark dark:via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-5 w-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-primary text-white text-[8px] font-black uppercase">{isTrainer ? 'Pro' : t.advanced}</span>
                <span className="text-white/90 text-[10px] font-medium">{isTrainer ? 'Dashboard' : `60 ${t.mins} • Hypertrophy`}</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-4 italic uppercase leading-none">{profileData.heroSub}</h3>
              <button 
                onClick={() => navigate(isTrainer ? '/library' : '/live')}
                className={`w-full ${isTrainer ? 'bg-primary' : 'bg-cta-orange'} hover:scale-[1.02] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95`}
              >
                <span className="material-symbols-outlined text-xl">{isTrainer ? 'folder' : 'play_circle'}</span>
                {isTrainer ? t.library : t.startWorkout}
              </button>
            </div>
          </div>
        </section>

        {/* Metrics Section */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 mb-3">{isTrainer ? lang === 'tr' ? 'Performans' : 'Performance' : t.dailyMetrics}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {profileData.metrics.map((m, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-card-dark p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                <p className="text-[8px] font-black text-slate-400 dark:text-white/40 uppercase mb-1">{m.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">{m.value}</span>
                  <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav role={role} lang={lang} />
    </div>
  );
};

export default StudentDashboard;
