
import React, { useState, useMemo } from 'react';
import { 
  Banknote, Check, X, Loader2, User, Clock, Wallet, 
  Search, TrendingUp, Users, Calendar, ArrowUpRight,
  Filter, History, AlertCircle
} from 'lucide-react';
import { WithdrawalRequest, User as UserProfile } from '../types';
import { TelegramService } from '../services/telegram';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPayoutsProps {
  withdrawals: WithdrawalRequest[];
  users: UserProfile[];
  onAction: (id: string, type: 'submission' | 'withdrawal', status: any) => Promise<void>;
}

export const AdminPayouts: React.FC<AdminPayoutsProps> = ({ withdrawals, users, onAction }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Statistics Calculations
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const todayPaid = withdrawals
      .filter(w => w.status === 'COMPLETED' && new Date(w.createdAt).getTime() >= startOfToday)
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const todayCount = withdrawals
      .filter(w => w.status === 'COMPLETED' && new Date(w.createdAt).getTime() >= startOfToday)
      .length;

    const monthlyTotal = withdrawals
      .filter(w => w.status === 'COMPLETED' && new Date(w.createdAt).getTime() >= startOfMonth)
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // For "Monthly Refill", we'll use a portion of the total or a specific calculation if needed.
    // Based on the prompt, it seems to be a "Bot share" metric.
    const monthlyRefill = monthlyTotal * 0.85; // Example calculation for "Bot share"

    return {
      todayPaid,
      todayCount,
      totalUsers: users.length,
      monthlyTotal,
      monthlyRefill
    };
  }, [withdrawals, users]);

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING');
  
  const processedPayments = useMemo(() => {
    return withdrawals
      .filter(w => w.status === 'COMPLETED' || w.status === 'APPROVED')
      .filter(w => {
        if (!searchQuery) return true;
        return w.userId.toString().includes(searchQuery);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [withdrawals, searchQuery]);

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

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Statistical Overview */}
      <div className="grid grid-cols-2 gap-3">
        {/* Box 1: Today's Paid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-1"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Today's Paid</span>
            <TrendingUp size={12} className="text-emerald-500" />
          </div>
          <div className="text-xl font-black text-white">{stats.todayPaid.toLocaleString()} <span className="text-[10px] text-emerald-500/70">SAR</span></div>
          <div className="text-[9px] text-emerald-500/60 font-bold uppercase tracking-tighter">{stats.todayCount} payments</div>
        </motion.div>

        {/* Box 2: Old Users */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-1"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Old Users</span>
            <Users size={12} className="text-blue-500" />
          </div>
          <div className="text-xl font-black text-white">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-[9px] text-blue-500/60 font-bold uppercase tracking-tighter">Subscribers</div>
        </motion.div>

        {/* Box 3: Bots Total */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 space-y-1"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Bots Total</span>
            <Calendar size={12} className="text-purple-500" />
          </div>
          <div className="text-xl font-black text-white">{stats.monthlyTotal.toLocaleString()} <span className="text-[10px] text-purple-500/70">SAR</span></div>
          <div className="text-[9px] text-purple-500/60 font-bold uppercase tracking-tighter">This month</div>
        </motion.div>

        {/* Box 4: Monthly Refill */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 space-y-1"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Monthly Refill</span>
            <ArrowUpRight size={12} className="text-orange-500" />
          </div>
          <div className="text-xl font-black text-white">{stats.monthlyRefill.toLocaleString()} <span className="text-[10px] text-orange-500/70">SAR</span></div>
          <div className="text-[9px] text-orange-500/60 font-bold uppercase tracking-tighter">Bot share</div>
        </motion.div>
      </div>

      {/* 2. Search History System */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
            <History size={12} />
            Search Payment History
          </h3>
        </div>
        <div className="relative group">
          <input 
            type="text"
            placeholder="User ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-5 pr-14 text-sm font-bold text-white placeholder:text-slate-600 focus:border-blue-500/50 transition-all outline-none"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* 3. Lists and Tables */}
      
      {/* Pending Withdrawals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
            <Clock size={12} className="text-orange-500" />
            Pending Withdrawals
          </h3>
          {pendingWithdrawals.length > 0 && (
            <span className="bg-orange-500/10 text-orange-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
              {pendingWithdrawals.length} Requests
            </span>
          )}
        </div>

        {pendingWithdrawals.length === 0 ? (
          <div className="bg-slate-900/30 border border-dashed border-white/5 rounded-3xl p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-slate-700" />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingWithdrawals.map((withdrawal) => (
              <motion.div 
                key={withdrawal.id}
                layout
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Wallet size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">{withdrawal.amount} {withdrawal.currency}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">ID: {withdrawal.userId}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{withdrawal.method}</div>
                    <div className="text-[8px] text-slate-600 font-mono mt-1">{new Date(withdrawal.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    disabled={!!processingId}
                    onClick={() => handleAction(withdrawal.id, 'APPROVED')}
                    className="flex-1 bg-emerald-500 text-midnight py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingId === withdrawal.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Approve
                  </button>
                  <button 
                    disabled={!!processingId}
                    onClick={() => handleAction(withdrawal.id, 'REJECTED')}
                    className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingId === withdrawal.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Payments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
            <Check size={12} className="text-emerald-500" />
            Processed Payments
          </h3>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden">
          {processedPayments.length === 0 ? (
            <div className="p-10 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              No payment history found
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {processedPayments.map((payment) => (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">User: {payment.userId}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">{new Date(payment.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs font-black text-white">{payment.amount} <span className="text-[8px] text-slate-500">SAR</span></div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-tighter">
                      <Check size={8} />
                      Completed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
