
import React, { useState } from 'react';
import { TelegramService } from '../services/telegram';

interface VerificationProps {
  channels: string[];
  onVerify: () => void;
}

const Verification: React.FC<VerificationProps> = ({ channels, onVerify }) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleJoin = (channel: string) => {
    const handle = channel.startsWith('@') ? channel.substring(1) : channel;
    TelegramService.openTelegramLink(`https://t.me/${handle}`);
    TelegramService.haptic('light');
  };

  const checkMembership = () => {
    setIsChecking(true);
    TelegramService.haptic('medium');

    // Simulate Bot API check logic
    setTimeout(() => {
      // In production, this would be: 
      // fetch(`/api/verify?user_id=${TelegramService.getUser().id}`)
      const success = true; // Simulating success for demo

      if (success) {
        onVerify();
      } else {
        TelegramService.showAlert('Verification Failed: Please join all channels to start earning!');
      }
      setIsChecking(false);
    }, 2000);
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
      </footer>
    </div>
  );
};

export default Verification;
