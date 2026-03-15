
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Trophy, 
  Users, 
  Copy, 
  ExternalLink, 
  FileText, 
  AlertTriangle, 
  Settings, 
  Edit3, 
  Calendar, 
  IdCard,
  CheckCircle2,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { User, MaintenanceSettings } from '../types';
import { TelegramService } from '../services/telegram';

interface ProfileProps {
  user: User;
  maintenanceSettings: MaintenanceSettings;
  onNavigate?: (tab: string) => void;
  onUpdateProfile?: (name: string) => Promise<void>;
}

const Profile: React.FC<ProfileProps> = ({ user, maintenanceSettings, onNavigate, onUpdateProfile }) => {
  const referralLink = `https://t.me/EarnGramBot?start=${user?.id || 0}`;
  const isSuperAdmin = user?.id === 929198867;
  const isDev = !user?.id || user?.id === 12345678 || isSuperAdmin;
  const tgUser = TelegramService.getUser();
  const avatarUrl = tgUser?.photo_url;

  const handleEditName = () => {
    TelegramService.haptic('medium');
    TelegramService.showPopup({
      title: 'Edit Display Name',
      message: 'Enter your new display name below:',
      buttons: [
        { type: 'default', text: 'Cancel', id: 'cancel' },
        { type: 'ok', text: 'Save', id: 'save' }
      ]
    }, (id) => {
      if (id === 'save') {
        const newName = prompt('Enter your new full name:', user.fullName || '');
        if (newName && newName.trim()) {
          onUpdateProfile?.(newName.trim());
        }
      }
    });
  };

  const copyRefLink = () => {
    navigator.clipboard.writeText(referralLink);
    TelegramService.showAlert('Referral link copied!');
    TelegramService.haptic('light');
  };

  const handleOpenAdmin = () => {
    TelegramService.haptic('heavy');
    onNavigate?.('admin');
  };

  const handleSupport = () => {
    TelegramService.haptic('medium');
    TelegramService.openTelegramLink(maintenanceSettings.supportLink || 'https://t.me/EarnGramSupport'); 
  };

  const handleTOS = () => {
    TelegramService.haptic('medium');
    TelegramService.showPopup({
      title: 'Terms of Service',
      message: maintenanceSettings.tosContent || 'Welcome to EarnGram! Please follow the rules.',
      buttons: [{ type: 'ok', text: 'I Agree & Understand' }]
    });
  };

  const handleReportIssue = () => {
    TelegramService.haptic('heavy');
    TelegramService.showConfirm('Would you like to open the Support Bot to report an issue?', (ok) => {
      if (ok) {
        TelegramService.openTelegramLink(maintenanceSettings.reportLink || 'https://t.me/EarnGramSupportBot');
      } else {
        TelegramService.showAlert('You can also email us at support@earngram.protocol');
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 space-y-6 pb-32 max-w-md mx-auto"
    >
      {/* Profile Header */}
      <motion.div variants={itemVariants} className="flex flex-col items-center space-y-4 pt-4">
        <div className="relative group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary via-blue-500 to-purple-600 shadow-2xl shadow-primary/20"
          >
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-950 bg-slate-900 flex items-center justify-center">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-4xl font-black text-white">
                  {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'G'}
                </div>
              )}
            </div>
          </motion.div>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEditName}
            className="absolute bottom-1 right-1 bg-primary p-2.5 rounded-full border-4 border-slate-950 shadow-xl text-white"
          >
            <Edit3 size={16} strokeWidth={3} />
          </motion.button>
        </div>
        
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {user?.fullName && user.fullName !== 'Guest User' ? user.fullName : user?.username && user.username !== 'Guest' ? `@${user.username}` : 'User'}
            </h2>
            {user.isVerified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.5 }}
              >
                <CheckCircle2 size={20} className="text-primary fill-primary/10" />
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
              <IdCard size={10} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID: {user?.id || '0'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
              <Calendar size={10} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{user?.joinDate || 'March 2026'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Trophy size={64} />
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Trophy size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Tasks</span>
          </div>
          <p className="text-3xl font-black text-white">{user?.totalTasksCompleted || 0}</p>
        </div>
        
        <div className="bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={64} />
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Earnings</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-primary">{user?.totalEarningsRiyal?.toFixed(2) || '0.00'}</p>
            <span className="text-[10px] font-bold text-slate-500">SAR</span>
          </div>
        </div>
      </motion.div>

      {/* Referral System */}
      <motion.div variants={itemVariants} className="bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users size={20} />
            </div>
            <h3 className="font-black text-lg text-white">Referral Program</h3>
          </div>
          <span className="bg-primary/20 text-primary text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider border border-primary/20">
            4 Levels
          </span>
        </div>
        
        <div className="space-y-4 relative z-10">
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Invite friends and build your team to earn massive rewards across 4 levels of referrals.
          </p>

          {/* 4-Level Breakdown */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { level: 1, amount: 10, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
              { level: 2, amount: 5, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
              { level: 3, amount: 2, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
              { level: 4, amount: 1, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20' }
            ].map((item) => (
              <div key={item.level} className={`${item.bg} ${item.border} p-2 rounded-xl border flex flex-col items-center`}>
                <span className={`text-[8px] ${item.color} font-black uppercase mb-0.5`}>L{item.level}</span>
                <span className="text-xs font-black text-white">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-slate-900/40 p-4 rounded-2xl text-center border border-slate-800/50">
            <p className="text-2xl font-black text-white">{user?.referrals || 0}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mt-1">Total Team</p>
          </div>
          <div className="bg-slate-900/40 p-4 rounded-2xl text-center border border-slate-800/50">
            <p className="text-2xl font-black text-primary">{(user?.totalEarningsRiyal * 0.15).toFixed(1)}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mt-1">Bonus (SAR)</p>
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <p className="text-[10px] text-slate-500 font-black uppercase px-1 tracking-widest">Your Referral Link</p>
          <div className="bg-slate-950/50 p-3 rounded-2xl flex items-center justify-between gap-4 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 truncate">{referralLink}</span>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyRefLink}
              className="whitespace-nowrap bg-primary hover:bg-primary/90 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <Copy size={12} />
              Copy
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Menu Options */}
      <motion.div variants={itemVariants} className="space-y-3">
        <motion.button 
          whileHover={{ x: 4 }}
          onClick={handleSupport}
          className="w-full bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl hover:bg-white/5 px-6 py-4 rounded-2xl flex justify-between items-center transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <HelpCircle size={18} />
            </div>
            <span className="text-sm font-bold text-white">Help & Support</span>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
        </motion.button>

        <motion.button 
          whileHover={{ x: 4 }}
          onClick={handleTOS}
          className="w-full bg-[#0b141a]/80 backdrop-blur-md border border-white/10 shadow-2xl hover:bg-white/5 px-6 py-4 rounded-2xl flex justify-between items-center transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <FileText size={18} />
            </div>
            <span className="text-sm font-bold text-white">Terms of Service</span>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
        </motion.button>

        <motion.button 
          whileHover={{ x: 4 }}
          onClick={handleReportIssue}
          className="w-full bg-red-500/5 hover:bg-red-500/10 px-6 py-4 rounded-2xl flex justify-between items-center border border-red-500/10 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
              <AlertTriangle size={18} />
            </div>
            <span className="text-sm font-bold text-red-400">Report an Issue</span>
          </div>
          <ChevronRight size={16} className="text-red-900/40 group-hover:text-red-400 transition-colors" />
        </motion.button>

        {isDev && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAdmin}
            className="w-full bg-primary/10 hover:bg-primary/20 px-6 py-5 rounded-2xl flex justify-between items-center border border-primary/20 transition-all mt-6 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 group-hover:rotate-90 transition-transform duration-500">
                <Settings size={20} />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-primary uppercase tracking-wider">Admin Panel</span>
                <span className="block text-[10px] text-primary/60 font-bold">Developer Access Only</span>
              </div>
            </div>
            <ExternalLink size={18} className="text-primary" />
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Profile;
