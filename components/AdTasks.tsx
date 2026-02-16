
import React from 'react';
import { AdTask, AdView, User } from '../types';
import MaintenanceNotice from './MaintenanceNotice';

interface AdTasksProps {
  tasks: AdTask[];
  views: AdView[];
  currentUser: User;
  onStartAd: (task: AdTask) => void;
  isMaintenance?: boolean;
}

const AdTasks: React.FC<AdTasksProps> = ({ tasks, views, currentUser, onStartAd, isMaintenance }) => {
  if (isMaintenance) {
    return <MaintenanceNotice title="Ads Disabled" message="Ad network integrations are being updated. Instant reward ads will return shortly." />;
  }

  const isViewed = (adId: string) => views.some(v => v.adTaskId === adId);
  
  const availableAds = tasks.filter(task => {
    const isOwner = task.ownerId === currentUser.id;
    const completedCount = views.filter(v => v.adTaskId === task.id).length;
    const isFull = task.budget ? completedCount >= task.budget : false;
    return !isOwner && !isFull;
  });

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <h2 className="text-2xl font-bold">Ad Tasks</h2>

      <div className="space-y-4">
        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
          <h4 className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">💰 Unified Ad Experience</h4>
          <p className="text-[10px] text-blue-200/70 leading-relaxed">
            All ads now open internally. Stay in the focus view for the full duration to unlock your reward.
          </p>
        </div>

        {availableAds.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm italic">
            No ads available right now.
          </div>
        ) : (
          availableAds.map(task => {
            const completed = isViewed(task.id);
            return (
              <div key={task.id} className={`bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3 ${completed ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{task.title}</h3>
                    <p className="text-xs text-slate-400 font-medium">{task.durationSeconds}s View</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">+{task.rewardRiyal} SAR</p>
                  </div>
                </div>

                {completed ? (
                  <span className="text-center py-2 rounded-lg text-xs font-bold bg-slate-700 text-slate-500 uppercase">
                    Viewed (Reset in 24h)
                  </span>
                ) : (
                  <button
                    onClick={() => onStartAd(task)}
                    className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    View Ad
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdTasks;
