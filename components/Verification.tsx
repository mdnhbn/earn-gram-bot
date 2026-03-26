
import React, { useState, useEffect } from 'react';
import { TelegramService } from '../services/telegram';
import { fetchWithTimeout } from '../services/api';

interface VerificationProps {
  channels: string[];
  onVerify: () => void;
}

const Verification: React.FC<VerificationProps> = ({ channels, onVerify }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin Bypass: Admin ID 929198867 can always skip
  useEffect(() => {
    const user = TelegramService.getUser();
    if (user && user.id === 929198867) {
      console.log('Admin detected: Bypassing verification screen');
      onVerify();
    }
  }, [onVerify]);

  const handleJoin = (channel: string) => {
    try {
      const handle = channel.startsWith('@') ? channel.substring(1) : channel;
      const url = `https://t.me/${handle}`;
      
      TelegramService.openTelegramLink(url);
      TelegramService.haptic('light');
    } catch (e) {
      console.error('Failed to open link:', e);
      window.open(`https://t.me/${channel.replace('@', '')}`, '_blank');
    }
  };

  const checkMembership = async () => {
    setIsChecking(true);
    setError(null);
    TelegramService.haptic('medium');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const userId = Number(TelegramService.getUser().id);
      
      const response = await fetchWithTimeout(`${apiUrl}/api/verify?user_id=${userId}`);
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        TelegramService.showAlert('✅ Verification successful! Welcome to EarnGram.');
        onVerify();
      } else {
        const msg = data.message || '❌ Access Denied: You must join ALL channels to unlock earning features.';
        setError(msg);
        TelegramService.showAlert(msg);
        TelegramService.haptic('heavy');
      }
    } catch (error) {
      console.error('Verification API error:', error);
      const serverMsg = '⚠️ Server busy, try again later';
      setError(serverMsg);
      TelegramService.showAlert(serverMsg);
      TelegramService.haptic('heavy');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-6 animate-in fade-in duration-500">
      <header className="text-center py-8 space-y-2">
        <div className="text-5xl mb-4">🛡️</div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Account Verification</h1>
        <p className="text-slate-400 text-sm leading-relaxed px-4">
          Join our mandatory channels to unlock the wallet, tasks, and reward systems.
        </p>
      </header>

      <div className="flex-1 space-y-3">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-center animate-in slide-in-from-top-2 duration-300">
            <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Mandatory Subscriptions</p>
        <div className="space-y-2">
          {channels.map((channel, idx) => (
            <div key={idx} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center transition-all active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                <span className="font-bold text-sm text-slate-200">{channel}</span>
              </div>
              <button 
                onClick={() => handleJoin(channel)}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-900/20"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="py-6 space-y-4">
        <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-2xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-[10px] text-red-200/60 leading-tight font-bold">
            POLICY: Only one Telegram account is allowed per device. Multiple accounts will be detected at withdrawal and your payout will be rejected.
          </p>
        </div>

        <div className="bg-amber-900/10 border border-amber-900/30 p-4 rounded-2xl flex items-center gap-3">
          <span className="text-xl">ℹ️</span>
          <p className="text-[10px] text-amber-200/60 leading-tight">
            Our security bot verifies membership instantly. Leaving channels results in an automatic account freeze.
          </p>
        </div>

        <button 
          onClick={checkMembership}
          disabled={isChecking}
          className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all ${
            isChecking ? 'bg-slate-700 text-slate-500 grayscale' : 'bg-blue-600 text-white shadow-blue-900/30 active:scale-95'
          }`}
        >
          {isChecking ? 'VERIFYING MEMBERSHIP...' : 'VERIFY MY MEMBERSHIP'}
        </button>

        {/* DEV ONLY BYPASS */}
        <button 
          onClick={() => {
            console.log('DEV: Bypassing verification');
            onVerify();
          }}
          className="w-full py-2 rounded-xl border border-slate-700 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
        >
          DEV: Skip Verification (Preview Mode)
        </button>
      </footer>
    </div>
  );
};

export default Verification;
