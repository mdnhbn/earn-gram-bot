
import React, { useState } from 'react';
import { 
  Plus, List, Trash2, Zap, Send, 
  Youtube, Globe, Link as LinkIcon, 
  BarChart3, Clock, DollarSign
} from 'lucide-react';
import { Task, AdTask, User } from '../types';
import { TelegramService } from '../services/telegram';
import { motion, AnimatePresence } from 'motion/react';

interface AdminTasksProps {
  tasks: Task[];
  adTasks: AdTask[];
  currentUser: User;
  onAddTask: (task: Task) => void;
  onAddAdTask: (task: AdTask) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteAdTask: (taskId: string) => void;
}

export const AdminTasks: React.FC<AdminTasksProps> = ({ 
  tasks, adTasks, currentUser, 
  onAddTask, onAddAdTask, onDeleteTask, onDeleteAdTask 
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'adlink'>('video');
  const [videoForm, setVideoForm] = useState({
    title: '',
    url: '',
    duration: '15',
    reward: '1.00',
    platform: 'YouTube'
  });

  const [adForm, setAdForm] = useState({
    title: '',
    url: '',
    duration: '10',
    reward: '0.50',
    network: 'Monetag'
  });

  const handleAddVideoTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.url) return;
    onAddTask({
      id: 'v-' + Date.now(),
      title: videoForm.title,
      url: videoForm.url,
      timerSeconds: parseInt(videoForm.duration),
      rewardRiyal: parseFloat(videoForm.reward),
      rewardCrypto: parseFloat(videoForm.reward) / 10,
      platform: videoForm.platform as any,
      status: 'active',
      ownerId: currentUser.id,
      budget: 1000
    });
    setVideoForm({ title: '', url: '', duration: '15', reward: '1.00', platform: 'YouTube' });
    TelegramService.haptic('medium');
    TelegramService.showAlert('Video mission created!');
  };

  const handleAddAdTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title || !adForm.url) return;
    onAddAdTask({
      id: 'ad-' + Date.now(),
      title: adForm.title,
      url: adForm.url,
      durationSeconds: parseInt(adForm.duration),
      rewardRiyal: parseFloat(adForm.reward),
      rewardCrypto: parseFloat(adForm.reward) / 10,
      networkName: adForm.network,
      status: 'active',
      ownerId: currentUser.id,
      budget: 1000
    });
    setAdForm({ title: '', url: '', duration: '10', reward: '0.50', network: 'Monetag' });
    TelegramService.haptic('medium');
    TelegramService.showAlert('Ad mission created!');
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
          <Plus size={12} className="text-neon-blue" /> Mission Architect
        </h3>
        
        <div className="glass-card p-4 space-y-4">
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button 
              onClick={() => { setActiveTab('video'); TelegramService.haptic('light'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'video' ? 'bg-neon-blue text-midnight shadow-lg shadow-neon-blue/20' : 'text-slate-500'
              }`}
            >
              <Youtube size={14} /> Video
            </button>
            <button 
              onClick={() => { setActiveTab('adlink'); TelegramService.haptic('light'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'adlink' ? 'bg-emerald-green text-midnight shadow-lg shadow-emerald-green/20' : 'text-slate-500'
              }`}
            >
              <LinkIcon size={14} /> Ad Link
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'video' ? (
                <form onSubmit={handleAddVideoTask} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Mission Title</label>
                    <input type="text" placeholder="e.g. Watch New Video" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-neon-blue/50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Video URL</label>
                    <input type="text" placeholder="https://youtube.com/..." value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-neon-blue/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-slate-500 uppercase font-black px-1">Timer (Sec)</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                        <input type="number" value={videoForm.duration} onChange={e => setVideoForm({...videoForm, duration: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs outline-none focus:border-neon-blue/50 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-slate-500 uppercase font-black px-1">Reward (SAR)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                        <input type="number" step="0.01" value={videoForm.reward} onChange={e => setVideoForm({...videoForm, reward: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs outline-none focus:border-neon-blue/50 transition-all" />
                      </div>
                    </div>
                  </div>
                  <button className="w-full glass-button py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest neon-blue-glow mt-2">Deploy Video Mission</button>
                </form>
              ) : (
                <form onSubmit={handleAddAdTask} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Ad Title</label>
                    <input type="text" placeholder="e.g. Visit Sponsored Link" value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-green/50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Smart Link URL</label>
                    <input type="text" placeholder="https://..." value={adForm.url} onChange={e => setAdForm({...adForm, url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-green/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-slate-500 uppercase font-black px-1">Duration (Sec)</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                        <input type="number" value={adForm.duration} onChange={e => setAdForm({...adForm, duration: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs outline-none focus:border-emerald-green/50 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-slate-500 uppercase font-black px-1">Reward (SAR)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                        <input type="number" step="0.01" value={adForm.reward} onChange={e => setAdForm({...adForm, reward: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs outline-none focus:border-emerald-green/50 transition-all" />
                      </div>
                    </div>
                  </div>
                  <button className="w-full glass-button py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest emerald-green-glow mt-2">Deploy Ad Mission</button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
          <List size={12} className="text-neon-blue" /> Mission Inventory
        </h3>
        
        <div className="space-y-3">
          {[...tasks, ...adTasks].length === 0 ? (
            <div className="glass-card p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="text-slate-700" size={32} />
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No Active Missions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(t => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={t.id} 
                  className="glass-card p-4 flex items-center justify-between gap-4 border-l-4 border-l-neon-blue"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Youtube size={12} className="text-neon-blue" />
                      <p className="text-xs font-black truncate text-white">{t.title}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                      <span>{t.timerSeconds}s</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="text-emerald-green">{t.rewardRiyal} SAR</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { onDeleteTask(t.id); TelegramService.haptic('medium'); }} 
                    className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
              {adTasks.map(t => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={t.id} 
                  className="glass-card p-4 flex items-center justify-between gap-4 border-l-4 border-l-emerald-green"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <LinkIcon size={12} className="text-emerald-green" />
                      <p className="text-xs font-black truncate text-white">{t.title}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                      <span>{t.durationSeconds}s</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="text-emerald-green">{t.rewardRiyal} SAR</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { onDeleteAdTask(t.id); TelegramService.haptic('medium'); }} 
                    className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
