
import React, { useState } from 'react';
import { Banknote, Check, X, Loader2, User, Clock, Wallet, ExternalLink } from 'lucide-react';
import { WithdrawalRequest } from '../types';
import { TelegramService } from '../services/telegram';
import { motion, AnimatePresence } from 'motion/react';

interface AdminWithdrawalsProps {
  withdrawals: WithdrawalRequest[];
  onAction: (id: string, type: 'submission' | 'withdrawal', status: any) => Promise<void>;
}

export const AdminWithdrawals: React.FC<AdminWithdrawalsProps> = ({ withdrawals, onAction }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING');

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await onAction(id, 'withdrawal', status);
      TelegramService.haptic('medium');
      TelegramService.showAlert(`Withdrawal ${status} successfully`);
    } catch (e) {
      console.error('Withdrawal action failed:', e);
      TelegramService.haptic('heavy');
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingWithdrawals.length === 0) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
          <Banknote className="w-8 h-8 text-slate-700 opacity-20" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payouts Clear</h4>
          <p className="text-[10px] text-slate-600 font-medium">No pending withdrawals to review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
          Pending Payouts ({pendingWithdrawals.length})
        </h3>
      </div>

      <div className="grid gap-4">
        {pendingWithdrawals.map((withdrawal, index) => {
          const isProcessing = processingId === withdrawal.id;
          return (
            <motion.div 
              key={withdrawal.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-5 space-y-4 border-white/5 hover:border-neon-blue/30 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-neon-blue/10 text-neon-blue">
                      <Wallet size={14} />
                    </span>
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-neon-blue transition-colors">
                      {withdrawal.amount} {withdrawal.currency}
                    </h4>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <User size={10} className="text-emerald-green" />
                      <span>ID: {withdrawal.userId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <Clock size={10} className="text-emerald-green" />
                      <span>{new Date(withdrawal.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-green font-black text-[10px] uppercase tracking-widest">{withdrawal.method}</p>
                  <p className="text-[9px] text-slate-600 mt-1 font-mono bg-white/5 px-2 py-0.5 rounded-md break-all">{withdrawal.address}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={!!processingId}
                  onClick={() => handleAction(withdrawal.id, 'APPROVED')}
                  className="flex-1 glass-button py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest emerald-green-glow flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === withdrawal.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Approve
                </button>
                <button 
                  disabled={!!processingId}
                  onClick={() => handleAction(withdrawal.id, 'REJECTED')}
                  className="flex-1 glass-button py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 border-red-500/20 hover:bg-red-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === withdrawal.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
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
