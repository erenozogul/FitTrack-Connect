import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface TrainerAnalyticsScreenProps {
  lang: 'tr' | 'en';
}

interface AnalyticsData {
  totalStudents: number;
  assignmentsThisWeek: number;
  assignmentsThisMonth: number;
  students: {
    id: number;
    name: string;
    username: string;
    avatar: string;
    totalAssignments: number;
    lastAssignment: string | null;
  }[];
}

const TrainerAnalyticsScreen: React.FC<TrainerAnalyticsScreenProps> = ({ lang }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fittrack_token');
    fetch('/api/trainer/analytics', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxAssignments = data ? Math.max(...data.students.map(s => s.totalAssignments), 1) : 1;

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background-dark/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">bar_chart</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{lang === 'tr' ? 'Analitik Panel' : 'Analytics'}</h1>
              <p className="text-xs text-white/40">{lang === 'tr' ? 'Performans özeti' : 'Performance overview'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {loading && (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined text-white/20 text-4xl animate-spin">progress_activity</span>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-white">{data.totalStudents}</p>
                <p className="text-[10px] text-white/40 uppercase font-black mt-1">{lang === 'tr' ? 'Öğrenci' : 'Students'}</p>
              </div>
              <div className="bg-card-dark border border-primary/20 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-primary">{data.assignmentsThisWeek}</p>
                <p className="text-[10px] text-white/40 uppercase font-black mt-1">{lang === 'tr' ? 'Bu Hafta' : 'This Week'}</p>
              </div>
              <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-white">{data.assignmentsThisMonth}</p>
                <p className="text-[10px] text-white/40 uppercase font-black mt-1">{lang === 'tr' ? 'Bu Ay' : 'This Month'}</p>
              </div>
            </div>

            {/* Student breakdown */}
            <div>
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 px-1">
                {lang === 'tr' ? 'Öğrenci Bazlı Seans' : 'Sessions Per Student'}
              </h2>
              <div className="flex flex-col gap-3">
                {data.students.length === 0 && (
                  <div className="bg-card-dark border border-white/5 rounded-2xl p-8 text-center">
                    <span className="material-symbols-outlined text-3xl text-white/20 block mb-2">group_off</span>
                    <p className="text-white/30 text-sm">
                      {lang === 'tr' ? 'Henüz öğrenci bağlanmamış' : 'No students connected yet'}
                    </p>
                  </div>
                )}
                {data.students.map((student, idx) => (
                  <div key={student.id} className="bg-card-dark border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <img src={student.avatar} alt={student.name} className="size-10 rounded-full object-cover border border-white/10" />
                        {idx === 0 && data.students.length > 1 && (
                          <span className="absolute -top-1 -right-1 size-4 bg-yellow-400 rounded-full text-[8px] font-black text-black flex items-center justify-center">1</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{student.name}</p>
                        <p className="text-white/40 text-xs">
                          {student.lastAssignment
                            ? `${lang === 'tr' ? 'Son seans:' : 'Last:'} ${new Date(student.lastAssignment).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}`
                            : lang === 'tr' ? 'Henüz seans yok' : 'No sessions yet'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white font-black text-xl">{student.totalAssignments}</p>
                        <p className="text-white/30 text-[10px] uppercase">{lang === 'tr' ? 'seans' : 'sessions'}</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max((student.totalAssignments / maxAssignments) * 100, student.totalAssignments > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 px-1">
                {lang === 'tr' ? 'Hızlı Erişim' : 'Quick Access'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/library')}
                  className="bg-card-dark border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors active:scale-95 text-left"
                >
                  <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
                  <span className="text-white text-sm font-bold">{lang === 'tr' ? 'Seans Ata' : 'Assign Session'}</span>
                </button>
                <button
                  onClick={() => navigate('/students')}
                  className="bg-card-dark border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors active:scale-95 text-left"
                >
                  <span className="material-symbols-outlined text-primary text-xl">groups</span>
                  <span className="text-white text-sm font-bold">{lang === 'tr' ? 'Öğrenciler' : 'Students'}</span>
                </button>
                <button
                  onClick={() => navigate('/notes')}
                  className="bg-card-dark border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors active:scale-95 text-left"
                >
                  <span className="material-symbols-outlined text-primary text-xl">sticky_note_2</span>
                  <span className="text-white text-sm font-bold">{lang === 'tr' ? 'Notlar' : 'Notes'}</span>
                </button>
                <button
                  onClick={() => navigate('/messages')}
                  className="bg-card-dark border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors active:scale-95 text-left"
                >
                  <span className="material-symbols-outlined text-primary text-xl">chat_bubble</span>
                  <span className="text-white text-sm font-bold">{lang === 'tr' ? 'Mesajlar' : 'Messages'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav role="trainer" lang={lang} />
    </div>
  );
};

export default TrainerAnalyticsScreen;
