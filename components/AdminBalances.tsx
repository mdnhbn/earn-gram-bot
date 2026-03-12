
import React, { useState } from 'react';
import { Search, User as UserIcon, Wallet, Smartphone, Globe, RefreshCcw, Loader2, ShieldCheck, UserCheck, Ban } from 'lucide-react';
import { TelegramService } from '../services/telegram';
import { User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AdminBalancesProps {
  onUpdateBalance: (userId: number, amount: number, currency: 'SAR' | 'USDT', type: 'ADJUSTMENT', description: string) => Promise<void>;
  onResetDevice: (userId: number) => Promise<void>;
}

export const AdminBalances: React.FC<AdminBalancesProps> = ({ onUpdateBalance, onResetDevice }) => {
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [adjustment, setAdjustment] = useState({ amount: '', currency: 'SAR' as 'SAR' | 'USDT' });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSearch = async () => {
    if (!searchId) return;
    setIsSearching(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/search_user?user_id=${searchId}`);
      if (res.ok) {
        const data = await res.json();
        setSearchedUser(data.user);
        TelegramService.haptic('medium');
      } else {
        TelegramService.showAlert('User not found');
        setSearchedUser(null);
        TelegramService.haptic('heavy');
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdjust = async () => {
    if (!searchedUser || !adjustment.amount) return;
    setIsUpdating(true);
    try {
      await onUpdateBalance(
        searchedUser.id,
        parseFloat(adjustment.amount),
        adjustment.currency,
        'ADJUSTMENT',
        'Admin Adjustment'
      );
      await handleSearch();
      setAdjustment({ ...adjustment, amount: '' });
      TelegramService.haptic('medium');
      TelegramService.showAlert('Balance updated successfully');
    } catch (e) {
      console.error('Adjustment failed:', e);
      TelegramService.haptic('heavy');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = async () => {
    if (!searchedUser) return;
    setIsUpdating(true);
    try {
      await onResetDevice(searchedUser.id);
      TelegramService.haptic('medium');
      TelegramService.showAlert('Device ID reset successfully');
      await handleSearch();
    } catch (e) {
      console.error('Reset failed:', e);
      TelegramService.haptic('heavy');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
          <Search size={12} className="text-neon-blue" /> User Asset Control
        </h3>
        
        <div className="glass-card p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="number" 
                placeholder="Enter User ID" 
                value={searchId} 
                onChange={e => setSearchId(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:border-neon-blue/50 transition-all pl-12 text-white" 
              />
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isSearching || !searchId}
              className="glass-button px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50 neon-blue-glow flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>
          
          <AnimatePresence mode="wait">
            {searchedUser && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-neon-blue font-black uppercase tracking-widest">User Identity</p>
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                      @{searchedUser.username || 'Unknown'}
                      {searchedUser.isBanned && (
                        <span className="bg-red-500/20 text-red-500 text-[8px] px-2 py-0.5 rounded-full uppercase font-black border border-red-500/20">
                          Banned
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono bg-black/20 px-2 py-0.5 rounded inline-block">ID: {searchedUser.id}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[9px] text-emerald-green font-black uppercase tracking-widest">Live Assets</p>
                    <p className="text-lg font-black text-white">{searchedUser.balanceRiyal.toFixed(2)} SAR</p>
                    <p className="text-xs text-slate-400 font-mono">{searchedUser.balanceCrypto.toFixed(2)} USDT</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="p-2 bg-neon-blue/10 rounded-lg">
                      <Smartphone className="text-neon-blue" size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] text-slate-500 uppercase font-black">Device ID</p>
                      <p className="text-[10px] text-slate-300 font-mono truncate">{searchedUser.deviceId || 'Not Set'}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="p-2 bg-emerald-green/10 rounded-lg">
                      <Globe className="text-emerald-green" size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] text-slate-500 uppercase font-black">Last IP</p>
                      <p className="text-[10px] text-slate-300 font-mono">{searchedUser.lastIp || 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1 flex items-center gap-2">
                    <Wallet size={12} className="text-neon-blue" /> Balance Editor
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="any" 
                      placeholder="Amount (+ or -)" 
                      value={adjustment.amount} 
                      onChange={e => setAdjustment({...adjustment, amount: e.target.value})} 
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-neon-blue/50 transition-all text-white" 
                    />
                    <select 
                      value={adjustment.currency} 
                      onChange={e => setAdjustment({...adjustment, currency: e.target.value as any})} 
                      className="bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold outline-none text-white appearance-none"
                    >
                      <option value="SAR">SAR</option>
                      <option value="USDT">USDT</option>
                    </select>
                    <button 
                      onClick={handleAdjust} 
                      disabled={isUpdating || !adjustment.amount}
                      className="glass-button px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 emerald-green-glow"
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw size={12} />}
                      Apply
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleReset}
                  disabled={isUpdating}
                  className="w-full glass-button py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 border-red-500/20 hover:bg-red-500/10 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={14} />
                  Reset Device ID & Security
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};
