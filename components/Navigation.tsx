
import React from 'react';
import { TelegramService } from '../services/telegram';

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isAdmin: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, setTab, isAdmin }) => {
  const tgUser = TelegramService.getUser();
  const isPreviewMode = !tgUser.id || tgUser.id === 'demo_id' || tgUser.id === 12345678;

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'tasks', label: 'Tasks', icon: '🎯' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const isSuperAdmin = tgUser.id === 929198867;

  if (isSuperAdmin || isPreviewMode) {
    tabs.push({ id: 'admin', label: 'Admin', icon: '⚙️' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-md border-t border-slate-700/50 pb-safe z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
      <div className="flex justify-around items-center h-20 px-4 max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              TelegramService.haptic('light');
              setTab(tab.id);
            }}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${
              currentTab === tab.id ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            {currentTab === tab.id && (
              <span className="absolute top-2 w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
            )}
            <span className={`text-2xl mb-1.5 transition-transform duration-300 ${currentTab === tab.id ? 'scale-110 -translate-y-1' : ''}`}>
              {tab.icon}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${currentTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
