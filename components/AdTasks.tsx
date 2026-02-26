
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
    const isActive = task.status === 'active' || !task.status;
    return !isOwner && !isFull && isActive;
  });

  // Group tasks by networkName
  const groupedAds = availableAds.reduce((acc, task) => {
    const network = task.networkName || 'General';
    if (!acc[network]) acc[network] = [];
    acc[network].push(task);
    return acc;
  }, {} as Record<string, AdTask[]>);

  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'Adsterra': return '🌟';
      case 'Monetag': return '💎';
      case 'AdOperator': return '⚙️';
      case 'AdMaven': return '🦅';
      case 'HilltopAds': return '⛰️';
      case 'PropellerAds': return '🚁';
      default: return '🔗';
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <h2 className="text-2xl font-bold">Ad Tasks</h2>

      <div className="space-y-8">
        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
          <h4 className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">💰 Unified Ad Experience</h4>
          <p className="text-[10px] text-blue-200/70 leading-relaxed">
            All ads now open internally. Stay in the focus view for the full duration to unlock your reward.
          </p>
        </div>

        {availableAds.length === 0 ? (
          <div className="bg-slate-800/50 rounded-3xl border border-dashed border-slate-700 p-12 text-center space-y-4">
            <div className="text-4xl opacity-20">📢</div>
            <div>
              <h4 className="text-sm font-bold text-slate-300">No Ads Available</h4>
              <p className="text-[10px] text-slate-500">All ad campaigns are currently full. Try again later!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedAds).map(([network, networkTasks]) => (
            <div key={network} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{network} Tasks</h3>
              </div>
              <div className="space-y-3">
                {(networkTasks as AdTask[]).map(task => {
                  const completed = isViewed(task.id);
                  return (
                    <div key={task.id} className={`bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3 ${completed ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-lg border border-slate-700">
                            {getNetworkIcon(task.networkName || 'Custom')}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{task.title}</h3>
                            <p className="text-[10px] text-slate-400 font-medium">{task.networkName || 'Custom'} • {task.durationSeconds}s View</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold text-sm">+{task.rewardRiyal} SAR</p>
                        </div>
                      </div>

                      {completed ? (
                        <span className="text-center py-2 rounded-lg text-[10px] font-bold bg-slate-700 text-slate-500 uppercase">
                          Viewed (Reset in 24h)
                        </span>
                      ) : (
                        <button
                          onClick={() => onStartAd(task)}
                          className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-xs font-bold transition-colors"
                        >
                          View Ad
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdTasks;
