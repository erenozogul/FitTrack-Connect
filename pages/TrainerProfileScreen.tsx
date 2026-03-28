
import React, { useState } from 'react';
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

type ModalType = 'personalInfo' | 'password' | 'notifications' | 'help' | null;

const TrainerProfileScreen: React.FC<TrainerProfileScreenProps> = ({
  lang, setLang, onLogout, userName, role = 'trainer', isDarkMode, setIsDarkMode
}) => {
  const isTrainer = role === 'trainer';
  const t = translations[lang];

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [notifWorkout, setNotifWorkout] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifProgress, setNotifProgress] = useState(false);

  // Read user info from localStorage
  const userStr = localStorage.getItem('fittrack_user');
  let parsedUser: Record<string, string> = {};
  try {
    if (userStr) parsedUser = JSON.parse(userStr);
  } catch { /* ignore */ }

  const [firstName, setFirstName] = useState(parsedUser.firstName || '');
  const [lastName, setLastName] = useState(parsedUser.lastName || '');
  const [email, setEmail] = useState(parsedUser.email || '');
  const [infoSaved, setInfoSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const storedName = userName || (parsedUser.firstName && parsedUser.lastName ? `${parsedUser.firstName} ${parsedUser.lastName}` : '');
  const displayName = storedName || (lang === 'tr' ? 'Antrenör' : 'Trainer');
  const storedEmail = parsedUser.email || '';

  const handleLogout = () => {
    onLogout();
    window.location.hash = '#/';
  };

  const savePersonalInfo = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    const updated = { ...parsedUser, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() };
    localStorage.setItem('fittrack_user', JSON.stringify(updated));
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
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-background-dark/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-white">
            {lang === 'tr' ? 'Profil' : 'Profile'}
          </h1>
          <button
            onClick={() => setActiveModal('personalInfo')}
            className="bg-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-white text-2xl">settings</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-6">
        {/* Profile section */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src="https://picsum.photos/seed/trainer/200/200"
              alt={displayName}
              className="size-24 rounded-3xl border-2 border-primary/40 object-cover"
            />
            <button
              onClick={() => alert(t.comingSoon)}
              className="absolute bottom-0 right-0 bg-primary text-white rounded-full size-8 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
          </div>
          <h2 className="text-2xl font-black text-white">{displayName}</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            {isTrainer ? (lang === 'tr' ? 'KİŞİSEL ANTRENÖR' : 'PERSONAL TRAINER') : (lang === 'tr' ? 'ÖĞRENCİ' : 'STUDENT')}
          </span>
          {storedEmail && <p className="text-sm text-white/40">{storedEmail}</p>}
        </div>

        {/* Stats row */}
        <div className={`grid gap-3 ${isTrainer ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {isTrainer && (
            <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-white">5</p>
              <p className="text-[10px] text-white/40 uppercase mt-1">
                {lang === 'tr' ? 'Aktif Öğrenci' : 'Active Students'}
              </p>
            </div>
          )}
          <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{isTrainer ? '124' : '38'}</p>
            <p className="text-[10px] text-white/40 uppercase mt-1">
              {lang === 'tr' ? 'Toplam Seans' : 'Total Sessions'}
            </p>
          </div>
          <div className="bg-card-dark border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{isTrainer ? '4.9 ⭐' : '82.4 kg'}</p>
            <p className="text-[10px] text-white/40 uppercase mt-1">
              {isTrainer ? (lang === 'tr' ? 'Değerlendirme' : 'Rating') : (lang === 'tr' ? 'Güncel Kilo' : 'Current Weight')}
            </p>
          </div>
        </div>

        {/* Account settings */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">
            {lang === 'tr' ? 'Hesap' : 'Account'}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveModal('personalInfo')}
              className="bg-card-dark border border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-primary text-xl">person</span>
              <span className="flex-1 text-white text-sm font-semibold">{lang === 'tr' ? 'Kişisel Bilgiler' : 'Personal Info'}</span>
              <span className="material-symbols-outlined text-white/20 text-lg">chevron_right</span>
            </button>
            <button
              onClick={() => setActiveModal('password')}
              className="bg-card-dark border border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-primary text-xl">lock</span>
              <span className="flex-1 text-white text-sm font-semibold">{lang === 'tr' ? 'Şifre Değiştir' : 'Change Password'}</span>
              <span className="material-symbols-outlined text-white/20 text-lg">chevron_right</span>
            </button>
            <button
              onClick={() => setActiveModal('notifications')}
              className="bg-card-dark border border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-primary text-xl">notifications</span>
              <span className="flex-1 text-white text-sm font-semibold">{t.notifications}</span>
              <span className="material-symbols-outlined text-white/20 text-lg">chevron_right</span>
            </button>
          </div>
        </div>

        {/* App settings */}
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-1">
            {lang === 'tr' ? 'Uygulama' : 'App'}
          </p>
          <div className="flex flex-col gap-2">
            {/* Appearance - inline toggle */}
            <div className="bg-card-dark border border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">dark_mode</span>
              <span className="flex-1 text-white text-sm font-semibold">{lang === 'tr' ? 'Görünüm' : 'Appearance'}</span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-primary' : 'bg-white/20'}`}
              >
                <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs text-white/40 font-semibold ml-1 w-12 text-right">
                {isDarkMode ? (lang === 'tr' ? 'Koyu' : 'Dark') : (lang === 'tr' ? 'Açık' : 'Light')}
              </span>
            </div>

            {/* Language - inline toggle */}
            <div className="bg-card-dark border border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">language</span>
              <span className="flex-1 text-white text-sm font-semibold">{lang === 'tr' ? 'Dil / Language' : 'Language / Dil'}</span>
              <button
                onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
                className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-colors active:scale-95"
              >
                <span className="text-xs font-black text-primary">{lang === 'tr' ? 'TR' : 'EN'}</span>
                <span className="material-symbols-outlined text-primary text-sm">swap_horiz</span>
                <span className="text-xs font-black text-white/40">{lang === 'tr' ? 'EN' : 'TR'}</span>
              </button>
            </div>

            {/* Help */}
            <button
              onClick={() => setActiveModal('help')}
              className="bg-card-dark border border-white/5 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-primary text-xl">help</span>
              <span className="flex-1 text-white text-sm font-semibold">{lang === 'tr' ? 'Yardım' : 'Help & Support'}</span>
              <span className="material-symbols-outlined text-white/20 text-lg">chevron_right</span>
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
            <button
              onClick={savePersonalInfo}
              className="w-full bg-primary text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
            >
              {infoSaved
                ? <><span className="material-symbols-outlined text-lg">check_circle</span>{lang === 'tr' ? 'Kaydedildi!' : 'Saved!'}</>
                : <>{lang === 'tr' ? 'Kaydet' : 'Save'}</>
              }
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
                : <>{lang === 'tr' ? 'Şifreyi Değiştir' : 'Change Password'}</>
              }
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
