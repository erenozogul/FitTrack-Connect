
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface ProgressScreenProps {
  lang: 'tr' | 'en';
  role: 'trainer' | 'student';
}

interface ProgressEntry {
  id: number;
  date: string;
  weight: number | null;
  bodyFat: number | null;
  notes: string;
}

const apiHeaders = () => {
  const token = localStorage.getItem('fittrack_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// Simple SVG line chart — no external dependencies
const LineChart: React.FC<{
  data: { x: string; y: number }[];
  color: string;
  unit: string;
  height?: number;
}> = ({ data, color, unit, height = 140 }) => {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-36 text-white/20 text-xs font-bold">
        {data.length === 0 ? 'Veri yok' : 'En az 2 kayıt gerekli'}
      </div>
    );
  }
  const W = 300;
  const H = height;
  const PAD = { top: 10, right: 10, bottom: 24, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const ys = data.map(d => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;

  const toX = (_i: number) => PAD.left + (_i / (data.length - 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - ((v - minY) / rangeY) * innerH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.y)}`).join(' ');

  // Y axis labels
  const yLabels = [minY, minY + rangeY / 2, maxY].map(v => Math.round(v * 10) / 10);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((t, i) => (
        <line
          key={i}
          x1={PAD.left} x2={W - PAD.right}
          y1={PAD.top + innerH * (1 - t)} y2={PAD.top + innerH * (1 - t)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1"
        />
      ))}
      {/* Y labels */}
      {yLabels.map((v, i) => (
        <text
          key={i}
          x={PAD.left - 4}
          y={PAD.top + innerH - (i * innerH / 2) + 4}
          fill="rgba(255,255,255,0.3)"
          fontSize="8"
          textAnchor="end"
        >{v}</text>
      ))}
      {/* Area fill */}
      <polygon
        points={`${PAD.left},${PAD.top + innerH} ${points} ${W - PAD.right},${PAD.top + innerH}`}
        fill={color}
        fillOpacity="0.1"
      />
      {/* Line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {data.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.y)} r="3" fill={color} />
      ))}
      {/* X labels — show first, middle, last */}
      {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => {
        const label = data[i]?.x?.slice(5); // MM-DD
        return (
          <text key={i} x={toX(i)} y={H - 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">
            {label}
          </text>
        );
      })}
    </svg>
  );
};

const ProgressScreen: React.FC<ProgressScreenProps> = ({ lang, role }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), weight: '', bodyFat: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'weight' | 'fat' | 'log'>('weight');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/progress', { headers: apiHeaders() });
      if (res.ok) setEntries(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSave = async () => {
    if (!form.date) { setError(lang === 'tr' ? 'Tarih zorunlu' : 'Date required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          date: form.date,
          weight: form.weight ? parseFloat(form.weight) : null,
          bodyFat: form.bodyFat ? parseFloat(form.bodyFat) : null,
          notes: form.notes,
        }),
      });
      if (res.status === 409) {
        setError(lang === 'tr' ? 'Bu tarih için zaten kayıt var.' : 'Entry for this date already exists.');
      } else if (res.ok) {
        const entry = await res.json();
        setEntries(prev => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
        setShowForm(false);
        setForm({ date: new Date().toISOString().slice(0, 10), weight: '', bodyFat: '', notes: '' });
      } else {
        setError(lang === 'tr' ? 'Hata oluştu.' : 'An error occurred.');
      }
    } catch {
      setError(lang === 'tr' ? 'Bağlantı hatası.' : 'Connection error.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/progress/${id}`, { method: 'DELETE', headers: apiHeaders() });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch {}
  };

  const weightData = entries.filter(e => e.weight !== null).map(e => ({ x: e.date, y: e.weight! }));
  const fatData = entries.filter(e => e.bodyFat !== null).map(e => ({ x: e.date, y: e.bodyFat! }));

  const latestWeight = entries.filter(e => e.weight !== null).at(-1)?.weight;
  const latestFat = entries.filter(e => e.bodyFat !== null).at(-1)?.bodyFat;
  const firstWeight = entries.find(e => e.weight !== null)?.weight;
  const weightChange = latestWeight != null && firstWeight != null ? latestWeight - firstWeight : null;

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background-dark/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="bg-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-primary/10 rounded-xl p-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">show_chart</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{lang === 'tr' ? 'İlerleme' : 'Progress'}</h1>
              <p className="text-xs text-white/40">{lang === 'tr' ? 'Vücut metrikleri' : 'Body metrics'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-black active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {lang === 'tr' ? 'Ekle' : 'Add'}
          </button>
        </div>
      </div>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-[9px] font-black text-white/30 uppercase mb-1">{lang === 'tr' ? 'Kilo' : 'Weight'}</p>
            <p className="text-2xl font-black text-white">{latestWeight ?? '—'}</p>
            <p className="text-[9px] text-white/30 font-bold">kg</p>
          </div>
          <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-[9px] font-black text-white/30 uppercase mb-1">{lang === 'tr' ? 'Yağ %' : 'Body Fat'}</p>
            <p className="text-2xl font-black text-white">{latestFat ?? '—'}</p>
            <p className="text-[9px] text-white/30 font-bold">%</p>
          </div>
          <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-[9px] font-black text-white/30 uppercase mb-1">{lang === 'tr' ? 'Değişim' : 'Change'}</p>
            <p className={`text-2xl font-black ${weightChange == null ? 'text-white' : weightChange < 0 ? 'text-green-400' : weightChange > 0 ? 'text-red-400' : 'text-white'}`}>
              {weightChange == null ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}`}
            </p>
            <p className="text-[9px] text-white/30 font-bold">kg</p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 bg-card-dark border border-white/5 rounded-xl p-1">
          {(['weight', 'fat', 'log'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${tab === t ? 'bg-primary text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {t === 'weight' ? (lang === 'tr' ? 'Kilo' : 'Weight') : t === 'fat' ? (lang === 'tr' ? 'Yağ %' : 'Body Fat') : (lang === 'tr' ? 'Kayıtlar' : 'Log')}
            </button>
          ))}
        </div>

        {/* Charts */}
        {tab === 'weight' && (
          <div className="bg-card-dark border border-white/5 rounded-2xl p-4">
            <p className="text-[10px] font-black text-white/30 uppercase mb-3">{lang === 'tr' ? 'Kilo Grafiği (kg)' : 'Weight Chart (kg)'}</p>
            {loading ? (
              <div className="flex justify-center py-10"><span className="material-symbols-outlined text-white/20 animate-spin">progress_activity</span></div>
            ) : (
              <LineChart data={weightData} color="#3B82F6" unit="kg" />
            )}
          </div>
        )}

        {tab === 'fat' && (
          <div className="bg-card-dark border border-white/5 rounded-2xl p-4">
            <p className="text-[10px] font-black text-white/30 uppercase mb-3">{lang === 'tr' ? 'Vücut Yağ Grafiği (%)' : 'Body Fat Chart (%)'}</p>
            {loading ? (
              <div className="flex justify-center py-10"><span className="material-symbols-outlined text-white/20 animate-spin">progress_activity</span></div>
            ) : (
              <LineChart data={fatData} color="#F97316" unit="%" />
            )}
          </div>
        )}

        {tab === 'log' && (
          <div className="bg-card-dark border border-white/5 rounded-2xl divide-y divide-white/5">
            {loading ? (
              <div className="flex justify-center py-10"><span className="material-symbols-outlined text-white/20 animate-spin">progress_activity</span></div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <span className="material-symbols-outlined text-4xl text-white/10">monitoring</span>
                <p className="text-white/30 text-sm font-semibold">{lang === 'tr' ? 'Henüz kayıt yok' : 'No entries yet'}</p>
              </div>
            ) : [...entries].reverse().map(e => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <p className="text-xs font-black text-white/60">{e.date}</p>
                  <div className="flex gap-3 mt-1">
                    {e.weight != null && (
                      <span className="text-sm font-bold text-white">{e.weight} <span className="text-white/30 text-[10px]">kg</span></span>
                    )}
                    {e.bodyFat != null && (
                      <span className="text-sm font-bold text-orange-400">{e.bodyFat}<span className="text-white/30 text-[10px]">%</span></span>
                    )}
                  </div>
                  {e.notes && <p className="text-[10px] text-white/30 mt-0.5">{e.notes}</p>}
                </div>
                <button onClick={() => handleDelete(e.id)} className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav role={role} lang={lang} />

      {/* Add Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">{lang === 'tr' ? 'Yeni Kayıt' : 'New Entry'}</h2>
              <button onClick={() => setShowForm(false)} className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase">{lang === 'tr' ? 'Tarih' : 'Date'}</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase">{lang === 'tr' ? 'Kilo (kg)' : 'Weight (kg)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={form.weight}
                    onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase">{lang === 'tr' ? 'Yağ (%)' : 'Body Fat (%)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="18.5"
                    value={form.bodyFat}
                    onChange={e => setForm(f => ({ ...f, bodyFat: e.target.value }))}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase">{lang === 'tr' ? 'Not (opsiyonel)' : 'Notes (optional)'}</label>
                <input
                  type="text"
                  placeholder={lang === 'tr' ? 'Bugün çok iyi hissettim...' : 'Feeling great today...'}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving
                ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                : <><span className="material-symbols-outlined text-sm">save</span> {lang === 'tr' ? 'Kaydet' : 'Save'}</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressScreen;
