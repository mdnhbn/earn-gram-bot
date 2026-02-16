
import React from 'react';
import { Task, TaskSubmission, TaskStatus, User } from '../types';
import MaintenanceNotice from './MaintenanceNotice';

interface TasksProps {
  tasks: Task[];
  submissions: TaskSubmission[];
  currentUser: User;
  onStartTask: (task: Task) => void;
  isMaintenance?: boolean;
}

const Tasks: React.FC<TasksProps> = ({ tasks, submissions, currentUser, onStartTask, isMaintenance }) => {
  if (isMaintenance) {
    return <MaintenanceNotice title="Videos Paused" message="Our video tracking engine is being optimized. Video earning tasks are temporarily locked." />;
  }

  const availableTasks = tasks.filter(task => {
    const isOwner = task.ownerId === currentUser.id;
    const completedCount = submissions.filter(s => s.taskId === task.id).length;
    const isFull = task.budget ? completedCount >= task.budget : false;
    return !isOwner && !isFull;
  });

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <h2 className="text-2xl font-bold">Video Tasks</h2>
      
      <div className="space-y-4">
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
          <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1">⚠️ Strict Landing Page</h4>
          <p className="text-[10px] text-red-200/70 leading-relaxed">
            Tasks now open in a secure focused view. Do not leave the landing page until the timer finishes or you will receive a strike.
          </p>
        </div>

        {availableTasks.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm italic">
            No new videos available. Check back later!
          </div>
        ) : (
          availableTasks.map(task => {
            const submission = submissions.find(s => s.taskId === task.id);
            return (
              <div key={task.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{task.title}</h3>
                    <p className="text-xs text-slate-400 font-medium">{task.platform} • {task.timerSeconds}s</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-bold">+{task.rewardRiyal} SAR</p>
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
