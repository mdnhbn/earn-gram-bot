
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, CurrencyInfo } from '../types';
import { TelegramService } from '../services/telegram';
import { Trophy, Zap, RefreshCw, Clock, ChevronRight } from 'lucide-react';

interface HomeProps {
  user: User;
  onClaimBonus: (userId: number, initData: string) => Promise<void>;
  leaderboard: User[];
  userRank: number;
  onStartBoost: (url: string, time: number) => void;
  isSyncing?: boolean;
  onRefresh?: () => void;
  currencyInfo: CurrencyInfo;
  maintenanceSettings: any;
}

const Home: React.FC<HomeProps> = ({ user, onClaimBonus, leaderboard, userRank, onStartBoost, isSyncing, onRefresh, currencyInfo, maintenanceSettings }) => {
  const [canClaimBonus, setCanClaimBonus] = useState(false);
  const [boostCooldown, setBoostCooldown] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    if (!user?.dailyBonusLastClaim) {
      setCanClaimBonus(true);
    } else {
      try {
        const last = new Date(user.dailyBonusLastClaim).getTime();
        const now = new Date().getTime();
        setCanClaimBonus(now - last > 24 * 60 * 60 * 1000);
      } catch (e) {
        setCanClaimBonus(true);
      }
    }

    const timer = setInterval(() => {
      if (!user?.lastBoostClaim) {
        setBoostCooldown(null);
        return;
      }
      try {
        const last = new Date(user.lastBoostClaim).getTime();
        const now = new Date().getTime();
        const elapsed = now - last;
        const hour = 60 * 60 * 1000;

        if (elapsed < hour) {
          const remaining = hour - elapsed;
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          setBoostCooldown(`${mins}m ${secs}s`);
        } else {
          setBoostCooldown(null);
        }
      } catch (e) {
        setBoostCooldown(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user?.dailyBonusLastClaim, user?.lastBoostClaim]);

  const maskName = (name: string) => {
    if (name.length <= 4) return name + '***';
    return name.slice(0, 4) + '***';
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy size={16} className="text-yellow-400" />;
      case 1: return <Trophy size={16} className="text-slate-300" />;
      case 2: return <Trophy size={16} className="text-amber-600" />;
      default: return null;
    }
  };

  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (!user?.id || !canClaimBonus || isClaiming) return;
    setIsClaiming(true);
    TelegramService.haptic('medium');
    try {
      await onClaimBonus(user.id, TelegramService.getInitData());
    } catch (err: any) {
      console.error('Claim error:', err);
      TelegramService.showAlert(err.message || 'Server busy, try again later');
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-xl font-black tracking-tight">
            Hi, <span className="text-primary">{user?.fullName?.split(' ')[0] && user.fullName !== 'Guest User' ? user.fullName.split(' ')[0] : user?.username && user.username !== 'Guest' ? user.username : 'User'}</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Premium Member</p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl px-3 py-1.5 flex items-center gap-2 rounded-lg">
            <Clock size={12} className="text-primary" />
            <span className="font-mono text-primary text-[10px] font-black tracking-widest">
              {formatTime(currentTime)}
            </span>
          </div>
          <button 
            onClick={() => {
              TelegramService.haptic('light');
              onRefresh?.();
            }}
            className={`p-2 rounded-full bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl text-slate-400 hover:text-white transition-colors ${isSyncing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Balance Cards */}
      <div className="space-y-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="balance-card"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-[0.2em]">Total Balance</p>
              <div className="bg-white/10 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                {currencyInfo?.code || 'SAR'}
              </div>
            </div>
            
            {isSyncing ? (
              <div className="h-12 w-3/4 skeleton mb-4" />
            ) : (
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-5xl font-black tracking-tighter">
                  {((user?.balanceRiyal || 0) * (currencyInfo?.rate || 1)).toFixed(2)}
                </h2>
                <span className="text-blue-200/40 text-lg font-bold">{currencyInfo?.symbol || 'SAR'}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
              <span className="text-[9px] text-blue-100/40 font-black uppercase tracking-widest">Live Asset Tracking</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl p-6 relative overflow-hidden group rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Crypto Wallet</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-black text-slate-100 tracking-tight">{(user?.balanceCrypto || 0).toFixed(2)}</h2>
                <span className="text-slate-500 text-xs font-mono font-black opacity-40">USDT</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap size={20} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Daily Bonus */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl p-5 flex items-center justify-between border-dashed border-white/10 rounded-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="font-black text-xs uppercase tracking-widest">Daily Reward</h3>
            <p className="text-[10px] text-slate-400 font-medium">Claim {(maintenanceSettings?.dailyBonusAmount || 1.0).toFixed(2)} SAR</p>
          </div>
        </div>
        <button
          disabled={!canClaimBonus || isClaiming}
          onClick={handleClaim}
          className={`btn-premium px-6 py-2.5 text-[10px] uppercase tracking-widest ${
            !canClaimBonus || isClaiming ? 'opacity-40 grayscale cursor-not-allowed' : 'btn-glow'
          }`}
        >
          {isClaiming ? 'Claiming...' : canClaimBonus ? 'Claim Now' : 'Claimed'}
        </button>
      </motion.div>

      {/* Leaderboard */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <Trophy size={12} className="text-primary" /> Top Earners
          </h3>
          <div className="flex items-center gap-1 text-[9px] text-primary font-black uppercase">
            View All <ChevronRight size={10} />
          </div>
        </div>

        <div className="bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden divide-y divide-white/5 rounded-2xl">
          {leaderboard.slice(0, 5).map((u, index) => (
            <motion.div 
              key={u.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className={`p-4 flex items-center justify-between ${u.id === user.id ? 'bg-primary/10' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center text-xs font-black">
                  {getRankIcon(index) || <span className="text-slate-500">{index + 1}</span>}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-200">
                    {maskName(u.username || 'User')}
                    {u.id === user?.id && <span className="ml-2 text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-full uppercase">You</span>}
                  </p>
                  <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Level {Math.floor((u.totalEarningsRiyal || 0) / 10) + 1}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-primary">{(u.totalEarningsRiyal || 0).toFixed(2)} SAR</p>
              </div>
            </motion.div>
          ))}
          
          <div className="bg-primary/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-black text-primary">
                 #{userRank}
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Global Rank</p>
            </div>
            <p className="text-[9px] text-primary font-black uppercase animate-pulse">Climbing ⚡</p>
          </div>
        </div>
      </section>

      {/* Boost Earnings */}
      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onClick={() => {
          if (!boostCooldown) {
            TelegramService.haptic('medium');
            onStartBoost(maintenanceSettings?.boostAdLink || '', maintenanceSettings?.boostDuration || 15);
          }
        }}
        disabled={!!boostCooldown}
        className={`w-full text-left p-6 rounded-3xl flex items-center gap-5 transition-all active:scale-[0.98] border relative overflow-hidden group ${
          boostCooldown 
          ? 'bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl opacity-60 grayscale' 
          : 'bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl border-primary/20 hover:border-primary/40 shadow-lg shadow-primary/5'
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
          boostCooldown ? 'bg-white/5 text-slate-600' : 'bg-primary/10 text-primary'
        }`}>
          {boostCooldown ? <Clock size={24} /> : <Zap size={24} />}
        </div>

        <div className="flex-1">
          <h4 className={`font-black uppercase tracking-widest text-[10px] mb-1 ${boostCooldown ? 'text-slate-500' : 'text-primary'}`}>
            {boostCooldown ? 'Cooling Down' : 'Earnings Boost'}
          </h4>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            {boostCooldown 
              ? `Ready in ${boostCooldown}` 
              : `Watch a quick ad to instantly earn SAR.`}
          </p>
        </div>
        
        {!boostCooldown && (
          <div className="btn-premium px-4 py-2 text-[9px] uppercase tracking-widest btn-glow">
            Start
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default Home;
