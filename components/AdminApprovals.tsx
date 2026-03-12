
import React, { useState } from 'react';
import { Check, X, Loader2, User, Play, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Task, AdTask, User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AdminApprovalsProps {
  tasks: Task[];
  adTasks: AdTask[];
  users: UserType[];
  onApprove: (id: string, isVideo: boolean) => Promise<void>;
  onReject: (id: string, isVideo: boolean) => Promise<void>;
}

export const AdminApprovals: React.FC<AdminApprovalsProps> = ({ 
  tasks, 
  adTasks, 
  users, 
  onApprove, 
  onReject 
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingItems = [...tasks, ...adTasks].filter(t => t.status === 'pending_approval');

  const handleAction = async (id: string, isVideo: boolean, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      if (action === 'approve') {
        await onApprove(id, isVideo);
      } else {
        await onReject(id, isVideo);
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingItems.length === 0) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-slate-700 opacity-20" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Queue Clear</h4>
          <p className="text-[10px] text-slate-600 font-medium">No pending missions to review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
          Pending Approvals ({pendingItems.length})
        </h3>
      </div>

      <div className="grid gap-4">
        {pendingItems.map((item, index) => {
          const isVideo = 'platform' in item;
          const creator = users.find(u => u.id === item.ownerId);
          const isProcessing = processingId === item.id;

          return (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-5 space-y-4 border-white/5 hover:border-neon-blue/30 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${isVideo ? 'bg-neon-blue/10 text-neon-blue' : 'bg-emerald-green/10 text-emerald-green'}`}>
                      {isVideo ? <Play size={14} /> : <LinkIcon size={14} />}
                    </span>
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-neon-blue transition-colors">{item.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className={isVideo ? 'text-neon-blue' : 'text-emerald-green'}>
                      {isVideo ? (item as Task).platform : (item as AdTask).networkName}
                    </span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      @{creator?.username || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-green font-black text-sm">{item.rewardRiyal.toFixed(2)} SAR</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Budget: {item.budget}</p>
                </div>
              </div>

              <div className="flex gap-2 p-2 bg-white/5 rounded-xl">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 glass-button py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ExternalLink size={12} />
                  Preview
                </a>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isProcessing}
                  onClick={() => handleAction(item.id, isVideo, 'approve')}
                  className="flex-1 glass-button py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest emerald-green-glow flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Approve
                </button>
                <button 
                  disabled={isProcessing}
                  onClick={() => handleAction(item.id, isVideo, 'reject')}
                  className="flex-1 glass-button py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 border-red-500/20 hover:bg-red-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  Reject
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
