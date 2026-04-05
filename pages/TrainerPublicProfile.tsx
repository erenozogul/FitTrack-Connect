
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface TrainerPublicProfileProps {
  lang: 'tr' | 'en';
  role: 'trainer' | 'student';
}

interface TrainerInfo {
  id: number;
  name: string;
  username: string;
  specialties?: string[];
  totalStudents?: number;
  totalSessions?: number;
}

interface Review {
  id: number;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const apiHeaders = () => {
  const token = localStorage.getItem('fittrack_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const StarDisplay: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'text-lg' }) => (
  <div className={`flex gap-0.5 ${size}`}>
    {[1,2,3,4,5].map(s => (
      <span key={s}>{s <= Math.round(rating) ? '⭐' : '☆'}</span>
    ))}
  </div>
);

const TrainerPublicProfile: React.FC<TrainerPublicProfileProps> = ({ lang, role }) => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    // Fetch trainer by username
    fetch(`/api/users/trainer/${username}`, { headers: apiHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject('not_found'))
      .then(async (data: TrainerInfo) => {
        setTrainer(data);
        // Fetch reviews
        const rRes = await fetch(`/api/trainer/${data.id}/reviews`, { headers: apiHeaders() });
        if (rRes.ok) {
          const rData = await rRes.json();
          setAvgRating(rData.average);
          setReviewCount(rData.count);
          setReviews(rData.reviews || []);
        }
      })
      .catch(() => setError(lang === 'tr' ? 'Antrenör bulunamadı.' : 'Trainer not found.'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <span className="material-symbols-outlined text-white/20 animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-white/20 text-5xl">person_off</span>
        <p className="text-white/40 font-semibold">{error || (lang === 'tr' ? 'Antrenör bulunamadı.' : 'Trainer not found.')}</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-primary text-white rounded-xl font-black text-sm">
          {lang === 'tr' ? 'Geri Dön' : 'Go Back'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      <div className="sticky top-0 z-40 bg-background-dark/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="bg-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-white">{lang === 'tr' ? 'Antrenör Profili' : 'Trainer Profile'}</h1>
            <p className="text-xs text-white/40">@{trainer.username}</p>
          </div>
        </div>
      </div>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-3xl p-6 text-center">
          <img
            src={`https://picsum.photos/seed/${trainer.username}/200/200`}
            alt={trainer.name}
            className="size-24 rounded-full object-cover border-4 border-primary/40 mx-auto mb-4 shadow-xl shadow-primary/20"
          />
          <h2 className="text-2xl font-black text-white">{trainer.name}</h2>
          <p className="text-white/40 text-sm font-mono mt-1">@{trainer.username}</p>
          {avgRating != null && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <StarDisplay rating={avgRating} />
              <span className="text-white font-black">{avgRating}</span>
              <span className="text-white/30 text-sm">({reviewCount} {lang === 'tr' ? 'değerlendirme' : 'reviews'})</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{trainer.totalStudents ?? '—'}</p>
            <p className="text-[9px] text-white/30 uppercase font-bold mt-1">{lang === 'tr' ? 'Öğrenci' : 'Students'}</p>
          </div>
          <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{trainer.totalSessions ?? '—'}</p>
            <p className="text-[9px] text-white/30 uppercase font-bold mt-1">{lang === 'tr' ? 'Toplam Seans' : 'Total Sessions'}</p>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">
              {lang === 'tr' ? 'Değerlendirmeler' : 'Reviews'}
            </p>
            <div className="flex flex-col gap-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-card-dark border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-white">{r.studentName}</p>
                    <StarDisplay rating={r.rating} size="text-sm" />
                  </div>
                  {r.comment && <p className="text-white/50 text-xs leading-relaxed">{r.comment}</p>}
                  <p className="text-white/20 text-[10px] mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length === 0 && (
          <div className="flex flex-col items-center py-10 gap-3">
            <span className="material-symbols-outlined text-4xl text-white/10">reviews</span>
            <p className="text-white/30 text-sm">{lang === 'tr' ? 'Henüz değerlendirme yok' : 'No reviews yet'}</p>
          </div>
        )}
      </main>

      <BottomNav role={role} lang={lang} />
    </div>
  );
};

export default TrainerPublicProfile;
