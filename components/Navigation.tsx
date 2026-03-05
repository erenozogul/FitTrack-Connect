
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { translations } from '../App';

interface NavItemProps {
  icon: string;
  label: string;
  path: string;
  isActive: boolean;
  onClick: (path: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, path, isActive, onClick }) => (
  <button 
    onClick={() => onClick(path)}
    className={`flex flex-col items-center gap-1 p-2 transition-all active:scale-90 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-white/40'}`}
  >
    <span className={`material-symbols-outlined text-2xl ${isActive ? 'fill-1' : ''}`}>
      {icon}
    </span>
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export const BottomNav: React.FC<{ role: 'trainer' | 'student', lang: 'tr' | 'en' }> = ({ role, lang }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[lang];

  const trainerTabs = [
    { icon: 'folder', label: t.library, path: '/library' },
    { icon: 'groups', label: t.board, path: '/live' },
    { icon: 'credit_card', label: t.plans, path: '/plans' },
    { icon: 'account_circle', label: t.profile, path: '/dashboard' }
  ];

  const studentTabs = [
    { icon: 'home', label: t.home, path: '/dashboard' },
    { icon: 'explore', label: t.map, path: '/explore' },
    { icon: 'forum', label: t.chat, path: '/chat' },
    { icon: 'person', label: t.profile, path: '/dashboard' }
  ];

  const tabs = role === 'trainer' ? trainerTabs : studentTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-slate-100 dark:border-white/5 z-50 px-4 py-2 flex justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
      {tabs.map((tab) => (
        <NavItem 
          key={tab.path}
          {...tab}
          isActive={location.pathname === tab.path}
          onClick={navigate}
        />
      ))}
    </nav>
  );
};
