
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, TaskSubmission, TaskStatus, User } from '../types';
import MaintenanceNotice from './MaintenanceNotice';
import { 
  Youtube, 
  Music2, 
  PlayCircle, 
  Video, 
  Facebook, 
  FileVideo, 
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  submissions: TaskSubmission[];
  currentUser: User;
  onStartTask: (task: Task) => void;
  isMaintenance?: boolean;
  isSyncing?: boolean;
}

const Tasks: React.FC<TasksProps> = ({ tasks, submissions, currentUser, onStartTask, isMaintenance, isSyncing }) => {
  const [isSyncingSlowly, setIsSyncingSlowly] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSyncing) {
      timer = setTimeout(() => setIsSyncingSlowly(true), 3000);
    } else {
      setIsSyncingSlowly(false);
    }
    return () => clearTimeout(timer);
  }, [isSyncing]);

  if (isMaintenance) {
    return <MaintenanceNotice title="Videos Paused" message="Our video tracking engine is being optimized. Video earning tasks are temporarily locked." />;
  }

  const availableTasks = tasks.filter(task => {
    if (currentUser?.role === 'admin') return true;
    const isOwner = task.ownerId === currentUser?.id;
    const isCompleted = submissions.some(s => s.taskId === task.id && s.status === TaskStatus.APPROVED);
    const completedCount = submissions.filter(s => s.taskId === task.id && s.status === TaskStatus.APPROVED).length;
    const isFull = task.budget ? completedCount >= task.budget : false;
    const isActive = task.status === 'active' || !task.status;
    return !isOwner && !isCompleted && !isFull && isActive;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YouTube': return <Youtube className="text-red-500" size={20} />;
      case 'TikTok': return <Music2 className="text-pink-500" size={20} />;
      case 'Dailymotion': return <PlayCircle className="text-blue-500" size={20} />;
      case 'Vimeo': return <Video className="text-cyan-400" size={20} />;
      case 'Facebook': return <Facebook className="text-blue-600" size={20} />;
      case 'Custom': return <FileVideo className="text-purple-500" size={20} />;
      default: return <Video className="text-slate-400" size={20} />;
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
    <div className="p-4 space-y-6 pb-32 relative">
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 border-primary/20"
          >
            {isSyncingSlowly ? (
              <>
                <AlertCircle size={14} className="text-amber-400 animate-pulse" />
                <span className="text-amber-200">Slow connection, retrying...</span>
              </>
            ) : (
              <>
                <Loader2 size={14} className="text-primary animate-spin" />
                <span className="text-primary-light">Syncing with server...</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        <h2 className="text-2xl font-black tracking-tight text-white">Video Tasks</h2>
      </motion.div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.div variants={item} className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-red-400" />
            <h4 className="text-red-400 font-black text-[10px] uppercase tracking-wider">Strict Landing Page</h4>
          </div>
          <p className="text-[10px] text-red-200/60 leading-relaxed">
            Tasks now open in a secure focused view. Do not leave the landing page until the timer finishes or you will receive a strike.
          </p>
        </motion.div>

        {availableTasks.length === 0 ? (
          <motion.div 
            variants={item}
            className="backdrop-blur-xl bg-black/20 rounded-3xl border-dashed border-white/5 p-12 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Video size={32} className="text-slate-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-300">No active tasks available</h4>
              <p className="text-[10px] text-slate-500">Check back later for new earning opportunities.</p>
            </div>
          </motion.div>
        ) : (
          availableTasks.map(task => {
            const submission = submissions.find(s => s.taskId === task.id);
            const isCompleted = submission?.status === TaskStatus.APPROVED;
            
            return (
              <motion.div 
                key={task.id} 
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl p-4 rounded-2xl border-white/5 flex flex-col gap-4 group transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 backdrop-blur-xl bg-black/20 rounded-xl flex items-center justify-center border-white/5 shadow-inner group-hover:border-primary/30 transition-colors">
                      {getPlatformIcon(task.platform)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-primary-light transition-colors">{task?.title || 'Untitled Task'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">{task?.platform || 'Video'}</span>
                        <span className="w-1 h-1 bg-slate-600 rounded-full" />
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock size={10} />
                          <span>{task?.timerSeconds || 15}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <p className="text-primary-light font-black text-xs">+{task.rewardRiyal} SAR</p>
                  </div>
                </div>

                {isCompleted ? (
                  <div className="w-full bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-xl flex items-center justify-center gap-2 text-emerald-400">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartTask(task)}
                    className="btn-premium w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group/btn"
                  >
                    <span>Start Task</span>
                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
};

export default Tasks;
