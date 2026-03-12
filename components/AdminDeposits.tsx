
import React, { useState } from 'react';
import { Download, Check, X, Loader2, User, Clock, Wallet, ExternalLink } from 'lucide-react';
import { TelegramService } from '../services/telegram';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDepositsProps {
  onAction: (id: string, type: 'submission' | 'withdrawal', status: any) => Promise<void>;
}

export const AdminDeposits: React.FC<AdminDepositsProps> = ({ onAction }) => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  React.useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/deposits`);
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits);
      }
    } catch (e) {
      console.error('Fetch deposits failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await onAction(id, 'withdrawal', status); 
      await fetchDeposits();
      TelegramService.haptic('medium');
      TelegramService.showAlert(`Deposit ${status} successfully`);
    } catch (e) {
      console.error('Deposit action failed:', e);
      TelegramService.haptic('heavy');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-neon-blue/20 rounded-full animate-ping absolute" />
          <Loader2 className="w-12 h-12 text-neon-blue animate-spin relative z-10" />
        </div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest animate-pulse">Scanning Ledger...</p>
      </div>
    );
  }

  const pendingDeposits = deposits.filter(d => d.status === 'pending');

  if (pendingDeposits.length === 0) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8 text-slate-700 opacity-20" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vault Balanced</h4>
          <p className="text-[10px] text-slate-600 font-medium">No pending deposits to review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
          Pending Deposits ({pendingDeposits.length})
        </h3>
      </div>

      <div className="grid gap-4">
        {pendingDeposits.map((deposit, index) => {
          const isProcessing = processingId === deposit.id;
          return (
            <motion.div 
              key={deposit.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-5 space-y-4 border-white/5 hover:border-emerald-green/30 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-green/10 text-emerald-green">
                      <Wallet size={14} />
                    </span>
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-green transition-colors">
                      {deposit.amount} {deposit.currency}
                    </h4>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <User size={10} className="text-neon-blue" />
                      <span>ID: {deposit.user_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <Clock size={10} className="text-neon-blue" />
                      <span>{new Date(deposit.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-neon-blue font-black text-[10px] uppercase tracking-widest">{deposit.method}</p>
                  <p className="text-[9px] text-slate-600 font-mono mt-1 bg-white/5 px-2 py-0.5 rounded-md">{deposit.transaction_id}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isProcessing}
                  onClick={() => handleAction(deposit.id, 'APPROVED')}
                  className="flex-1 glass-button py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest emerald-green-glow flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Approve
                </button>
                <button 
                  disabled={isProcessing}
                  onClick={() => handleAction(deposit.id, 'REJECTED')}
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
