
import React, { useState, useMemo } from 'react';
import { User, Task, AdTask, TaskSubmission, AdView } from '../types';
import { TelegramService } from '../services/telegram';
import MaintenanceNotice from './MaintenanceNotice';

interface PromoteProps {
  user: User;
  tasks: Task[];
  adTasks: AdTask[];
  submissions: TaskSubmission[];
  adViews: AdView[];
  onAddTask: (task: Task, totalCost: number, currency: 'SAR' | 'USDT') => void;
  onAddAdTask: (task: AdTask, totalCost: number, currency: 'SAR' | 'USDT') => void;
  isMaintenance?: boolean;
  onGoToDeposit: () => void;
}

const Promote: React.FC<PromoteProps> = ({ user, tasks, adTasks, submissions, adViews, onAddTask, onAddAdTask, isMaintenance, onGoToDeposit }) => {
  const [mode, setMode] = useState<'create' | 'manage'>('create');
  const [type, setType] = useState<'video' | 'ad'>('video');
  const [paymentCurrency, setPaymentCurrency] = useState<'SAR' | 'USDT'>('SAR');
  
  const [form, setForm] = useState({
    title: '', 
    url: '', 
    duration: 30, 
    budget: 100, 
    reward: 0.1, 
    platform: 'YouTube' as any,
    network: 'Monetag' as any
  });

  const ADMIN_PROFIT_PER_VIEW_SAR = 0.05;
  const SAR_TO_USDT_RATE = 10;
  const MIN_BUDGET_SAR = 50;
  const MIN_BUDGET_USDT = 5;

  const { totalCost, isBudgetValid, hasBalance } = useMemo(() => {
    const reward = form.reward || 0;
    const budget = form.budget || 0;
    const costPerViewSAR = reward + ADMIN_PROFIT_PER_VIEW_SAR;
    const totalCostSAR = budget * costPerViewSAR;
    
    let cost = totalCostSAR;
    if (paymentCurrency === 'USDT') cost = totalCostSAR / SAR_TO_USDT_RATE;

    const balance = paymentCurrency === 'SAR' ? user.balanceRiyal : user.balanceCrypto;
    const min = paymentCurrency === 'SAR' ? MIN_BUDGET_SAR : MIN_BUDGET_USDT;

    return { totalCost: cost, isBudgetValid: cost >= min, hasBalance: balance >= cost };
  }, [form.reward, form.budget, paymentCurrency, user.balanceRiyal, user.balanceCrypto]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBalance || !isBudgetValid) {
      TelegramService.haptic('heavy');
      return;
    }

    if (type === 'video') {
      const newTask: Task = { 
        id: 'u' + Math.random().toString(36).substr(2, 9), 
        title: form.title, 
        platform: form.platform, 
        url: form.url, 
        rewardRiyal: form.reward, 
        rewardCrypto: form.reward / SAR_TO_USDT_RATE, 
        timerSeconds: form.duration, 
        ownerId: user.id, 
        budget: form.budget,
        status: 'pending_approval'
      };
      onAddTask(newTask, totalCost, paymentCurrency);
    } else {
      const newAd: AdTask = { 
        id: 'ua' + Math.random().toString(36).substr(2, 9), 
        title: form.title, 
        url: form.url, 
        rewardRiyal: form.reward, 
        rewardCrypto: form.reward / SAR_TO_USDT_RATE, 
        durationSeconds: form.duration, 
        networkName: form.network,
        ownerId: user.id, 
        budget: form.budget,
        status: 'pending_approval'
      };
      onAddAdTask(newAd, totalCost, paymentCurrency);
    }

    TelegramService.showAlert('Promotion submitted for Admin approval!');
    setMode('manage');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YouTube': return '🔴';
      case 'TikTok': return '🎵';
      case 'Dailymotion': return '🔵';
      case 'Vimeo': return '💠';
      case 'Facebook': return '📘';
      case 'Custom': return '📁';
      case 'Adsterra': return '🌟';
      case 'Monetag': return '💎';
      case 'AdOperator': return '⚙️';
      default: return '📺';
    }
  };

  const getCampaignProgress = (task: any, isVideo: boolean) => {
    const completed = isVideo 
      ? submissions.filter(s => s.taskId === task.id).length 
      : adViews.filter(v => v.adTaskId === task.id).length;
    const total = task.budget || 1;
    const percent = Math.min(100, (completed / total) * 100);
    const remaining = Math.max(0, total - completed);
    return { percent, completed, remaining, isFull: completed >= total };
  };

  return (
    <div className="p-4 space-y-6 pb-32">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Promote</h2>
        <div className="bg-slate-800 p-1 rounded-xl flex border border-slate-700">
          <button onClick={() => setMode('create')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'create' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400'}`}>Create</button>
          <button onClick={() => setMode('manage')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'manage' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400'}`}>My Ads</button>
        </div>
      </header>

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-5 animate-in slide-in-from-bottom duration-500">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button type="button" onClick={() => setType('video')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'video' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Video Campaign</button>
            <button type="button" onClick={() => setType('ad')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'ad' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Direct Link Ad</button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Campaign Details</label>
              <input type="text" placeholder="Campaign Name" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors" />
              <input type="url" placeholder="Target URL" required value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">{type === 'video' ? 'Platform' : 'Network'}</label>
                {type === 'video' ? (
                  <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value as any})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none appearance-none">
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Dailymotion">Dailymotion</option>
                    <option value="Vimeo">Vimeo</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Custom">Custom MP4</option>
                  </select>
                ) : (
                  <select value={form.network} onChange={e => setForm({...form, network: e.target.value as any})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none appearance-none">
                    <option value="Adsterra">Adsterra</option>
                    <option value="Monetag">Monetag</option>
                    <option value="AdOperator">AdOperator</option>
                    <option value="Custom">Custom</option>
                  </select>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Duration (Sec)</label>
                <input type="number" placeholder="Duration" required value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Target Views</label>
                <input type="number" placeholder="Target Views" required value={form.budget} onChange={e => setForm({...form, budget: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Reward/View (SAR)</label>
                <input type="number" step="0.01" placeholder="Reward" required value={form.reward} onChange={e => setForm({...form, reward: parseFloat(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Payment Method</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPaymentCurrency('SAR')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${paymentCurrency === 'SAR' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-700 text-slate-500'}`}>SAR Balance</button>
              <button type="button" onClick={() => setPaymentCurrency('USDT')} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${paymentCurrency === 'USDT' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-slate-700 text-slate-500'}`}>USDT Balance</button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black">Total Cost</p>
              <p className={`text-xl font-black ${hasBalance ? 'text-white' : 'text-red-500'}`}>{totalCost.toFixed(2)} {paymentCurrency}</p>
              {!isBudgetValid && <p className="text-[8px] text-amber-500 font-bold uppercase">Min: {paymentCurrency === 'SAR' ? '50 SAR' : '5 USDT'}</p>}
            </div>
            {hasBalance ? (
              <button disabled={!isBudgetValid} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 shadow-lg shadow-blue-900/40 transition-all ${isBudgetValid ? 'hover:scale-105 active:scale-95' : 'opacity-50 grayscale cursor-not-allowed'}`}>Pay & Post</button>
            ) : (
              <button type="button" onClick={onGoToDeposit} className="px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-amber-600 shadow-lg shadow-amber-900/40 hover:scale-105 active:scale-95 transition-all">Deposit Now</button>
            )}
          </div>
        </form>
      )}

      {mode === 'manage' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-500">
          {[...tasks, ...adTasks].filter(t => t.ownerId === user.id).length === 0 ? (
            <div className="bg-slate-800/50 rounded-3xl border border-dashed border-slate-700 p-12 text-center space-y-4">
              <div className="text-4xl opacity-20">🚀</div>
              <div>
                <h4 className="text-sm font-bold text-slate-300">No Active Campaigns</h4>
                <p className="text-[10px] text-slate-500">Create your first campaign to start promoting!</p>
              </div>
            </div>
          ) : (
            [...tasks, ...adTasks].filter(t => t.ownerId === user.id).map(task => {
              const isVideo = 'platform' in task;
              const { percent, completed, remaining, isFull } = getCampaignProgress(task, isVideo);
              const platform = isVideo ? (task as Task).platform : ((task as AdTask).networkName || 'Custom');

              const status = task.status || 'active';
              const statusConfig = {
                pending_approval: { label: '⏳ Pending Approval', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                active: { label: isFull ? '✅ Completed' : '✅ Active', class: isFull ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                rejected: { label: '❌ Rejected', class: 'bg-red-500/10 text-red-400 border-red-500/20' }
              };
              const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

              return (
                <div key={task.id} className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-xl border border-slate-700">
                        {getPlatformIcon(platform)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{task.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{platform} • {isVideo ? 'Video' : 'Ad Link'}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${currentStatus.class}`}>
                      {currentStatus.label}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-white">{completed} / {task.budget} Views</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-green-500' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`} 
                        style={{ width: `${percent}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                      <span>{percent.toFixed(0)}% Done</span>
                      <span>{remaining} Remaining</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Promote;
