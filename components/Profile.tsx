
import React from 'react';
import { User } from '../types';
import { TelegramService } from '../services/telegram';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const referralLink = `https://t.me/EarnGramBot?start=${user.id}`;

  const copyRefLink = () => {
    navigator.clipboard.writeText(referralLink);
    TelegramService.showAlert('Referral link copied!');
    TelegramService.haptic('light');
  };

  const handleSupport = () => {
    TelegramService.haptic('medium');
    TelegramService.openTelegramLink('https://t.me/EarnGramSupport'); // Replace with your actual support username
  };

  const handleTOS = () => {
    TelegramService.haptic('medium');
    TelegramService.showPopup({
      title: 'Terms of Service',
      message: 'Welcome to EarnGram! To keep the platform fair, please follow these rules:\n\n1. No Multi-Accounts: Only one account per person/IP is allowed.\n2. Security Strikes: Leaving the task player during a countdown results in a strike.\n3. Ban Policy: Reaching 3 strikes results in a permanent account ban.\n4. Payments: Withdrawals are processed within 24-48 hours.\n5. Automated Tools: Any use of scripts or bots is strictly forbidden.',
      buttons: [{ type: 'close', text: 'I Understand' }]
    });
  };

  const handleReportIssue = () => {
    TelegramService.haptic('heavy');
    TelegramService.openTelegramLink('https://t.me/EarnGramSupportBot'); // Replace with your reporting bot link
  };

  return (
    <div className="p-4 space-y-8 animate-in slide-in-from-bottom duration-500 pb-32">
      <div className="text-center space-y-3">
        <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl shadow-blue-500/20 font-black text-white">
          {user.username[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold">@{user.username}</h2>
          <p className="text-slate-500 text-sm">Member ID: {user.id}</p>
        </div>
      </div>

      {/* Referral System */}
      <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">Referral Program</h3>
          <span className="bg-blue-500/20 text-blue-400 text-[10px] px-3 py-1 rounded-full font-black uppercase">10% Commission</span>
        </div>
        
        <p className="text-xs text-slate-400 leading-relaxed">
          Invite your friends to EarnGram and earn 10% of their task rewards forever. Multi-level bonuses for active teams.
        </p>

        <div className="grid grid-cols-2 gap-4 my-2">
          <div className="bg-slate-900/50 p-4 rounded-xl text-center border border-slate-700/50">
            <p className="text-2xl font-bold">{user.referrals}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Referrals</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl text-center border border-slate-700/50">
            <p className="text-2xl font-bold text-green-400">{(user.referrals * 5.5).toFixed(1)}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Ref Earnings (SAR)</p>
          </div>
        </div>

        <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between gap-4 border border-slate-700">
          <span className="text-[10px] font-mono text-slate-500 truncate">{referralLink}</span>
          <button 
            onClick={copyRefLink}
            className="whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition-colors active:scale-95"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={handleSupport}
          className="w-full text-left bg-slate-800 hover:bg-slate-700 px-6 py-4 rounded-2xl flex justify-between items-center border border-slate-700 transition-all active:scale-[0.98]"
        >
          <span className="text-sm font-bold">Help & Support</span>
          <span className="text-slate-500 text-xs">→</span>
        </button>
        <button 
          onClick={handleTOS}
          className="w-full text-left bg-slate-800 hover:bg-slate-700 px-6 py-4 rounded-2xl flex justify-between items-center border border-slate-700 transition-all active:scale-[0.98]"
        >
          <span className="text-sm font-bold">Terms of Service</span>
          <span className="text-slate-500 text-xs">→</span>
        </button>
        <button 
          onClick={handleReportIssue}
          className="w-full text-left bg-red-900/10 hover:bg-red-900/20 px-6 py-4 rounded-2xl flex justify-between items-center border border-red-900/30 transition-all active:scale-[0.98]"
        >
          <span className="text-sm font-bold text-red-400">Report an Issue</span>
          <span className="text-red-500 text-xs">⚠️</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
