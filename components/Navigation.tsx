
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { translations } from '../App';

interface NavItemProps {
  icon: string;
  label: string;
  path: string;
  isActive: boolean;
  onClick: (path: string) => void;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, path, isActive, onClick, badge }) => (
  <button
    onClick={() => onClick(path)}
    className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-4 p-2 md:p-3 md:w-full rounded-xl transition-all active:scale-95 ${isActive ? 'bg-white text-primary shadow-lg shadow-black/10' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
  >
    <div className="relative">
      <span className={`material-symbols-outlined text-2xl ${isActive ? 'fill-1' : ''}`}>
        {icon}
      </span>
      {badge !== undefined && badge > 0 && !isActive && (
        <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-black">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
    <span className="text-[10px] md:text-sm font-bold uppercase md:normal-case md:font-semibold md:tracking-normal tracking-widest">{label}</span>
  </button>
);

const getUnreadCount = () => {
  try {
    const notes = JSON.parse(localStorage.getItem('fittrack_notes') || '[]');
    return notes.filter((n: any) => !n.isRead).length;
  } catch { return 0; }
};

export const BottomNav: React.FC<{ role: 'trainer' | 'student', lang: 'tr' | 'en' }> = ({ role, lang }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[lang];
  const [unreadCount] = useState(getUnreadCount);

  const trainerTabs = [
    { icon: 'home', label: t.home, path: '/dashboard' },
    { icon: 'folder', label: t.library, path: '/library' },
    { icon: 'chat_bubble', label: t.chat, path: '/messages' },
    { icon: 'edit_note', label: lang === 'tr' ? 'Notlar' : 'Notes', path: '/notes' },
    { icon: 'groups', label: lang === 'tr' ? 'Öğrenciler' : 'Students', path: '/students' },
    { icon: 'account_circle', label: t.profile, path: '/profile' },
  ];

  const studentTabs = [
    { icon: 'home', label: t.home, path: '/dashboard' },
    { icon: 'folder', label: t.library, path: '/library' },
    { icon: 'edit_note', label: lang === 'tr' ? 'Notlar' : 'Notes', path: '/notes' },
    { icon: 'chat_bubble', label: t.chat, path: '/messages' },
    { icon: 'account_circle', label: t.profile, path: '/profile' },
  ];

  const tabs = role === 'trainer' ? trainerTabs : studentTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:w-64 md:h-screen bg-primary/95 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/20 z-50 px-2 md:px-4 py-2 md:py-8 flex md:flex-col justify-around md:justify-start md:gap-2 shadow-[0_-10px_30px_rgba(0,122,255,0.2)] transition-colors">
      <div className="hidden md:block px-4 mb-8">
        <h2 className="text-2xl font-black italic tracking-tighter text-white">PT<span className="text-white/80">Board</span></h2>
      </div>
      {tabs.map((tab) => (
        <NavItem
          key={tab.path}
          {...tab}
          isActive={location.pathname === tab.path}
          onClick={navigate}
          badge={tab.path === '/notes' && role === 'student' ? unreadCount : undefined}
        />
      ))}
    </nav>
  );
};
