
import React, { useState, useEffect } from 'react';
import { User, CurrencyInfo } from '../types';
import { TelegramService } from '../services/telegram';

interface HomeProps {
  user: User;
  onClaimBonus: () => void;
  leaderboard: User[];
  userRank: number;
  onStartBoost: () => void;
  isSyncing?: boolean;
  onRefresh?: () => void;
  currencyInfo: CurrencyInfo;
}

const Home: React.FC<HomeProps> = ({ user, onClaimBonus, leaderboard, userRank, onStartBoost, isSyncing, onRefresh, currencyInfo }) => {
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
    // Daily Bonus Logic
    if (!user.dailyBonusLastClaim) {
      setCanClaimBonus(true);
    } else {
      const last = new Date(user.dailyBonusLastClaim).getTime();
      const now = new Date().getTime();
      setCanClaimBonus(now - last > 24 * 60 * 60 * 1000);
    }

    // Boost Cooldown Logic
    const timer = setInterval(() => {
      if (!user.lastBoostClaim) {
        setBoostCooldown(null);
        return;
      }
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
    }, 1000);

    return () => clearInterval(timer);
  }, [user.dailyBonusLastClaim, user.lastBoostClaim]);

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

  const maskName = (name: string) => {
    if (name.length <= 4) return name + '***';
    return name.slice(0, 4) + '***';
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return null;
    }
  };

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!canClaimBonus || isClaiming) return;
    
    setIsClaiming(true);
    setClaimError(null);
    TelegramService.haptic('medium');
    
    try {
      await onClaimBonus();
      // Success is handled by parent updating user prop
    } catch (err: any) {
      // Check if it's a fetch error (likely backend unreachable in preview)
      if (err.message === 'Failed to fetch' || err.name === 'TypeError' || err.message?.includes('network')) {
        TelegramService.showAlert('Bonus system is ready! It will work once you are live on Telegram.');
      } else {
        setClaimError(err.message || 'Server busy, try again later');
        setTimeout(() => setClaimError(null), 3000);
      }
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
    <div className="p-4 animate-in fade-in duration-500 space-y-8 relative">
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

      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome, {user?.username || 'Guest'}!</h1>
          <p className="text-slate-400 text-sm">Grow your assets with EarnGram.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-slate-900/80 border border-blue-500/20 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.1)] backdrop-blur-sm">
            <span className="font-mono text-blue-400 text-[10px] font-black tracking-widest">
              {formatTime(currentTime)}
            </span>
          </div>
          <button 
            onClick={() => {
              TelegramService.haptic('light');
              onRefresh?.();
            }}
            className={`p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors ${isSyncing ? 'animate-spin' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>
      </header>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-xl shadow-blue-900/20">
          <p className="text-blue-100 text-xs font-medium uppercase tracking-widest mb-1">Total Balance ({currencyInfo.label})</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold">{((user.balanceRiyal || 0) * currencyInfo.rate).toFixed(2)}</h2>
            <span className="text-blue-200 text-sm">{currencyInfo.code}</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">Crypto Wallet (USDT)</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-100">{(user.balanceCrypto || 0).toFixed(2)}</h2>
            <span className="text-slate-400 text-sm font-mono uppercase">USDT</span>
          </div>
        </div>
      </div>

      {/* Daily Bonus Section */}
      <div className="bg-slate-800/50 border border-dashed border-slate-700 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
        {claimError && (
          <div className="absolute inset-0 bg-red-900/90 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-300 z-10">
            <p className="text-white text-[10px] font-bold uppercase tracking-widest">{claimError}</p>
          </div>
        )}
        <div>
          <h3 className="font-semibold">Daily Bonus</h3>
          <p className="text-xs text-slate-400">Claim free SAR every 24h</p>
        </div>
        <button
          disabled={!canClaimBonus || isClaiming}
          onClick={handleClaim}
          className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            canClaimBonus && !isClaiming
            ? 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30' 
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isClaiming ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            canClaimBonus ? 'Claim' : 'Locked'
          )}
        </button>
      </div>

      {/* Leaderboard Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-sm uppercase tracking-tighter flex items-center gap-2">
            🏆 Top Earners
          </h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Season 1</span>
        </div>

        <div className="bg-slate-800/80 rounded-3xl border border-slate-700 overflow-hidden divide-y divide-slate-700">
          {leaderboard.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="text-3xl opacity-20">🏆</div>
              <p className="text-xs text-slate-500 italic">Leaderboard is empty. Be the first to earn!</p>
            </div>
          ) : (
            leaderboard.map((u, index) => (
              <div key={u.id} className={`p-4 flex items-center justify-between ${u.id === user.id ? 'bg-blue-600/10' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center text-sm font-black">
                    {getRankIcon(index) || <span className="text-slate-500">#{index + 1}</span>}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {maskName(u.username)} {u.id === user.id && <span className="text-[9px] bg-blue-500 text-white px-1 rounded ml-1 uppercase">You</span>}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase font-black">ID: {(u.id || '').toString().slice(0, 3)}***</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-400">{(u.totalEarningsRiyal || 0).toFixed(2)} SAR</p>
                </div>
              </div>
            ))
          )}
          
          {/* Personal Rank Footer */}
          <div className="bg-slate-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-8 flex justify-center text-xs font-black text-amber-500">
                 #{userRank}
               </div>
               <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Your Current Rank</p>
            </div>
            <p className="text-[10px] text-slate-500 font-bold italic">Keep earning to climb!</p>
          </div>
        </div>
      </section>

      {/* Boost Earnings Card */}
      <button 
        onClick={() => {
          if (!boostCooldown) {
            TelegramService.haptic('medium');
            onStartBoost();
          }
        }}
        disabled={!!boostCooldown}
        className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98] ${
          boostCooldown 
          ? 'bg-slate-800/50 border border-slate-700 opacity-70 grayscale' 
          : 'bg-amber-900/20 border border-amber-900/30 hover:bg-amber-900/30'
        }`}
      >
        <span className="text-2xl">{boostCooldown ? '⏳' : '⚡'}</span>
        <div className="flex-1">
          <h4 className={`font-bold text-sm ${boostCooldown ? 'text-slate-400' : 'text-amber-400'}`}>
            {boostCooldown ? 'Boost Cooling Down' : 'Boost Earnings'}
          </h4>
          <p className="text-xs text-slate-500">
            {boostCooldown ? `Available in ${boostCooldown}` : 'Watch a quick ad for instant SAR.'}
          </p>
        </div>
        {!boostCooldown && <span className="text-amber-500 font-black text-xs uppercase">Start</span>}
      </button>
    </div>
  );
};

export default Home;
