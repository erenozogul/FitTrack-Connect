
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

const mockStudents = [
  { id: 1, name: "Ayşe Kaya",      avatar: "https://picsum.photos/seed/ayse/100/100",    plan: "Fat Loss",    progress: 68 },
  { id: 2, name: "Mehmet Yılmaz",  avatar: "https://picsum.photos/seed/mehmet/100/100",  plan: "Muscle Gain", progress: 45 },
  { id: 3, name: "Zeynep Şahin",   avatar: "https://picsum.photos/seed/zeynep/100/100",  plan: "Strength",    progress: 82 },
  { id: 4, name: "Can Öztürk",     avatar: "https://picsum.photos/seed/can/100/100",     plan: "Mobility",    progress: 31 },
  { id: 5, name: "Selin Arslan",   avatar: "https://picsum.photos/seed/selin/100/100",   plan: "Fat Loss",    progress: 57 },
];

type DayType = 'workout' | 'cardio' | 'off';
interface DaySchedule {
  type: DayType;
  title: { tr: string; en: string };
  category: { tr: string; en: string };
  duration: number;
  image: string;
  level: { tr: string; en: string };
}

const weekSchedule: Record<number, DaySchedule> = {
  16: {
    type: 'workout',
    title: { tr: 'Göğüs İdmanı - Hipertrofi', en: 'Chest Workout - Hypertrophy' },
    category: { tr: 'Kas Yapımı', en: 'Muscle Gain' },
    level: { tr: 'Orta Seviye', en: 'Intermediate' },
    duration: 55,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800',
  },
  17: {
    type: 'workout',
    title: { tr: 'Bacak İdmanı - Güç', en: 'Leg Workout - Strength' },
    category: { tr: 'Güç', en: 'Strength' },
    level: { tr: 'İleri Seviye', en: 'Advanced' },
    duration: 70,
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=800',
  },
  18: {
    type: 'off',
    title: { tr: 'Dinlenme Günü', en: 'Rest Day' },
    category: { tr: 'Off', en: 'Off' },
    level: { tr: '', en: '' },
    duration: 0,
    image: '',
  },
  19: {
    type: 'workout',
    title: { tr: 'Omuz İdmanı - Hacim', en: 'Shoulder Workout - Volume' },
    category: { tr: 'Hipertrofi', en: 'Hypertrophy' },
    level: { tr: 'Orta Seviye', en: 'Intermediate' },
    duration: 50,
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=800',
  },
  20: {
    type: 'workout',
    title: { tr: 'Kol Antrenmanı - Pump', en: 'Arm Workout - Pump' },
    category: { tr: 'Kas Yapımı', en: 'Muscle Gain' },
    level: { tr: 'Başlangıç', en: 'Beginner' },
    duration: 45,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=800',
  },
  21: {
    type: 'cardio',
    title: { tr: 'Kardiyo - Yağ Yakma', en: 'Cardio - Fat Burn' },
    category: { tr: 'Yağ Yakma', en: 'Fat Loss' },
    level: { tr: 'Orta Seviye', en: 'Intermediate' },
    duration: 40,
    image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&q=80&w=800',
  },
  22: {
    type: 'off',
    title: { tr: 'Dinlenme Günü', en: 'Rest Day' },
    category: { tr: 'Off', en: 'Off' },
    level: { tr: '', en: '' },
    duration: 0,
    image: '',
  },
};

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout, lang, role, userName }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(16);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(1);
  const t = translations[lang];
  const daySchedule = weekSchedule[selectedDay];

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const isTrainer = role === 'trainer';
  const displayUserName = userName || (isTrainer ? "Coach Mike" : "Alex Rivera");
  const selectedStudent = mockStudents.find(s => s.id === selectedStudentId) || mockStudents[0];

  // Dynamic Content Data
  const profileData = isTrainer ? {
    name: displayUserName,
    email: "coach.mike@fittrack.com",
    avatar: "https://picsum.photos/seed/mike/100/100",
    roleLabel: t.trainer,
    metrics: [
      { label: t.activeStudents, value: String(mockStudents.length), unit: "" },
      { label: lang === 'tr' ? 'İlerleme' : 'Progress', value: String(selectedStudent.progress), unit: "%" }
    ],
    heroTitle: t.coachingOverview,
    heroSub: selectedStudent.name
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
    heroSub: t.legDayDestroyer
  };

  const days = [
    { label: lang === 'tr' ? 'Pzt' : 'Mon', num: 16 },
    { label: lang === 'tr' ? 'Sal' : 'Tue', num: 17 },
    { label: lang === 'tr' ? 'Çar' : 'Wed', num: 18 },
    { label: lang === 'tr' ? 'Per' : 'Thu', num: 19 },
    { label: lang === 'tr' ? 'Cum' : 'Fri', num: 20 },
    { label: lang === 'tr' ? 'Cmt' : 'Sat', num: 21 },
    { label: lang === 'tr' ? 'Paz' : 'Sun', num: 22 },
  ];

  const dayDotColor: Record<DayType, string> = {
    workout: 'bg-primary',
    cardio: 'bg-cta-orange',
    off: 'bg-white/20',
  };

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      <header className="flex items-center justify-between p-4 md:px-8 sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`size-10 rounded-full flex items-center justify-center border overflow-hidden active:scale-95 transition-transform ${isTrainer ? 'border-primary shadow-lg shadow-primary/20' : 'bg-primary/20 border-primary/30'}`}
          >
            <img alt="Profile" className="w-full h-full object-cover" src={profileData.avatar} />
          </button>
          
          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
              <div className="absolute top-12 left-0 w-48 bg-card-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-white/5">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t.signedInAs}</p>
                  <p className="text-xs font-bold text-white truncate">{profileData.email}</p>
                </div>
                <button onClick={() => { setShowProfileMenu(false); alert(t.settings + ' - ' + t.comingSoon); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-sm">settings</span>
                  {t.settings}
                </button>
                <button 
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-white/5"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  {t.logout}
                </button>
              </div>
            </>
          )}

          <div>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{t.welcomeBack}</p>
            <h1 className="text-lg font-bold leading-tight text-white">{profileData.name}</h1>
          </div>
        </div>
        <button onClick={() => alert(t.notifications + ' - ' + t.comingSoon)} className="relative p-2 rounded-full bg-white/5 text-white">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-white dark:border-background-dark"></span>
        </button>
      </header>

      <main className="px-4 md:px-8 mt-6 space-y-8 max-w-7xl mx-auto">
        {/* Weekly Schedule */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.weeklySchedule}</h2>
            <span className="text-[10px] text-primary font-black uppercase">{t.october} 2023</span>
          </div>
          <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {days.map((day) => {
              const isActive = day.num === selectedDay;
              return (
              <div 
                key={day.num}
                onClick={() => setSelectedDay(day.num)}
                className={`flex flex-col items-center min-w-[48px] py-3 rounded-xl border transition-all cursor-pointer ${
                  isActive 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                  : 'bg-card-dark border-white/5 text-white hover:bg-white/10'
                }`}
              >
                <span className={`text-[8px] uppercase font-bold ${isActive ? 'text-white/80' : 'text-white/40'}`}>{day.label}</span>
                <span className="text-sm font-black">{day.num}</span>
                <span className={`size-1.5 rounded-full mt-0.5 ${isActive ? 'bg-white/60' : dayDotColor[weekSchedule[day.num].type]}`}></span>
              </div>
            )})}
          </div>
        </section>

        {/* Hero Section */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
            {isTrainer ? profileData.heroTitle : (daySchedule.type === 'off' ? (lang === 'tr' ? 'Günün Durumu' : 'Day Status') : t.todaysWorkout)}
          </h2>

          {/* Student Off Day Card */}
          {!isTrainer && daySchedule.type === 'off' ? (
            <div className="rounded-2xl bg-card-dark border border-white/5 overflow-hidden shadow-xl">
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
                <div className="size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-white/30">bedtime</span>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-white italic uppercase mb-2">
                    {lang === 'tr' ? 'Dinlenme Günü' : 'Rest Day'}
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                    {lang === 'tr'
                      ? 'Kasların iyileşiyor. Bugün dinlen, bol su iç ve kaliteli uyku al.'
                      : 'Your muscles are recovering. Rest, hydrate, and get quality sleep today.'}
                  </p>
                </div>
                <div className="flex gap-3 mt-2">
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-white/30 text-[9px] font-black uppercase">{lang === 'tr' ? 'Hedef' : 'Goal'}</p>
                    <p className="text-white text-sm font-bold">{lang === 'tr' ? 'Toparlanma' : 'Recovery'}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-white/30 text-[9px] font-black uppercase">{lang === 'tr' ? 'Süre' : 'Duration'}</p>
                    <p className="text-white text-sm font-bold">{lang === 'tr' ? 'Tam Gün' : 'Full Day'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] group shadow-xl">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-700"
                style={{ backgroundImage: `url('${isTrainer ? 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=800' : daySchedule.image}')` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-5 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-white text-[8px] font-black uppercase ${daySchedule.type === 'cardio' ? 'bg-cta-orange' : 'bg-primary'}`}>
                    {isTrainer ? selectedStudent.plan : daySchedule.category[lang]}
                  </span>
                  <span className="text-white/90 text-[10px] font-medium">
                    {isTrainer
                      ? `${selectedStudent.progress}% ${lang === 'tr' ? 'ilerleme' : 'progress'}`
                      : `${daySchedule.duration} ${t.mins} • ${daySchedule.level[lang]}`}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mb-4 italic uppercase leading-none">
                  {isTrainer ? selectedStudent.name : daySchedule.title[lang]}
                </h3>
                <button
                  onClick={() => navigate(isTrainer ? '/plans' : '/live')}
                  className="w-full bg-white hover:scale-[1.02] text-[#0B2B53] font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">{isTrainer ? 'event_note' : 'play_circle'}</span>
                  {isTrainer ? t.viewPlan : t.startWorkout}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Metrics Section */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">{isTrainer ? t.performance : t.dailyMetrics}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6 mb-4">
            {profileData.metrics.map((m, idx) => (
              <div key={idx} className="bg-card-dark p-4 rounded-xl border border-white/5 shadow-sm">
                <p className="text-[8px] font-black text-white/40 uppercase mb-1">{m.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tighter text-white">{m.value}</span>
                  <span className="text-[10px] text-white/30 font-bold uppercase">{m.unit}</span>
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
