
import React from 'react';

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isAdmin: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, setTab, isAdmin }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'tasks', label: 'Tasks', icon: '🎯' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: '⚙️' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
              currentTab === tab.id ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
