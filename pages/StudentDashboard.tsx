
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { translations } from '../App';
import { getNotifications, getUnreadCount, markAllRead, AppNotification } from '../utils/notifications';

interface StudentDashboardProps {
  onLogout: () => void;
  lang: 'tr' | 'en';
  role: 'trainer' | 'student';
  userName?: string;
}


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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const todayKey = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [trainerStats, setTrainerStats] = useState<{ totalStudents: number; avgSessions: number } | null>(null);
  const [assignments, setAssignments] = useState<Record<string, any[]>>(() => {
    try { return JSON.parse(localStorage.getItem('fittrack_assignments') || '{}'); } catch { return {}; }
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editError, setEditError] = useState('');
  const closeEditModal = () => { setEditingAssignment(null); setEditError(''); };

  const handleCompleteAssignment = async (id: number, dateKey: string, currentCompleted: boolean) => {
    const token = localStorage.getItem('fittrack_token');
    if (!token) return;
    setCompletingId(id);
    try {
      await fetch(`/api/assignments/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      setAssignments(prev => {
        const updated = { ...prev };
        if (updated[dateKey]) {
          updated[dateKey] = updated[dateKey].map((a: any) =>
            a.id === id ? { ...a, completed: !currentCompleted } : a
          );
        }
        return updated;
      });
    } catch {}
    setCompletingId(null);
  };

  const handleDeleteAssignment = async (id: number, dateKey: string) => {
    const token = localStorage.getItem('fittrack_token');
    if (!token) return;
    setDeletingId(id);
    try {
      await fetch(`/api/assignments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setAssignments(prev => {
        const updated = { ...prev };
        if (updated[dateKey]) {
          updated[dateKey] = updated[dateKey].filter(a => a.id !== id);
          if (updated[dateKey].length === 0) delete updated[dateKey];
        }
        return updated;
      });
    } catch {}
    setDeletingId(null);
  };

  useEffect(() => {
    setNotificationsList(getNotifications());
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    const fetchUnreadMsgs = () => {
      const token = localStorage.getItem('fittrack_token');
      if (!token) return;
      fetch('/api/conversations', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((convs: any[]) => {
          const count = convs.filter(c => c.unread > 0).length;
          setUnreadMsgCount(count);
        })
        .catch(() => {});
    };
    fetchUnreadMsgs();
    const interval = setInterval(fetchUnreadMsgs, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (role !== 'trainer') return;
    const token = localStorage.getItem('fittrack_token');
    if (!token) return;
    fetch('/api/trainer/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const total = data.totalStudents || 0;
        const totalSessions = data.students?.reduce((s: number, st: any) => s + (st.totalAssignments || 0), 0) || 0;
        const avg = total > 0 ? Math.round(totalSessions / total) : 0;
        setTrainerStats({ totalStudents: total, avgSessions: avg });
      })
      .catch(() => {});
  }, [role]);

  useEffect(() => {
    const token = localStorage.getItem('fittrack_token');
    if (!token) return;
    fetch('/api/assignments', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        // Convert flat array to grouped-by-date format
        const grouped: Record<string, any[]> = {};
        // toLocalDate: convert any date string (UTC ISO or YYYY-MM-DD) to local YYYY-MM-DD
        const toLocalDate = (d: string): string => {
          if (!d) return '';
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return d.slice(0, 10);
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        data.forEach(a => {
          const key = toLocalDate(String(a.assignedDate));
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ id: a.id, studentId: a.studentId, studentName: a.studentName, workoutId: a.workoutId, workoutName: a.workoutName, startTime: a.startTime, endTime: a.endTime, completed: a.completed ?? false, exercises: a.exercises || [] });
        });
        localStorage.setItem('fittrack_assignments', JSON.stringify(grouped));
        setAssignments(grouped);
      })
      .catch(() => {});
  }, []);

  // Read real user data from localStorage
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('fittrack_user') || '{}'); } catch { return {}; } })();
  const storedAvatar = localStorage.getItem('fittrack_avatar') || null;
  const realEmail = storedUser.email || (role === 'trainer' ? "coach@fittrack.com" : "user@fittrack.com");
  const realAvatar = storedAvatar || (role === 'trainer' ? "https://picsum.photos/seed/mike/100/100" : "https://picsum.photos/seed/alex/100/100");

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

  // selectedDay is now a full "YYYY-MM-DD" string — no need for getDayDateKey
  const getDayDateKey = (dateKey: string) => dateKey;

  const t = translations[lang];

  const defaultDaySchedule: DaySchedule = {
    type: 'off',
    title: { tr: 'Dinlenme Günü', en: 'Rest Day' },
    category: { tr: 'Off', en: 'Off' },
    level: { tr: '', en: '' },
    duration: 0,
    image: '',
  };
  const selectedDayNum = new Date(selectedDay + 'T12:00:00').getDate();
  const daySchedule = schedule[selectedDayNum] ?? defaultDaySchedule;

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const isTrainer = role === 'trainer';
  const displayUserName = userName || (isTrainer ? "Antrenör" : "Öğrenci");

  const handleDayClick = (dateKey: string) => {
    setSelectedDay(dateKey);
  };

  // Dynamic Content Data
  const profileData = isTrainer ? {
    name: displayUserName,
    email: realEmail,
    avatar: realAvatar,
    roleLabel: t.trainer,
    metrics: [
      { label: t.activeStudents, value: trainerStats ? String(trainerStats.totalStudents) : '—', unit: "" },
      { label: lang === 'tr' ? 'Ort. Seans' : 'Avg. Sessions', value: trainerStats ? String(trainerStats.avgSessions) : '—', unit: "" }
    ],
    heroTitle: t.coachingOverview,
    heroSub: ''
  } : {
    name: displayUserName,
    email: realEmail,
    avatar: realAvatar,
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
    const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { label: dayLabels[i], num: d.getDate(), dateKey };
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
                <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors">
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
        <div className="flex items-center gap-2">
          {/* Chat button */}
          <button
            onClick={() => { setUnreadMsgCount(0); navigate('/messages'); }}
            className="relative p-2 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            {unreadMsgCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-black leading-none">
                {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
              </span>
            )}
          </button>

        <div className="relative">
          <button
            onClick={() => {
              const opening = !showNotifications;
              setShowNotifications(opening);
              if (opening) {
                markAllRead();
                setNotificationsList(getNotifications());
                setUnreadCount(0);
              }
            }}
            className="relative p-2 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full border border-background-dark"></span>
            )}
          </button>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute top-12 right-0 w-72 bg-card-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <p className="text-xs font-black text-white uppercase tracking-widest">{lang === 'tr' ? 'Bildirimler' : 'Notifications'}</p>
                  <button onClick={() => setShowNotifications(false)} className="text-white/30 hover:text-white">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
                {notificationsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
                    <span className="material-symbols-outlined text-4xl text-white/20">notifications_off</span>
                    <p className="text-white/40 text-xs font-medium text-center">
                      {lang === 'tr' ? 'Henüz bildirim yok' : 'No notifications yet'}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                    {notificationsList.map(n => {
                      const iconMap = { assignment: 'event_available', message: 'chat', note: 'sticky_note_2', system: 'info' };
                      const colorMap = { assignment: 'text-primary', message: 'text-cta-orange', note: 'text-yellow-400', system: 'text-white/40' };
                      return (
                        <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                          <span className={`material-symbols-outlined text-xl mt-0.5 shrink-0 ${colorMap[n.type]}`}>{iconMap[n.type]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold leading-tight">{n.title}</p>
                            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{n.body}</p>
                          </div>
                          <span className="text-white/30 text-[10px] shrink-0 mt-0.5">{n.time}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
        </div>
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
              const isActive = day.dateKey === selectedDay;
              return (
                <div
                  key={day.dateKey}
                  onClick={() => handleDayClick(day.dateKey)}
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
                      const count = (assignments[day.dateKey] || []).length;
                      return count > 0 ? (
                        <span className="text-[8px] font-black text-primary mt-0.5">{count}</span>
                      ) : (
                        <span className={`size-1.5 rounded-full mt-0.5 ${isActive ? 'bg-white/60' : 'bg-white/10'}`}></span>
                      );
                    })()
                  ) : (
                    <span className={`size-1.5 rounded-full mt-0.5 ${isActive ? 'bg-white/60' : dayDotColor[(schedule[day.num] ?? defaultDaySchedule).type]}`}></span>
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
                {(() => {
                  const d = new Date(selectedDay + 'T12:00:00');
                  const dayNum = d.getDate();
                  const monthStr = d.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'long' });
                  return lang === 'tr' ? `${dayNum} ${monthStr} – Seanslar` : `${monthStr} ${dayNum} – Sessions`;
                })()}
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
              const dayAssignments = assignments[selectedDay] || [];
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
                    <div key={a.id ?? idx} className="flex items-center gap-3 bg-card-dark border border-white/5 rounded-xl px-4 py-3">
                      <img
                        src={`https://picsum.photos/seed/${a.studentName.split(' ')[0].toLowerCase()}/100/100`}
                        alt={a.studentName}
                        className="size-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{a.studentName}</p>
                        <p className="text-xs text-primary/80 font-semibold mt-0.5 truncate">{a.workoutName}</p>
                        {(a.startTime || a.endTime) && (
                          <p className="text-[10px] text-white/50 font-semibold mt-0.5">{a.startTime}{a.endTime ? ` – ${a.endTime}` : ''}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingAssignment({ ...a, dateKey: selectedDay }); setEditStartTime(a.startTime || ''); setEditEndTime(a.endTime || ''); }}
                          className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary/20 text-white/40 hover:text-primary transition-colors"
                          title={lang === 'tr' ? 'Düzenle' : 'Edit'}
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => a.id && handleDeleteAssignment(a.id, selectedDay)}
                          disabled={deletingId === a.id}
                          className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors disabled:opacity-40"
                          title={lang === 'tr' ? 'Sil' : 'Delete'}
                        >
                          {deletingId === a.id
                            ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            : <span className="material-symbols-outlined text-sm">delete</span>
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        )}

        {/* Student: Assigned Sessions for selected day */}
        {!isTrainer && (assignments[selectedDay] || []).length > 0 && (
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
              {lang === 'tr' ? 'Atanan Seanslar' : 'Assigned Sessions'}
            </h2>
            <div className="flex flex-col gap-2">
              {(assignments[selectedDay] || []).map((a: any, idx: number) => {
                const isExpanded = expandedAssignmentId === (a.id ?? idx);
                const exercises: { name: string; target: { tr: string; en: string } }[] = Array.isArray(a.exercises) ? a.exercises : [];
                return (
                  <div key={a.id ?? idx} className={`rounded-xl border transition-all ${a.completed ? 'bg-green-500/10 border-green-500/20' : 'bg-card-dark border-white/5'}`}>
                    {/* Main row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${a.completed ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                        <span className={`material-symbols-outlined text-lg ${a.completed ? 'text-green-400' : 'text-primary'}`}>
                          {a.completed ? 'check_circle' : 'fitness_center'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${a.completed ? 'text-white/50 line-through' : 'text-white'}`}>{a.workoutName}</p>
                        {(a.startTime || a.endTime) && (
                          <p className="text-[10px] text-white/40 font-semibold mt-0.5">{a.startTime}{a.endTime ? ` – ${a.endTime}` : ''}</p>
                        )}
                      </div>
                      {/* Expand exercises button */}
                      {exercises.length > 0 && (
                        <button
                          onClick={() => setExpandedAssignmentId(isExpanded ? null : (a.id ?? idx))}
                          className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors active:scale-95"
                          title={lang === 'tr' ? 'Hareketler' : 'Exercises'}
                        >
                          <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                      )}
                      <button
                        onClick={() => a.id && handleCompleteAssignment(a.id, selectedDay, a.completed)}
                        disabled={completingId === a.id}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1 ${
                          a.completed
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-primary text-white hover:bg-primary/80'
                        }`}
                      >
                        {completingId === a.id
                          ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                          : <span className="material-symbols-outlined text-sm">{a.completed ? 'undo' : 'check'}</span>
                        }
                        {a.completed
                          ? (lang === 'tr' ? 'Geri Al' : 'Undo')
                          : (lang === 'tr' ? 'Tamamla' : 'Complete')
                        }
                      </button>
                    </div>
                    {/* Expanded exercise list */}
                    {isExpanded && exercises.length > 0 && (
                      <div className="border-t border-white/5 px-4 pb-3 pt-2 flex flex-col gap-2">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">
                          {lang === 'tr' ? 'Hareketler' : 'Exercises'}
                        </p>
                        {exercises.map((ex, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-primary text-sm">exercise</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white">{ex.name}</p>
                              <p className="text-[10px] text-white/40 truncate">{ex.target[lang]}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Hero Section — student only, hidden when assignments exist */}
        {!isTrainer && (assignments[selectedDay] || []).length === 0 && (
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
          {isTrainer && (
            <button
              onClick={() => navigate('/analytics')}
              className="w-full flex items-center justify-between bg-card-dark border border-white/5 rounded-xl px-4 py-3.5 hover:border-primary/30 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                <span className="text-white text-sm font-bold">{lang === 'tr' ? 'Analitik Paneli Görüntüle' : 'View Analytics Panel'}</span>
              </div>
              <span className="material-symbols-outlined text-white/20">chevron_right</span>
            </button>
          )}
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
                  {(() => { const d = new Date(selectedDay + 'T12:00:00'); return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long' }); })()}
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {(() => {
                    const dayItems = assignments[selectedDay] || [];
                    return dayItems.length > 0
                      ? `${dayItems.length} ${lang === 'tr' ? 'seans' : 'session'}`
                      : lang === 'tr' ? 'Seans yok' : 'No sessions';
                  })()}
                </p>
              </div>
              <button onClick={() => setShowDayAssignments(false)} className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {(() => {
              const dayItems = assignments[selectedDay] || [];
              if (dayItems.length === 0) {
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
                  {dayItems.map((a, idx) => (
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
      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4" onClick={closeEditModal}>
          <div className="w-full max-w-sm bg-card-dark border border-white/10 rounded-2xl p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">{lang === 'tr' ? 'Seansı Düzenle' : 'Edit Session'}</h2>
                <p className="text-xs text-white/40 mt-0.5">{editingAssignment.studentName} · {editingAssignment.workoutName}</p>
              </div>
              <button onClick={closeEditModal} className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">{lang === 'tr' ? 'Başlangıç' : 'Start'}</label>
                <input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-primary/50" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">{lang === 'tr' ? 'Bitiş' : 'End'}</label>
                <input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            {editError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
                <span className="material-symbols-outlined text-red-400 text-base">error</span>
                <p className="text-red-400 text-xs font-bold">{editError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={closeEditModal}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 transition-colors">
                {lang === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  const token = localStorage.getItem('fittrack_token');
                  if (!token || !editingAssignment.id) return;
                  setEditError('');
                  // Check conflict locally: same date, overlapping time (exclude self)
                  const dayItems = assignments[editingAssignment.dateKey] || [];
                  const hasConflict = dayItems.some((a: any) =>
                    a.id !== editingAssignment.id &&
                    a.startTime && a.endTime && editStartTime && editEndTime &&
                    a.startTime < editEndTime && a.endTime > editStartTime
                  );
                  if (hasConflict) {
                    setEditError(lang === 'tr' ? 'Bu saat aralığında zaten bir seans var!' : 'A session already exists in this time slot!');
                    return;
                  }
                  // Delete old and re-create with new times (API has no PATCH endpoint)
                  await fetch(`/api/assignments/${editingAssignment.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                  const res = await fetch('/api/assignments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      studentId: editingAssignment.studentId,
                      studentName: editingAssignment.studentName,
                      workoutId: editingAssignment.workoutId,
                      workoutName: editingAssignment.workoutName,
                      assignedDate: editingAssignment.dateKey,
                      startTime: editStartTime,
                      endTime: editEndTime,
                    }),
                  });
                  if (res.status === 409) {
                    setEditError(lang === 'tr' ? 'Bu saat aralığında zaten bir seans var!' : 'A session already exists in this time slot!');
                    return;
                  }
                  if (res.ok) {
                    const newA = await res.json();
                    setAssignments(prev => {
                      const updated = { ...prev };
                      const dk = editingAssignment.dateKey;
                      updated[dk] = (updated[dk] || [])
                        .filter((a: any) => a.id !== editingAssignment.id)
                        .concat([{ id: newA.id, studentId: editingAssignment.studentId, studentName: editingAssignment.studentName, workoutId: editingAssignment.workoutId, workoutName: editingAssignment.workoutName, startTime: editStartTime, endTime: editEndTime }]);
                      updated[dk].sort((a: any, b: any) => (a.startTime || '').localeCompare(b.startTime || ''));
                      return updated;
                    });
                    closeEditModal();
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/90 active:scale-95 transition-all">
                {lang === 'tr' ? 'Kaydet' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
