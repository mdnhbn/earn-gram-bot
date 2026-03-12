
import React from 'react';
import { motion } from 'motion/react';
import { TelegramService } from '../services/telegram';
import { Home, Target, Wallet, User as UserIcon, Settings } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isAdmin: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, setTab, isAdmin }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'tasks', label: 'Tasks', icon: <Target size={20} /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet size={20} /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon size={20} /> },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: <Settings size={20} /> });
  }

  return (
    <nav className="nav-floating">
      <div className="flex justify-between items-center w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              TelegramService.haptic('light');
              setTab(tab.id);
            }}
            className={`flex flex-col items-center justify-center relative px-3 py-1 transition-all duration-300 ${
              currentTab === tab.id ? 'text-primary' : 'text-slate-400 opacity-60'
            }`}
          >
            {currentTab === tab.id && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 bg-white/10 rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className={`transition-transform duration-300 ${currentTab === tab.id ? 'scale-110 -translate-y-0.5' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${currentTab === tab.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
