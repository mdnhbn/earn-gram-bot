
import React, { useState } from 'react';
import { User, Task, AdTask, TaskSubmission, AdView } from '../types';
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
    { id: 'videos', label: 'Videos', icon: '📺' },
    { id: 'ads', label: 'Ads', icon: '📢' },
    { id: 'promote', label: 'Promote', icon: '🚀' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      {/* Top Segmented Control */}
      <div className="sticky top-0 z-40 bg-slate-900 pt-4 pb-2 px-4">
        <div className="bg-slate-800 p-1 rounded-2xl flex border border-slate-700 shadow-lg">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                subTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* View Content */}
      <div className="px-0">
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
      </div>
    </div>
  );
};

export default TasksHub;
