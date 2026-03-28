
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
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedStudentId, setSelectedStudentId] = useState<number>(1);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  // Schedule state with localStorage overrides
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(() => {
    try {
      const saved = localStorage.getItem('fittrack_schedule');
      return saved ? { ...weekSchedule, ...JSON.parse(saved) } : weekSchedule;
    } catch { return weekSchedule; }
  });

  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', type: 'workout' as DayType, duration: 0, category: '' });
  const [showDayAssignments, setShowDayAssignments] = useState(false);

  const loadAssignments = (): Record<string, Array<{ studentId: number; studentName: string; workoutId: string; workoutName: string; startTime?: string; endTime?: string }>> => {
    try { return JSON.parse(localStorage.getItem('fittrack_assignments') || '{}'); } catch { return {}; }
  };

  const getDayDateKey = (dayNum: number) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-${dayNum.toString().padStart(2, '0')}`;
  };

  const t = translations[lang];

  const defaultDaySchedule: DaySchedule = {
    type: 'off',
    title: { tr: 'Dinlenme Günü', en: 'Rest Day' },
    category: { tr: 'Off', en: 'Off' },
    level: { tr: '', en: '' },
    duration: 0,
    image: '',
  };
  const daySchedule = schedule[selectedDay] ?? defaultDaySchedule;

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const isTrainer = role === 'trainer';
  const displayUserName = userName || (isTrainer ? "Coach Mike" : "Alex Rivera");
  const selectedStudent = mockStudents.find(s => s.id === selectedStudentId) || mockStudents[0];

  const handleDayClick = (dayNum: number) => {
    setSelectedDay(dayNum);
  };

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
      { label: t.weight, value: localStorage.getItem('fittrack_weight') || '', unit: localStorage.getItem('fittrack_weight') ? "kg" : "" },
      { label: t.bodyFat, value: "", unit: "" }
    ],
    heroTitle: t.todaysWorkout,
    heroSub: t.legDayDestroyer
  };

  const dayLabels = lang === 'tr'
    ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Generate 7-day strip starting from Monday of current week
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun,1=Mon,...6=Sat
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label: dayLabels[i], num: d.getDate() };
  });

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
            <span className="text-[10px] text-primary font-black uppercase">
              {new Date().toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {days.map((day) => {
              const isActive = day.num === selectedDay;
              return (
                <div
                  key={day.num}
                  onClick={() => handleDayClick(day.num)}
                  className={`flex flex-col items-center min-w-[48px] py-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                      : 'bg-card-dark border-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  <span className={`text-[8px] uppercase font-bold ${isActive ? 'text-white/80' : 'text-white/40'}`}>{day.label}</span>
                  <span className="text-sm font-black">{day.num}</span>
                  {isTrainer ? (
                    (() => {
                      const count = (loadAssignments()[getDayDateKey(day.num)] || []).length;
                      return count > 0 ? (
                        <span className="text-[8px] font-black text-primary mt-0.5">{count}</span>
                      ) : (
                        <span className={`size-1.5 rounded-full mt-0.5 ${isActive ? 'bg-white/60' : 'bg-white/10'}`}></span>
                      );
                    })()
                  ) : (
                    <span className={`size-1.5 rounded-full mt-0.5 ${isActive ? 'bg-white/60' : dayDotColor[schedule[day.num].type]}`}></span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Trainer: Day Sessions List (inline) */}
        {isTrainer && (
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {lang === 'tr' ? `${selectedDay} ${new Date().toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'long' })} – Seanslar` : `${new Date().toLocaleString('en-US', { month: 'long' })} ${selectedDay} – Sessions`}
              </h2>
              <button
                onClick={() => navigate('/library')}
                className="flex items-center gap-1 text-primary text-[10px] font-black hover:underline"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {lang === 'tr' ? 'Ekle' : 'Add'}
              </button>
            </div>
            {(() => {
              const dayAssignments = loadAssignments()[getDayDateKey(selectedDay)] || [];
              if (dayAssignments.length === 0) {
                return (
                  <div className="flex flex-col items-center gap-3 py-8 bg-card-dark rounded-2xl border border-white/5">
                    <span className="material-symbols-outlined text-3xl text-white/20">event_busy</span>
                    <p className="text-white/30 text-xs font-semibold">
                      {lang === 'tr' ? 'Bu gün için seans atanmamış' : 'No sessions assigned for this day'}
                    </p>
                  </div>
                );
              }
              return (
                <div className="flex flex-col gap-2">
                  {dayAssignments.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-card-dark border border-white/5 rounded-xl px-4 py-3">
                      <img
                        src={`https://picsum.photos/seed/${a.studentName.split(' ')[0].toLowerCase()}/100/100`}
                        alt={a.studentName}
                        className="size-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{a.studentName}</p>
                        <p className="text-xs text-primary/80 font-semibold mt-0.5 truncate">{a.workoutName}</p>
                      </div>
                      {(a.startTime || a.endTime) && (
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs font-black text-white">{a.startTime}</p>
                          <p className="text-[10px] text-white/40 font-semibold">{a.endTime}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        )}

        {/* Hero Section — student only */}
        {!isTrainer && (
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
            {daySchedule.type === 'off' ? (lang === 'tr' ? 'Günün Durumu' : 'Day Status') : t.todaysWorkout}
          </h2>

          {/* Student Off Day Card */}
          {daySchedule.type === 'off' ? (
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
                style={{ backgroundImage: `url('${daySchedule.image}')` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-5 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-white text-[8px] font-black uppercase ${daySchedule.type === 'cardio' ? 'bg-cta-orange' : 'bg-primary'}`}>
                    {daySchedule.category[lang]}
                  </span>
                  <span className="text-white/90 text-[10px] font-medium">
                    {`${daySchedule.duration} ${t.mins} • ${daySchedule.level[lang]}`}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mb-4 italic uppercase leading-none">
                  {daySchedule.title[lang]}
                </h3>
                <button
                  onClick={() => setShowWorkoutModal(true)}
                  className="w-full bg-white hover:scale-[1.02] text-[#0B2B53] font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">play_circle</span>
                  {t.startWorkout}
                </button>
              </div>
            </div>
          )}
        </section>
        )}

        {/* Metrics Section */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">{isTrainer ? t.performance : t.dailyMetrics}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-6 mb-4">
            {profileData.metrics.map((m, idx) => (
              <div key={idx} className="bg-card-dark p-4 rounded-xl border border-white/5 shadow-sm">
                <p className="text-[8px] font-black text-white/40 uppercase mb-1">{m.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black tracking-tighter ${m.value ? 'text-white' : 'text-white/20'}`}>
                    {m.value || '—'}
                  </span>
                  {m.value && <span className="text-[10px] text-white/30 font-bold uppercase">{m.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav role={role} lang={lang} />

      {/* Workout Start Modal (student only) */}
      {showWorkoutModal && daySchedule.type !== 'off' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowWorkoutModal(false)}>
          <div className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{daySchedule.category[lang]}</p>
                <h2 className="text-xl font-black text-white mt-1">{daySchedule.title[lang]}</h2>
              </div>
              <button onClick={() => setShowWorkoutModal(false)} className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            {/* Workout info */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                <p className="text-white/40 text-[9px] font-black uppercase">{lang === 'tr' ? 'Süre' : 'Duration'}</p>
                <p className="text-white font-black">{daySchedule.duration} dk</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                <p className="text-white/40 text-[9px] font-black uppercase">{lang === 'tr' ? 'Seviye' : 'Level'}</p>
                <p className="text-white font-black">{daySchedule.level[lang]}</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                <p className="text-white/40 text-[9px] font-black uppercase">{lang === 'tr' ? 'Tip' : 'Type'}</p>
                <p className="text-white font-black">{daySchedule.type === 'cardio' ? 'Kardiyo' : 'İdman'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowWorkoutModal(false)}
              className="w-full bg-primary text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">play_circle</span>
              {lang === 'tr' ? 'Antrenmanı Başlat' : 'Start Workout'}
            </button>
          </div>
        </div>
      )}

      {/* Trainer Day Assignments Modal */}
      {isTrainer && showDayAssignments && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowDayAssignments(false)}>
          <div className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">
                  {lang === 'tr' ? `${selectedDay} Mart` : `March ${selectedDay}`}
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {(() => {
                    const assignments = loadAssignments()[getDayDateKey(selectedDay)] || [];
                    return assignments.length > 0
                      ? `${assignments.length} ${lang === 'tr' ? 'seans' : 'session'}`
                      : lang === 'tr' ? 'Seans yok' : 'No sessions';
                  })()}
                </p>
              </div>
              <button onClick={() => setShowDayAssignments(false)} className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {(() => {
              const assignments = loadAssignments()[getDayDateKey(selectedDay)] || [];
              if (assignments.length === 0) {
                return (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="size-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-white/20">event_busy</span>
                    </div>
                    <p className="text-white/30 text-sm font-semibold text-center">
                      {lang === 'tr' ? 'Bu gün için seans atanmamış' : 'No sessions assigned for this day'}
                    </p>
                    <button
                      onClick={() => { setShowDayAssignments(false); navigate('/library'); }}
                      className="mt-2 px-5 py-2.5 bg-primary text-white rounded-xl font-black text-xs flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      {lang === 'tr' ? 'Seans Ata' : 'Assign Session'}
                    </button>
                  </div>
                );
              }
              return (
                <div className="flex flex-col gap-3">
                  {assignments.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-xl p-3.5">
                      <img
                        src={`https://picsum.photos/seed/${a.studentName.split(' ')[0].toLowerCase()}/100/100`}
                        alt={a.studentName}
                        className="size-10 rounded-full object-cover border border-white/10"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{a.studentName}</p>
                        <p className="text-xs text-primary font-semibold mt-0.5">{a.workoutName}</p>
                        {(a.startTime || a.endTime) && (
                          <p className="text-[10px] text-white/40 font-semibold mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">schedule</span>
                            {a.startTime}{a.endTime ? ` – ${a.endTime}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-white/20 text-lg">fitness_center</span>
                    </div>
                  ))}
                  <button
                    onClick={() => { setShowDayAssignments(false); navigate('/library'); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/30 text-primary text-sm font-black hover:bg-primary/10 active:scale-95 transition-all mt-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    {lang === 'tr' ? 'Seans Ekle' : 'Add Session'}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Trainer Edit Day Modal */}
      {isTrainer && editingDay !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={() => setEditingDay(null)}>
          <div className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">{lang === 'tr' ? `${editingDay} Mart - Düzenle` : `March ${editingDay} - Edit`}</h2>
              <button onClick={() => setEditingDay(null)} className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50"><span className="material-symbols-outlined text-lg">close</span></button>
            </div>
            {/* Type selector */}
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{lang === 'tr' ? 'Tür' : 'Type'}</p>
              <div className="flex gap-2">
                {(['workout', 'cardio', 'off'] as DayType[]).map(type => (
                  <button key={type} onClick={() => setEditForm(f => ({...f, type}))}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-colors ${editForm.type === type ? 'bg-primary text-white' : 'bg-white/5 text-white/50'}`}>
                    {type === 'workout' ? (lang === 'tr' ? 'İdman' : 'Workout') : type === 'cardio' ? 'Kardiyo' : (lang === 'tr' ? 'Off' : 'Rest')}
                  </button>
                ))}
              </div>
            </div>
            {/* Title and Duration inputs */}
            {editForm.type !== 'off' && (
              <>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{lang === 'tr' ? 'Başlık' : 'Title'}</p>
                  <input value={editForm.title} onChange={e => setEditForm(f => ({...f, title: e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/60" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{lang === 'tr' ? 'Süre (dk)' : 'Duration (min)'}</p>
                  <input type="number" value={editForm.duration} onChange={e => setEditForm(f => ({...f, duration: parseInt(e.target.value) || 0}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/60" />
                </div>
              </>
            )}
            <button onClick={() => {
              const updated = { ...schedule };
              updated[editingDay] = {
                ...schedule[editingDay],
                type: editForm.type,
                title: { tr: editForm.title, en: editForm.title },
                category: editForm.type === 'off' ? { tr: 'Off', en: 'Off' } : { tr: editForm.category || editForm.title, en: editForm.category || editForm.title },
                duration: editForm.type === 'off' ? 0 : editForm.duration,
                level: schedule[editingDay].level,
                image: schedule[editingDay].image,
              };
              setSchedule(updated);
              // save only the overrides to localStorage
              const overrides: Record<number, DaySchedule> = {};
              Object.keys(updated).forEach(k => { overrides[parseInt(k)] = updated[parseInt(k)]; });
              localStorage.setItem('fittrack_schedule', JSON.stringify(overrides));
              setEditingDay(null);
            }}
              className="w-full bg-primary text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-lg">check</span>
              {lang === 'tr' ? 'Kaydet' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
