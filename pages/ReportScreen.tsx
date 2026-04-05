
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface ReportScreenProps {
  lang: 'tr' | 'en';
  role: 'trainer' | 'student';
}

interface TrainerReport {
  role: 'trainer';
  period: string;
  totalSessions: number;
  activeStudents: number;
  completedSessions: number;
  byStudent: { name: string; sessions: number; completed: number }[];
  byDay: { day: string; count: number }[];
}

interface StudentReport {
  role: 'student';
  period: string;
  totalSessions: number;
  completedSessions: number;
  byWorkout: { name: string; sessions: number; completed: number }[];
  progress: { date: string; weight: number | null; bodyFat: number | null }[];
}

type Report = TrainerReport | StudentReport | null;

const apiHeaders = () => {
  const token = localStorage.getItem('fittrack_token');
  return { Authorization: `Bearer ${token}` };
};

// Mini bar chart using div widths
const BarChart: React.FC<{ data: { label: string; value: number; secondary?: number }[]; color?: string }> = ({ data, color = 'bg-primary' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/60 font-semibold truncate max-w-[60%]">{d.label}</span>
            <span className="text-white font-black">{d.value}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const ReportScreen: React.FC<ReportScreenProps> = ({ lang, role }) => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [report, setReport] = useState<Report>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (p: 'week' | 'month') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report?period=${p}`, { headers: apiHeaders() });
      if (res.ok) setReport(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchReport(period); }, [period]);

  const completionRate = report
    ? report.totalSessions > 0 ? Math.round((report.completedSessions / report.totalSessions) * 100) : 0
    : 0;

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      <div className="sticky top-0 z-40 bg-background-dark/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="bg-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-primary/10 rounded-xl p-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">summarize</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{lang === 'tr' ? 'Rapor' : 'Report'}</h1>
              <p className="text-xs text-white/40">{lang === 'tr' ? 'Özet & istatistikler' : 'Summary & stats'}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Period selector */}
        <div className="flex gap-2 bg-card-dark border border-white/5 rounded-xl p-1">
          {(['week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${period === p ? 'bg-primary text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {p === 'week' ? (lang === 'tr' ? 'Bu Hafta' : 'This Week') : (lang === 'tr' ? 'Bu Ay' : 'This Month')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined text-white/20 animate-spin text-4xl">progress_activity</span>
          </div>
        ) : !report ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <span className="material-symbols-outlined text-4xl text-white/10">summarize</span>
            <p className="text-white/30 text-sm">{lang === 'tr' ? 'Rapor yüklenemedi.' : 'Report unavailable.'}</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-white">{report.totalSessions}</p>
                <p className="text-[9px] text-white/30 uppercase font-bold mt-1">{lang === 'tr' ? 'Toplam Seans' : 'Total Sessions'}</p>
              </div>
              <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-green-400">{report.completedSessions}</p>
                <p className="text-[9px] text-white/30 uppercase font-bold mt-1">{lang === 'tr' ? 'Tamamlanan' : 'Completed'}</p>
              </div>
              <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-primary">{completionRate}%</p>
                <p className="text-[9px] text-white/30 uppercase font-bold mt-1">{lang === 'tr' ? 'Tamamlanma %' : 'Completion'}</p>
              </div>
            </div>

            {/* Completion progress bar */}
            <div className="bg-card-dark border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between mb-2">
                <p className="text-[10px] font-black text-white/40 uppercase">{lang === 'tr' ? 'Tamamlanma Oranı' : 'Completion Rate'}</p>
                <p className="text-[10px] font-black text-primary">{completionRate}%</p>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* Trainer-specific: Active students + by student breakdown */}
            {report.role === 'trainer' && (
              <>
                <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-white">{report.activeStudents}</p>
                  <p className="text-[9px] text-white/30 uppercase font-bold mt-1">{lang === 'tr' ? 'Aktif Öğrenci' : 'Active Students'}</p>
                </div>
                {report.byStudent.length > 0 && (
                  <div className="bg-card-dark border border-white/5 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">
                      {lang === 'tr' ? 'Öğrenciye Göre' : 'By Student'}
                    </p>
                    <BarChart
                      data={report.byStudent.map(s => ({ label: s.name, value: s.sessions, secondary: s.completed }))}
                    />
                  </div>
                )}
                {report.byDay.length > 0 && (
                  <div className="bg-card-dark border border-white/5 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">
                      {lang === 'tr' ? 'Günlük Dağılım' : 'Daily Distribution'}
                    </p>
                    <BarChart
                      data={report.byDay.map(d => ({ label: d.day.slice(5), value: d.count }))}
                      color="bg-cta-orange"
                    />
                  </div>
                )}
              </>
            )}

            {/* Student-specific: by workout + progress */}
            {report.role === 'student' && (
              <>
                {report.byWorkout.length > 0 && (
                  <div className="bg-card-dark border border-white/5 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">
                      {lang === 'tr' ? 'Antrenman Türü' : 'By Workout'}
                    </p>
                    <BarChart data={report.byWorkout.map(w => ({ label: w.name, value: w.sessions }))} />
                  </div>
                )}
                {report.progress.length > 0 && (
                  <div className="bg-card-dark border border-white/5 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
                      {lang === 'tr' ? 'Bu Dönem Ölçümler' : 'Measurements This Period'}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-white/30 font-bold uppercase">
                            <th className="text-left pb-2">{lang === 'tr' ? 'Tarih' : 'Date'}</th>
                            <th className="text-right pb-2">{lang === 'tr' ? 'Kilo' : 'Weight'}</th>
                            <th className="text-right pb-2">{lang === 'tr' ? 'Yağ %' : 'Body Fat'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.progress.map((p, i) => (
                            <tr key={i} className="border-t border-white/5">
                              <td className="py-2 text-white/60">{p.date}</td>
                              <td className="py-2 text-right text-white font-bold">{p.weight != null ? `${p.weight} kg` : '—'}</td>
                              <td className="py-2 text-right text-orange-400 font-bold">{p.bodyFat != null ? `${p.bodyFat}%` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <BottomNav role={role} lang={lang} />
    </div>
  );
};

export default ReportScreen;
