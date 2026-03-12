
import React from 'react';
import { motion } from 'motion/react';
import { AdTask, AdView, User } from '../types';
import MaintenanceNotice from './MaintenanceNotice';
import { 
  Megaphone, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Gem, 
  Settings, 
  Zap, 
  Mountain, 
  Plane,
  Info,
  ChevronRight
} from 'lucide-react';

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
    const isOwner = task.ownerId === currentUser?.id;
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
      case 'Adsterra': return <Sparkles className="text-amber-400" size={20} />;
      case 'Monetag': return <Gem className="text-blue-400" size={20} />;
      case 'AdOperator': return <Settings className="text-slate-400" size={20} />;
      case 'AdMaven': return <Zap className="text-yellow-400" size={20} />;
      case 'HilltopAds': return <Mountain className="text-emerald-400" size={20} />;
      case 'PropellerAds': return <Plane className="text-sky-400" size={20} />;
      default: return <Megaphone className="text-primary" size={20} />;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 space-y-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-1 h-8 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
        <h2 className="text-2xl font-black tracking-tight text-white">Ad Tasks</h2>
      </motion.div>

      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-1">
            <Info size={14} className="text-blue-400" />
            <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-wider">Unified Ad Experience</h4>
          </div>
          <p className="text-[10px] text-blue-200/60 leading-relaxed">
            All ads now open internally. Stay in the focus view for the full duration to unlock your reward.
          </p>
        </motion.div>

        {availableAds.length === 0 ? (
          <div className="glass-card-dark rounded-3xl border-dashed border-white/5 p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Megaphone size={32} className="text-slate-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-300">No active ads available</h4>
              <p className="text-[10px] text-slate-500">All ad campaigns are currently full or inactive. Try again later!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedAds).map(([network, networkTasks]) => (
            <motion.div 
              key={network} 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-4 bg-primary rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{network} Network</h3>
              </div>
              <div className="space-y-3">
                {(networkTasks as AdTask[]).map(task => {
                  const completed = isViewed(task.id);
                  return (
                    <motion.div 
                      key={task.id} 
                      variants={item}
                      whileHover={{ scale: 1.01 }}
                      className={`glass-card p-4 rounded-2xl border-white/5 flex flex-col gap-4 group transition-all ${completed ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 glass-card-dark rounded-xl flex items-center justify-center border-white/5 shadow-inner group-hover:border-primary/30 transition-colors">
                            {getNetworkIcon(task.networkName || 'Custom')}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white group-hover:text-primary-light transition-colors">{task?.title || 'Ad Task'}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-medium">{task?.networkName || 'Custom'}</span>
                              <span className="w-1 h-1 bg-slate-600 rounded-full" />
                              <span className="text-[10px] text-slate-400">{task?.durationSeconds || 15}s View</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <p className="text-emerald-400 font-black text-xs">+{task.rewardRiyal} SAR</p>
                        </div>
                      </div>

                      {completed ? (
                        <div className="w-full bg-slate-800/50 border border-white/5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-slate-500">
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Viewed (Reset in 24h)</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onStartAd(task)}
                          className="btn-premium w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group/btn"
                        >
                          <span>View Ad</span>
                          <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdTasks;
