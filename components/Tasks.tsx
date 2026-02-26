
import React, { useState, useEffect } from 'react';
import { Task, TaskSubmission, TaskStatus, User } from '../types';
import MaintenanceNotice from './MaintenanceNotice';

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
    const isOwner = task.ownerId === currentUser.id;
    const isCompleted = submissions.some(s => s.taskId === task.id && s.status === TaskStatus.APPROVED);
    const completedCount = submissions.filter(s => s.taskId === task.id && s.status === TaskStatus.APPROVED).length;
    const isFull = task.budget ? completedCount >= task.budget : false;
    const isActive = task.status === 'active' || !task.status;
    return !isOwner && !isCompleted && !isFull && isActive;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YouTube': return '🔴';
      case 'TikTok': return '🎵';
      case 'Dailymotion': return '🔵';
      case 'Vimeo': return '💠';
      case 'Facebook': return '📘';
      case 'Custom': return '📁';
      default: return '📺';
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-500 pb-32 relative">
      {isSyncing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-bounce flex items-center gap-2">
          {isSyncingSlowly ? (
            <>
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Slow connection, retrying...
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Syncing with server...
            </>
          )}
        </div>
      )}
      <h2 className="text-2xl font-bold">Video Tasks</h2>
      
      <div className="space-y-4">
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
          <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1">⚠️ Strict Landing Page</h4>
          <p className="text-[10px] text-red-200/70 leading-relaxed">
            Tasks now open in a secure focused view. Do not leave the landing page until the timer finishes or you will receive a strike.
          </p>
        </div>

        {availableTasks.length === 0 ? (
          <div className="bg-slate-800/50 rounded-3xl border border-dashed border-slate-700 p-12 text-center space-y-4">
            <div className="text-4xl opacity-20">📺</div>
            <div>
              <h4 className="text-sm font-bold text-slate-300">No Videos Available</h4>
              <p className="text-[10px] text-slate-500">Check back later for new earning opportunities.</p>
            </div>
          </div>
        ) : (
          availableTasks.map(task => {
            const submission = submissions.find(s => s.taskId === task.id);
            return (
              <div key={task.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-lg border border-slate-700">
                      {getPlatformIcon(task.platform)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{task.title}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">{task.platform} • {task.timerSeconds}s</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-bold text-sm">+{task.rewardRiyal} SAR</p>
                  </div>
                </div>

                {submission?.status === TaskStatus.APPROVED ? (
                  <span className="text-center py-2 rounded-lg text-xs font-bold bg-green-500/20 text-green-400">
                    COMPLETED
                  </span>
                ) : (
                  <button
                    onClick={() => onStartTask(task)}
                    className="w-full bg-slate-700 hover:bg-blue-600 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    Start Task
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

export default Tasks;
