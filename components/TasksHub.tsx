
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Task, AdTask, TaskSubmission, AdView } from '../types';
import { TelegramService } from '../services/telegram';
import { Video, Megaphone, Rocket } from 'lucide-react';
import Tasks from './Tasks';
import AdTasks from './AdTasks';
import Promote from './Promote';

interface TasksHubProps {
  user: User;
  tasks: Task[];
  adTasks: AdTask[];
  submissions: TaskSubmission[];
  adViews: AdView[];
  onStartTask: (task: Task) => void;
  onStartAd: (task: AdTask) => void;
  onAddTask: (task: Task, cost: number, currency: 'SAR' | 'USDT') => void;
  onAddAdTask: (ad: AdTask, cost: number, currency: 'SAR' | 'USDT') => void;
  isMaintenanceVideos: boolean;
  isMaintenanceAds: boolean;
  isMaintenancePromote: boolean;
  onGoToDeposit: () => void;
  isSyncing?: boolean;
}

const TasksHub: React.FC<TasksHubProps> = ({
  user,
  tasks,
  adTasks,
  submissions,
  adViews,
  onStartTask,
  onStartAd,
  onAddTask,
  onAddAdTask,
  isMaintenanceVideos,
  isMaintenanceAds,
  isMaintenancePromote,
  onGoToDeposit,
  isSyncing
}) => {
  const [subTab, setSubTab] = useState<'videos' | 'ads' | 'promote'>('videos');

  const subTabs = [
    { id: 'videos', label: 'Videos', icon: <Video size={18} /> },
    { id: 'ads', label: 'Ads', icon: <Megaphone size={18} /> },
    { id: 'promote', label: 'Promote', icon: <Rocket size={18} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Top Segmented Control */}
      <div className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-md pt-4 pb-4 px-4 border-b border-white/5">
        <div className="backdrop-blur-xl bg-black/20 p-1 flex relative rounded-2xl border border-white/5">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                TelegramService.haptic('light');
                setSubTab(tab.id as any);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${
                subTab === tab.id 
                  ? 'text-white' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {subTab === tab.id && (
                <motion.div
                  layoutId="subtab-active"
                  className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* View Content */}
      <div className="px-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={subTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {subTab === 'videos' && (
              <Tasks 
                tasks={tasks} 
                submissions={submissions} 
                currentUser={user} 
                onStartTask={onStartTask} 
                isMaintenance={isMaintenanceVideos}
                isSyncing={isSyncing}
              />
            )}
            {subTab === 'ads' && (
              <AdTasks 
                tasks={adTasks} 
                views={adViews} 
                currentUser={user} 
                onStartAd={onStartAd} 
                isMaintenance={isMaintenanceAds}
              />
            )}
            {subTab === 'promote' && (
              <Promote 
                user={user} 
                tasks={tasks} 
                adTasks={adTasks} 
                submissions={submissions} 
                adViews={adViews} 
                onAddTask={onAddTask} 
                onAddAdTask={onAddAdTask} 
                isMaintenance={isMaintenancePromote}
                onGoToDeposit={onGoToDeposit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TasksHub;
