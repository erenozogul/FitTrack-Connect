
import React, { useState, useRef, useEffect } from 'react';
import { BottomNav } from '../components/Navigation';
import { translations } from '../App';


interface TrainerProfileScreenProps {
  lang: 'tr' | 'en';
  setLang: (l: 'tr' | 'en') => void;
  onLogout: () => void;
  userName?: string;
  role?: 'trainer' | 'student';
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

type ModalType = 'personalInfo' | 'password' | 'notifications' | 'help' | 'settings' | null;

/* ──────────────────────────────────────────────────
   ConnectTrainerSection – shown on student profile
   when no trainer is connected yet
────────────────────────────────────────────────── */
interface ConnectedTrainer { id: number; name: string; username: string; code: string; avatar?: string; }

const ConnectTrainerSection: React.FC<{ lang: 'tr' | 'en' }> = ({ lang }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<ConnectedTrainer | null>(() => {
    try { return JSON.parse(localStorage.getItem('fittrack_connected_trainer') || 'null'); } catch { return null; }
  });

  const handleConnect = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) { setError(lang === 'tr' ? 'Lütfen bir kod girin.' : 'Please enter a code.'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('fittrack_token');
      if (!token) throw new Error('no_token');
      const res = await fetch('/api/trainer/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      const trainer: ConnectedTrainer = {
        ...data.trainer,
        avatar: `https://picsum.photos/seed/${data.trainer.username}/100/100`,
      };
      localStorage.setItem('fittrack_connected_trainer', JSON.stringify(trainer));
      setConnected(trainer);
    } catch (e: any) {
      if (e.message === 'no_token') {
        setError(lang === 'tr' ? 'Giriş yapmanız gerekiyor.' : 'You need to be logged in.');
      } else if (e.message === 'error_trainer_not_found') {
        setError(lang === 'tr' ? 'Antrenör bulunamadı. Kodu kontrol edin.' : 'Trainer not found. Check the code.');
      } else {
        setError(lang === 'tr' ? 'Geçersiz kod. Lütfen tekrar deneyin.' : 'Invalid code. Please try again.');
      }
    } finally { setLoading(false); }
  };

  if (connected) {
    return (
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
        <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-2">
          {lang === 'tr' ? 'Antrenörüm' : 'My Trainer'}
        </p>
        <div className="flex items-center gap-3">
          <img
            src={connected.avatar || `https://picsum.photos/seed/${connected.username}/100/100`}
            alt={connected.name}
            className="size-10 rounded-full object-cover border-2 border-primary/30"
          />
          <div>
            <p className="text-white font-bold text-sm">{connected.name}</p>
            <p className="text-white/40 text-xs font-mono">@{connected.username}</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem('fittrack_connected_trainer'); setConnected(null); }}
            className="ml-auto text-white/30 hover:text-red-400 transition-colors"
            title={lang === 'tr' ? 'Bağlantıyı kes' : 'Disconnect'}
          >
            <span className="material-symbols-outlined text-lg">link_off</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="material-symbols-outlined text-primary text-lg">person_search</span>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
          {lang === 'tr' ? 'Antrenör Bağla' : 'Connect Trainer'}
        </p>
      </div>

      <div className="bg-card-dark border border-white/5 rounded-2xl p-4">
        <p className="text-white/50 text-xs mb-3 leading-relaxed">
          {lang === 'tr'
            ? 'Antrenörünüzden aldığınız davet kodunu girin.'
            : 'Enter the invite code you received from your trainer.'}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={e => { setInviteCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleConnect()}
            placeholder={lang === 'tr' ? 'Örn: ERNBNGL2026' : 'e.g. ERNBNGL2026'}
            className="flex-1 bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-primary/50 transition-colors font-mono tracking-widest uppercase"
          />
          <button
            onClick={handleConnect}
            disabled={loading || !inviteCode.trim()}
            className="px-4 py-3 bg-primary text-white rounded-xl font-black text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            {loading
              ? <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              : <><span className="material-symbols-outlined text-lg">link</span><span>{lang === 'tr' ? 'Bağlan' : 'Connect'}</span></>
            }
          </button>
        </div>
        {error && <p className="text-red-400 text-xs font-semibold mt-2">{error}</p>}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────
   RateTrainerSection – student rates their trainer
────────────────────────────────────────────────── */
const RateTrainerSection: React.FC<{ lang: 'tr' | 'en' }> = ({ lang }) => {
  const connected = (() => { try { return JSON.parse(localStorage.getItem('fittrack_connected_trainer') || 'null'); } catch { return null; } })();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!connected) return null;

  const handleSubmit = async () => {
    if (!rating) { setError(lang === 'tr' ? 'Lütfen bir puan seçin.' : 'Please select a rating.'); return; }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('fittrack_token');
      const res = await fetch(`/api/trainer/${connected.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(lang === 'tr' ? 'Hata oluştu, tekrar deneyin.' : 'Error occurred, please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="bg-card-dark border border-white/5 rounded-2xl p-4 mb-4">
      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
        {lang === 'tr' ? 'Antrenörünü Değerlendir' : 'Rate Your Trainer'}
      </p>
      <p className="text-white/60 text-xs mb-3">{connected.name}</p>
      <div className="flex gap-2 mb-3">
        {[1,2,3,4,5].map(s => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(s)}
            className="text-2xl transition-transform active:scale-90"
          >
            {(hover || rating) >= s ? '⭐' : '☆'}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder={lang === 'tr' ? 'Yorum (opsiyonel)...' : 'Comment (optional)...'}
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary/50 transition-colors mb-3"
      />
      {error && <p className="text-red-400 text-xs font-semibold mb-2">{error}</p>}
      {saved && <p className="text-green-400 text-xs font-semibold mb-2">{lang === 'tr' ? 'Değerlendirme kaydedildi!' : 'Review saved!'}</p>}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full h-10 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {saving
          ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
          : <><span className="material-symbols-outlined text-sm">star</span>{lang === 'tr' ? 'Gönder' : 'Submit'}</>
        }
      </button>
    </div>
  );
};

const TrainerProfileScreen: React.FC<TrainerProfileScreenProps> = ({
  lang, setLang, onLogout, userName, role = 'trainer', isDarkMode, setIsDarkMode
}) => {
  const isTrainer = role === 'trainer';
  const t = translations[lang];

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [notifWorkout, setNotifWorkout] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifProgress, setNotifProgress] = useState(false);

  // Read user info from localStorage first
  const userStr = localStorage.getItem('fittrack_user');
  let parsedUser: Record<string, string> = {};
  try {
    if (userStr) parsedUser = JSON.parse(userStr);
  } catch { /* ignore */ }

  // Avatar state – read from localStorage
  const gender = parsedUser.gender || localStorage.getItem('fittrack_gender') || 'male';
  const [avatarSrc, setAvatarSrc] = useState<string>(
    localStorage.getItem('fittrack_avatar') || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCustomAvatar = !!avatarSrc;
  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleAvatarDelete = () => {
    localStorage.removeItem('fittrack_avatar');
    setAvatarSrc('');
  };
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    // Preview locally first
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Upload to server
    const token = localStorage.getItem('fittrack_token');
    if (!token) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        setAvatarSrc(url);
        localStorage.setItem('fittrack_avatar', url);
      }
    } catch { /* keep local preview */ }
  };

  const [firstName, setFirstName] = useState(parsedUser.firstName || '');
  const [lastName, setLastName] = useState(parsedUser.lastName || '');
  const [email, setEmail] = useState(parsedUser.email || '');
  const [weight, setWeight] = useState(localStorage.getItem('fittrack_weight') || '');
  const [infoSaved, setInfoSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const [trainerRating, setTrainerRating] = useState<number | null>(null);
  useEffect(() => {
    if (!isTrainer) return;
    const token = localStorage.getItem('fittrack_token');
    if (!token) return;
    fetch('/api/trainer/me/reviews', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.average) setTrainerRating(d.average); })
      .catch(() => {});
  }, [isTrainer]);

  const trainerCode = (parsedUser.username || 'TRAINER').toUpperCase().replace(/[^A-Z0-9]/g, '') + '2026';
  const connectedStudentsCount = (() => {
    try {
      const assignments = JSON.parse(localStorage.getItem('fittrack_assignments') || '{}');
      const allStudentIds = new Set<number>();
      Object.values(assignments).forEach((day: any) => {
        (day as any[]).forEach((a: any) => allStudentIds.add(a.studentId));
      });
      return allStudentIds.size;
    } catch { return 0; }
  })();

  const storedName = userName || (parsedUser.firstName && parsedUser.lastName ? `${parsedUser.firstName} ${parsedUser.lastName}` : '');
  const displayName = storedName || (isTrainer ? (lang === 'tr' ? 'Antrenör' : 'Trainer') : (lang === 'tr' ? 'Öğrenci' : 'Student'));
  const storedEmail = parsedUser.email || '';

  const handleLogout = () => {
    onLogout();
    window.location.hash = '#/';
  };

  const savePersonalInfo = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    const updated = { ...parsedUser, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() };
    localStorage.setItem('fittrack_user', JSON.stringify(updated));
    if (weight.trim()) {
      localStorage.setItem('fittrack_weight', weight.trim());
    } else {
      localStorage.removeItem('fittrack_weight');
    }
    setInfoSaved(true);
    setTimeout(() => { setInfoSaved(false); setActiveModal(null); }, 1000);
  };

  const handlePasswordChange = async () => {
    setPwError('');
    if (!currentPw || !newPw || !confirmPw) {
      setPwError(lang === 'tr' ? 'Tüm alanlar zorunludur.' : 'All fields are required.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError(lang === 'tr' ? 'Yeni şifreler eşleşmiyor.' : 'New passwords do not match.');
      return;
    }
    if (newPw.length < 6) {
      setPwError(lang === 'tr' ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.');
      return;
    }
    try {
      const token = localStorage.getItem('fittrack_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPwError(data.error || (lang === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.'));
        return;
      }
      setPwSuccess(true);
      setTimeout(() => { setPwSuccess(false); setActiveModal(null); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }, 1200);
    } catch {
      setPwError(lang === 'tr' ? 'Sunucuya bağlanılamadı.' : 'Could not connect to server.');
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/60';
  const labelCls = 'text-[10px] font-black text-white/40 uppercase tracking-widest mb-1';

  const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">{title}</h2>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark pb-32 md:pb-0 md:pl-64 transition-colors duration-300">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 pt-12 pb-4 transition-colors">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            {lang === 'tr' ? 'Profil' : 'Profile'}
          </h1>
          {/* Settings gear → opens settings modal */}
          <button
            onClick={() => setActiveModal('settings')}
            className="bg-slate-200 dark:bg-white/5 rounded-xl p-2.5 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-white text-2xl">settings</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
        {/* Profile section */}
        <div className="flex flex-col items-center gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="relative">
            {hasCustomAvatar ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="size-24 rounded-3xl border-2 border-primary/40 object-cover"
              />
            ) : (
              <div className="size-24 rounded-3xl border-2 border-primary/40 overflow-hidden">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  {gender === 'female' ? (
                    <>
                      <rect width="100" height="100" fill="#e8d5f0"/>
                      {/* Hair */}
                      <ellipse cx="50" cy="30" rx="22" ry="18" fill="#b388d8"/>
                      <ellipse cx="30" cy="42" rx="7" ry="14" fill="#b388d8"/>
                      <ellipse cx="70" cy="42" rx="7" ry="14" fill="#b388d8"/>
                      {/* Head */}
                      <ellipse cx="50" cy="38" rx="18" ry="20" fill="#ce9fd6"/>
                      {/* Neck */}
                      <rect x="44" y="56" width="12" height="8" fill="#ce9fd6"/>
                      {/* Body/shoulders */}
                      <ellipse cx="50" cy="92" rx="34" ry="22" fill="#b388d8"/>
                    </>
                  ) : (
                    <>
                      <rect width="100" height="100" fill="#d0e8f8"/>
                      {/* Hair */}
                      <ellipse cx="50" cy="27" rx="20" ry="13" fill="#4a85b8"/>
                      {/* Head */}
                      <ellipse cx="50" cy="38" rx="18" ry="20" fill="#7ab3d8"/>
                      {/* Neck */}
                      <rect x="44" y="56" width="12" height="8" fill="#7ab3d8"/>
                      {/* Body/shoulders */}
                      <ellipse cx="50" cy="92" rx="34" ry="22" fill="#4a85b8"/>
                    </>
                  )}
                </svg>
              </div>
            )}
            <button
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 bg-primary text-white rounded-full size-8 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
            {hasCustomAvatar && (
              <button
                onClick={handleAvatarDelete}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full size-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors active:scale-95"
                title={lang === 'tr' ? 'Fotoğrafı Sil' : 'Remove Photo'}
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{displayName}</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            {isTrainer ? (lang === 'tr' ? 'KİŞİSEL ANTRENÖR' : 'PERSONAL TRAINER') : (lang === 'tr' ? 'ÖĞRENCİ' : 'STUDENT')}
          </span>
          {storedEmail && <p className="text-sm text-slate-500 dark:text-white/40">{storedEmail}</p>}
        </div>

        {/* Stats row */}
        <div className={`grid gap-3 ${isTrainer ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {isTrainer && (
            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center transition-colors">
              <p className="text-2xl font-black text-slate-900 dark:text-white">5</p>
              <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase mt-1">
                {lang === 'tr' ? 'Aktif Öğrenci' : 'Active Students'}
              </p>
            </div>
          )}
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center transition-colors">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{isTrainer ? '124' : '38'}</p>
            <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase mt-1">
              {lang === 'tr' ? 'Toplam Seans' : 'Total Sessions'}
            </p>
          </div>
          <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center transition-colors">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {isTrainer
                ? (trainerRating != null ? `${trainerRating} ⭐` : '— ⭐')
                : (weight ? `${weight} kg` : '—')
              }
            </p>
            <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase mt-1">
              {isTrainer ? (lang === 'tr' ? 'Değerlendirme' : 'Rating') : (lang === 'tr' ? 'Güncel Kilo' : 'Current Weight')}
            </p>
          </div>
        </div>

        {/* Account settings */}
        <div>
          <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2 px-1">
            {lang === 'tr' ? 'Hesap' : 'Account'}
          </p>
          {isTrainer && (
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
              <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-1">
                {lang === 'tr' ? 'Davet Kodunuz' : 'Your Invite Code'}
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl font-black text-white tracking-widest">{trainerCode}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(trainerCode).catch(() => {})}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl text-primary text-xs font-bold transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  {lang === 'tr' ? 'Kopyala' : 'Copy'}
                </button>
              </div>
              <p className="text-white/30 text-xs mt-2">
                {lang === 'tr'
                  ? `Bu kodu öğrencilerinizle paylaşın • ${connectedStudentsCount} öğrenci bağlı`
                  : `Share this code with your students • ${connectedStudentsCount} student${connectedStudentsCount !== 1 ? 's' : ''} connected`}
              </p>
            </div>
          )}
          {!isTrainer && <ConnectTrainerSection lang={lang} />}
          {!isTrainer && <RateTrainerSection lang={lang} />}
          <div className="flex flex-col gap-2">
            {[
              { icon: 'person', label: lang === 'tr' ? 'Kişisel Bilgiler' : 'Personal Info', modal: 'personalInfo' as ModalType },
              { icon: 'lock', label: lang === 'tr' ? 'Şifre Değiştir' : 'Change Password', modal: 'password' as ModalType },
              { icon: 'notifications', label: t.notifications, modal: 'notifications' as ModalType },
            ].map(item => (
              <button
                key={item.icon}
                onClick={() => setActiveModal(item.modal)}
                className="bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors w-full text-left"
              >
                <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                <span className="flex-1 text-slate-900 dark:text-white text-sm font-semibold">{item.label}</span>
                <span className="material-symbols-outlined text-slate-300 dark:text-white/20 text-lg">chevron_right</span>
              </button>
            ))}
            {/* Plans link */}
            <button
              onClick={() => { window.location.hash = '#/plans'; }}
              className="bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
              <span className="flex-1 text-slate-900 dark:text-white text-sm font-semibold">{lang === 'tr' ? 'Planlar' : 'Plans'}</span>
              <span className="material-symbols-outlined text-slate-300 dark:text-white/20 text-lg">chevron_right</span>
            </button>
          </div>
        </div>

        {/* App settings */}
        <div>
          <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2 px-1">
            {lang === 'tr' ? 'Uygulama' : 'App'}
          </p>
          <div className="flex flex-col gap-2">
            {/* Appearance - inline toggle */}
            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 transition-colors">
              <span className="material-symbols-outlined text-primary text-xl">
                {isDarkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="flex-1 text-slate-900 dark:text-white text-sm font-semibold">{lang === 'tr' ? 'Görünüm' : 'Appearance'}</span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs text-slate-500 dark:text-white/40 font-semibold ml-1 w-12 text-right">
                {isDarkMode ? (lang === 'tr' ? 'Koyu' : 'Dark') : (lang === 'tr' ? 'Açık' : 'Light')}
              </span>
            </div>

            {/* Language - inline toggle */}
            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 transition-colors">
              <span className="material-symbols-outlined text-primary text-xl">language</span>
              <span className="flex-1 text-slate-900 dark:text-white text-sm font-semibold">{lang === 'tr' ? 'Dil / Language' : 'Language / Dil'}</span>
              <button
                onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
                className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-colors active:scale-95"
              >
                <span className="text-xs font-black text-primary">{lang === 'tr' ? 'TR' : 'EN'}</span>
                <span className="material-symbols-outlined text-primary text-sm">swap_horiz</span>
                <span className="text-xs font-black text-slate-400 dark:text-white/40">{lang === 'tr' ? 'EN' : 'TR'}</span>
              </button>
            </div>

            {/* Help */}
            <button
              onClick={() => setActiveModal('help')}
              className="bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-primary text-xl">help</span>
              <span className="flex-1 text-slate-900 dark:text-white text-sm font-semibold">{lang === 'tr' ? 'Yardım' : 'Help & Support'}</span>
              <span className="material-symbols-outlined text-slate-300 dark:text-white/20 text-lg">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-2xl py-4 flex items-center justify-center gap-2 font-black transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          {t.logout}
        </button>
      </div>

      <BottomNav role={role} lang={lang} />

      {/* Settings Modal (gear icon) */}
      {activeModal === 'settings' && (
        <Modal title={lang === 'tr' ? 'Ayarlar' : 'Settings'} onClose={() => setActiveModal(null)}>
          <div className="flex flex-col gap-3">
            {/* Appearance toggle */}
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
                <span className="text-white text-sm font-semibold">{lang === 'tr' ? 'Görünüm' : 'Appearance'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 font-semibold">
                  {isDarkMode ? (lang === 'tr' ? 'Koyu' : 'Dark') : (lang === 'tr' ? 'Açık' : 'Light')}
                </span>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-400'}`}
                >
                  <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Language toggle */}
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">language</span>
                <span className="text-white text-sm font-semibold">{lang === 'tr' ? 'Dil / Language' : 'Language / Dil'}</span>
              </div>
              <button
                onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
                className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-colors active:scale-95"
              >
                <span className="text-xs font-black text-primary">{lang === 'tr' ? 'TR' : 'EN'}</span>
                <span className="material-symbols-outlined text-primary text-sm">swap_horiz</span>
                <span className="text-xs font-black text-white/40">{lang === 'tr' ? 'EN' : 'TR'}</span>
              </button>
            </div>

            {/* Notifications */}
            <button
              onClick={() => setActiveModal('notifications')}
              className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3.5 hover:bg-white/10 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-primary text-xl">notifications</span>
              <span className="flex-1 text-white text-sm font-semibold">{t.notifications}</span>
              <span className="material-symbols-outlined text-white/20 text-lg">chevron_right</span>
            </button>

            {/* Help */}
            <button
              onClick={() => setActiveModal('help')}
              className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3.5 hover:bg-white/10 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-primary text-xl">help</span>
              <span className="flex-1 text-white text-sm font-semibold">{lang === 'tr' ? 'Yardım' : 'Help & Support'}</span>
              <span className="material-symbols-outlined text-white/20 text-lg">chevron_right</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Personal Info Modal */}
      {activeModal === 'personalInfo' && (
        <Modal title={lang === 'tr' ? 'Kişisel Bilgiler' : 'Personal Info'} onClose={() => setActiveModal(null)}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={labelCls}>{t.firstName}</p>
                <input className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t.firstName} />
              </div>
              <div>
                <p className={labelCls}>{t.lastName}</p>
                <input className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t.lastName} />
              </div>
            </div>
            <div>
              <p className={labelCls}>{t.email}</p>
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.email} />
            </div>
            {!isTrainer && (
              <div>
                <p className={labelCls}>{lang === 'tr' ? 'Kilo (kg)' : 'Weight (kg)'}</p>
                <input
                  className={inputCls}
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder={lang === 'tr' ? 'Örn: 75.5' : 'e.g. 75.5'}
                />
              </div>
            )}
            <button
              onClick={savePersonalInfo}
              className="w-full bg-primary text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
            >
              {infoSaved
                ? <><span className="material-symbols-outlined text-lg">check_circle</span>{lang === 'tr' ? 'Kaydedildi!' : 'Saved!'}</>
                : <>{lang === 'tr' ? 'Kaydet' : 'Save'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Change Password Modal */}
      {activeModal === 'password' && (
        <Modal title={lang === 'tr' ? 'Şifre Değiştir' : 'Change Password'} onClose={() => { setActiveModal(null); setPwError(''); setPwSuccess(false); }}>
          <div className="flex flex-col gap-4">
            <div>
              <p className={labelCls}>{lang === 'tr' ? 'Mevcut Şifre' : 'Current Password'}</p>
              <input className={inputCls} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <p className={labelCls}>{lang === 'tr' ? 'Yeni Şifre' : 'New Password'}</p>
              <input className={inputCls} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <p className={labelCls}>{lang === 'tr' ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password'}</p>
              <input className={inputCls} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
            </div>
            {pwError && <p className="text-red-400 text-xs font-semibold">{pwError}</p>}
            <button
              onClick={handlePasswordChange}
              className="w-full bg-primary text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
            >
              {pwSuccess
                ? <><span className="material-symbols-outlined text-lg">check_circle</span>{lang === 'tr' ? 'Değiştirildi!' : 'Changed!'}</>
                : <>{lang === 'tr' ? 'Şifreyi Değiştir' : 'Change Password'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Notifications Modal */}
      {activeModal === 'notifications' && (
        <Modal title={t.notifications} onClose={() => setActiveModal(null)}>
          <div className="flex flex-col gap-3">
            {[
              { label: lang === 'tr' ? 'Antrenman Hatırlatmaları' : 'Workout Reminders', value: notifWorkout, setter: setNotifWorkout },
              { label: lang === 'tr' ? 'Mesaj Bildirimleri' : 'Message Notifications', value: notifMessages, setter: setNotifMessages },
              { label: lang === 'tr' ? 'İlerleme Güncellemeleri' : 'Progress Updates', value: notifProgress, setter: setNotifProgress },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3.5">
                <span className="text-white text-sm font-semibold">{item.label}</span>
                <button
                  onClick={() => item.setter(!item.value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.value ? 'bg-primary' : 'bg-white/20'}`}
                >
                  <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Help Modal */}
      {activeModal === 'help' && (
        <Modal title={lang === 'tr' ? 'Yardım & Destek' : 'Help & Support'} onClose={() => setActiveModal(null)}>
          <div className="flex flex-col gap-3">
            {(lang === 'tr' ? [
              { q: 'Antrenman planımı nasıl değiştirebilirim?', a: 'Planlar sekmesine git ve mevcut planını düzenle veya yeni bir plan seç.' },
              { q: 'Koçuma nasıl mesaj atabilirim?', a: 'Sohbet sekmesinden koçuna doğrudan mesaj gönderebilirsin.' },
              { q: 'Paketimi nasıl yükseltebilirim?', a: 'Profil > Paket Yönetimi bölümünden mevcut paketini yükseltebilirsin.' },
              { q: 'Desteğe nasıl ulaşabilirim?', a: 'support@ptboard.com adresine e-posta gönderebilirsin.' },
            ] : [
              { q: 'How do I change my workout plan?', a: 'Go to the Plans tab and edit your current plan or select a new one.' },
              { q: 'How do I message my coach?', a: 'You can send a direct message to your coach from the Chat tab.' },
              { q: 'How do I upgrade my plan?', a: 'Go to Profile > Plan Management to upgrade your current plan.' },
              { q: 'How do I reach support?', a: 'Send an email to support@ptboard.com.' },
            ]).map(item => (
              <div key={item.q} className="bg-white/5 rounded-xl px-4 py-3.5">
                <p className="text-white text-sm font-bold mb-1">{item.q}</p>
                <p className="text-white/50 text-xs leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TrainerProfileScreen;
