
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
    }).toUpperCase();
  };

  const tgUser = TelegramService.getUser();
  const fullName = tgUser?.first_name ? `${tgUser.first_name} ${tgUser.last_name || ''}` : (user?.fullName || user?.username || 'User');
  const displayName = fullName.length > 20 ? fullName.slice(0, 20) + '...' : fullName;

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <header className="flex justify-between items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-sm font-black tracking-tight text-white uppercase">
            Welcome, {displayName}
          </h1>
          <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Grow your assets with EarnGram</p>
        </motion.div>
        
        <div className="flex items-center gap-2">
          <div className="bg-[#1e293b]/40 backdrop-blur-md border border-[#334155]/50 px-3 py-1.5 rounded-lg">
            <span className="font-mono text-[#2563eb] text-[9px] font-black tracking-widest">
              {formatTime(currentTime)}
            </span>
          </div>
          <button 
            onClick={() => {
              TelegramService.haptic('light');
              onRefresh?.();
            }}
            className={`p-2 rounded-lg bg-[#1e293b]/40 backdrop-blur-md border border-[#334155]/50 text-slate-400 hover:text-white transition-colors ${isSyncing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Balance Section */}
      <div className="text-center space-y-1 py-2">
        <p className="text-[#64748b] text-[8px] font-black uppercase tracking-[0.2em]">Total Balance (Riyal)</p>
        <div className="flex items-baseline justify-center gap-2">
          <h2 className="text-4xl font-black text-white tracking-tight">
            {((user?.balanceRiyal || 0) * (currencyInfo?.rate || 1)).toFixed(2)}
          </h2>
          <span className="text-[#64748b] text-xs font-black uppercase">SAR</span>
        </div>
      </div>

      {/* Crypto Wallet Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1e293b]/20 border border-[#334155]/30 p-5 rounded-2xl"
      >
        <p className="text-[#64748b] text-[8px] font-black uppercase tracking-[0.2em] mb-2">Crypto Wallet (USDT)</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight">{(user?.balanceCrypto || 0).toFixed(2)}</h2>
          <span className="text-[#64748b] text-[10px] font-black uppercase">USDT</span>
        </div>
      </motion.div>

      {/* Daily Bonus */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e293b]/20 border border-blue-500/30 p-4 flex items-center justify-between rounded-2xl shadow-[0_0_15px_rgba(37,99,235,0.05)]"
      >
        <div>
          <h3 className="font-black text-[11px] text-white uppercase tracking-widest">Daily Bonus</h3>
          <p className="text-[9px] text-slate-500 font-bold">Claim {(maintenanceSettings?.dailyBonusAmount || 1.0).toFixed(0)} SAR every 24h</p>
        </div>
        <button
          disabled={!canClaimBonus || isClaiming}
          onClick={handleClaim}
          className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            !canClaimBonus || isClaiming 
              ? 'bg-[#1e293b]/60 text-[#64748b] cursor-not-allowed' 
              : 'bg-[#2563eb] text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95'
          }`}
        >
          {isClaiming ? '...' : canClaimBonus ? 'Claim Now' : 'Claimed'}
        </button>
      </motion.div>

      {/* Leaderboard */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <Trophy size={12} className="text-[#f97316]" /> Top Earners
          </h3>
          <span className="text-[8px] text-[#64748b] font-black uppercase">Season {maintenanceSettings?.season || 3}</span>
        </div>

        <div className="bg-[#1e293b]/20 border border-[#334155]/30 overflow-hidden rounded-2xl divide-y divide-[#334155]/20">
          {leaderboard.slice(0, 3).map((u, index) => (
            <motion.div 
              key={u.id} 
              className={`p-4 flex items-center justify-between transition-colors ${index === 0 ? 'bg-blue-500/5' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6">
                  {index === 0 && <Trophy size={14} className="text-[#f97316] drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]" />}
                  {index === 1 && <Trophy size={14} className="text-[#94a3b8]" />}
                  {index === 2 && <Trophy size={14} className="text-[#b45309]" />}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-500/20">
                  {u.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white">
                    {maskName(u.username || 'User')}
                  </p>
                  <p className="text-[8px] text-[#64748b] uppercase font-black tracking-widest">ID: {u.id.toString().slice(0, 3)}***</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[#22c55e]">{(u.totalEarningsRiyal || 0).toFixed(2)} SAR</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Current Rank */}
      <div className="bg-[#1e293b]/20 border border-[#334155]/30 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#f97316] font-black text-xs">#{userRank}</span>
          <h3 className="font-black text-[10px] text-white uppercase tracking-widest">Your Current Rank</h3>
        </div>
        <p className="text-[8px] text-[#64748b] font-bold">Keep earning to climb!</p>
      </div>

      {/* Boost Earnings */}
      <motion.div 
        className="bg-[#1e293b]/20 border border-orange-500/30 p-4 rounded-2xl flex items-center justify-between shadow-[0_0_15px_rgba(249,115,22,0.05)]"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center text-[#f97316]">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <h3 className="font-black text-[11px] text-white uppercase tracking-widest">Boost Earnings</h3>
            <p className="text-[9px] text-slate-500 font-bold">Watch 30s to earn 0.05 SAR</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (!boostCooldown) {
              TelegramService.haptic('medium');
              onStartBoost(maintenanceSettings?.boostAdLink || '', maintenanceSettings?.boostDuration || 15);
            }
          }}
          disabled={!!boostCooldown}
          className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            boostCooldown 
              ? 'bg-[#1e293b]/60 text-[#64748b] cursor-not-allowed' 
              : 'bg-[#f97316] text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95'
          }`}
        >
          {boostCooldown ? boostCooldown : 'Boost Now'}
        </button>
      </motion.div>
    </div>
  );
};

export default Home;
