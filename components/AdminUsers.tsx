
import React, { useState } from 'react';
import { 
  Users, Search, Shield, ShieldAlert, 
  Trash2, RefreshCw, Smartphone, 
  CreditCard, Wallet, AlertTriangle,
  ChevronDown, ChevronUp, Send, Ban,
  CheckCircle2, XCircle, User as UserIcon
} from 'lucide-react';
import { User } from '../types';
import { TelegramService } from '../services/telegram';
import { motion, AnimatePresence } from 'motion/react';

interface AdminUsersProps {
  users: User[];
  onUnban: (userId: number) => void;
  onResetDevice: (userId: number) => Promise<void>;
  onUpdateBalance: (userId: number, amount: number, currency: 'SAR' | 'USDT', type: 'ADJUSTMENT', description: string) => Promise<void>;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ 
  users, onUnban, onResetDevice, onUpdateBalance 
}) => {
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [adjustment, setAdjustment] = useState({ amount: '', currency: 'SAR' as 'SAR' | 'USDT' });
  const [userMessage, setUserMessage] = useState('');

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.id.toString().includes(search)
  ).slice(0, 50); // Limit to 50 for performance

  const handleAdjustBalance = async (userId: number, isAdd: boolean) => {
    const amount = parseFloat(adjustment.amount);
    if (isNaN(amount) || amount <= 0) return;
    
    const finalAmount = isAdd ? amount : -amount;
    try {
      await onUpdateBalance(userId, finalAmount, adjustment.currency, 'ADJUSTMENT', 'Admin Adjustment');
      setAdjustment({ ...adjustment, amount: '' });
      TelegramService.haptic('medium');
      TelegramService.showAlert('Balance adjusted successfully!');
    } catch (e) {
      TelegramService.haptic('heavy');
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
            <Users size={12} className="text-neon-blue" /> User Directory
          </h3>
          <span className="text-[9px] font-black text-neon-blue bg-neon-blue/10 px-2 py-0.5 rounded-full border border-neon-blue/20">
            {users.length} TOTAL
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search by username or ID..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-neon-blue/50 transition-all placeholder:text-slate-700"
          />
        </div>

        <div className="space-y-3">
          {filteredUsers.map(u => {
            const isExpanded = expandedUserId === u.id;
            return (
              <motion.div 
                layout
                key={u.id} 
                className={`bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-neon-blue/30 ring-1 ring-neon-blue/20' : 'border-white/5'}`}
              >
                <div 
                  onClick={() => { setExpandedUserId(isExpanded ? null : u.id); TelegramService.haptic('light'); }}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                      <UserIcon size={20} className={u.isBanned ? 'text-red-500' : 'text-slate-400'} />
                      {u.isVerified && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-blue rounded-full border-2 border-midnight flex items-center justify-center">
                          <CheckCircle2 size={8} className="text-midnight" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">@{u.username || 'unknown'}</p>
                      <p className="text-[9px] text-slate-500 font-mono tracking-tighter">ID: {u.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-green">{u.balanceRiyal.toFixed(2)} SAR</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {u.isBanned && <Ban size={10} className="text-red-500" />}
                      <span className={`text-[8px] font-black uppercase tracking-widest ${u.isBanned ? 'text-red-500' : 'text-slate-500'}`}>
                        {u.isBanned ? 'BANNED' : 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-white/2"
                    >
                      <div className="p-4 space-y-5">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                            <p className="text-xs font-black text-emerald-green">{u.balanceRiyal.toFixed(2)}</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase">SAR</p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                            <p className="text-xs font-black text-neon-blue">{u.balanceCrypto.toFixed(2)}</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase">USDT</p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                            <p className="text-xs font-black text-amber-400">{u.warningCount || 0}</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase">Strikes</p>
                          </div>
                        </div>

                        {/* Balance Adjustment */}
                        <div className="space-y-2">
                          <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-1">Adjust Balance</label>
                          <div className="flex gap-2">
                            <select 
                              value={adjustment.currency}
                              onChange={e => setAdjustment({...adjustment, currency: e.target.value as any})}
                              className="bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold outline-none text-white"
                            >
                              <option value="SAR" className="bg-midnight">SAR</option>
                              <option value="USDT" className="bg-midnight">USDT</option>
                            </select>
                            <input 
                              type="number" 
                              placeholder="Amount"
                              value={adjustment.amount}
                              onChange={e => setAdjustment({...adjustment, amount: e.target.value})}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-neon-blue/50"
                            />
                            <button 
                              onClick={() => handleAdjustBalance(u.id, true)}
                              className="w-10 h-10 bg-emerald-green text-midnight rounded-xl flex items-center justify-center text-lg font-black active:scale-90 transition-all shadow-lg shadow-emerald-green/20"
                            >
                              +
                            </button>
                            <button 
                              onClick={() => handleAdjustBalance(u.id, false)}
                              className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center text-lg font-black active:scale-90 transition-all shadow-lg shadow-red-500/20"
                            >
                              -
                            </button>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => { onResetDevice(u.id); TelegramService.haptic('medium'); }}
                            className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                          >
                            <Smartphone size={12} /> Reset Device
                          </button>
                          <button 
                            onClick={() => { onUnban(u.id); TelegramService.haptic('medium'); }}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                              u.isBanned ? 'bg-emerald-green text-midnight' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}
                          >
                            <Ban size={12} /> {u.isBanned ? 'Unban User' : 'Ban User'}
                          </button>
                        </div>

                        {/* Meta Info */}
                        <div className="flex justify-between items-center px-1 pt-2 border-t border-white/5">
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${u.isVerified ? 'bg-neon-blue shadow-[0_0_5px_rgba(0,243,255,0.5)]' : 'bg-slate-700'}`} />
                              <span className="text-[8px] font-black text-slate-500 uppercase">Verified</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${u.isBanned ? 'bg-red-500' : 'bg-emerald-green shadow-[0_0_5px_rgba(16,185,129,0.5)]'}`} />
                              <span className="text-[8px] font-black text-slate-500 uppercase">Status</span>
                            </div>
                          </div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            Refs: <span className="text-white">{u.referrals || 0}</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
