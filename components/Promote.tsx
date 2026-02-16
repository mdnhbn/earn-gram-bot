
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
    title: '', url: '', duration: 30, budget: 100, reward: 0.1, platform: 'YouTube' as const
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
    if (!hasBalance) {
      TelegramService.haptic('heavy');
      return;
    }

    if (type === 'video') {
      const newTask: Task = { id: 'u' + Math.random().toString(36).substr(2, 9), title: form.title, platform: form.platform, url: form.url, rewardRiyal: form.reward, rewardCrypto: form.reward / SAR_TO_USDT_RATE, timerSeconds: form.duration, ownerId: user.id, budget: form.budget };
      onAddTask(newTask, totalCost, paymentCurrency);
    } else {
      const newAd: AdTask = { id: 'ua' + Math.random().toString(36).substr(2, 9), title: form.title, url: form.url, rewardRiyal: form.reward, rewardCrypto: form.reward / SAR_TO_USDT_RATE, durationSeconds: form.duration, ownerId: user.id, budget: form.budget };
      onAddAdTask(newAd, totalCost, paymentCurrency);
    }

    TelegramService.showAlert('Promotion paid and launched!');
    setMode('manage');
  };

  return (
    <div className="p-4 space-y-6 pb-32">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Promote</h2>
        <div className="bg-slate-800 p-1 rounded-xl flex border border-slate-700">
          <button onClick={() => setMode('create')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${mode === 'create' ? 'bg-blue-600' : 'text-slate-400'}`}>Create</button>
          <button onClick={() => setMode('manage')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${mode === 'manage' ? 'bg-blue-600' : 'text-slate-400'}`}>My Ads</button>
        </div>
      </header>

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-5">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button type="button" onClick={() => setType('video')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${type === 'video' ? 'bg-slate-700' : 'text-slate-500'}`}>Video</button>
            <button type="button" onClick={() => setType('ad')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${type === 'ad' ? 'bg-slate-700' : 'text-slate-500'}`}>Link</button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Pay with</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPaymentCurrency('SAR')} className={`flex-1 py-2 rounded-xl border text-[10px] font-bold ${paymentCurrency === 'SAR' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-700 text-slate-500'}`}>SAR Balance</button>
              <button type="button" onClick={() => setPaymentCurrency('USDT')} className={`flex-1 py-2 rounded-xl border text-[10px] font-bold ${paymentCurrency === 'USDT' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-slate-700 text-slate-500'}`}>USDT Balance</button>
            </div>
          </div>

          <div className="space-y-3">
            <input type="text" placeholder="Campaign Name" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" />
            <input type="url" placeholder="URL" required value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Target Views" required value={form.budget} onChange={e => setForm({...form, budget: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" />
              <input type="number" step="0.01" placeholder="Reward (SAR)" required value={form.reward} onChange={e => setForm({...form, reward: parseFloat(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black">Cost</p>
              <p className={`text-lg font-black ${hasBalance ? 'text-white' : 'text-red-500'}`}>{totalCost.toFixed(2)} {paymentCurrency}</p>
            </div>
            {hasBalance ? (
              <button disabled={!isBudgetValid} className={`px-6 py-3 rounded-2xl font-bold text-sm bg-blue-600 shadow-lg ${isBudgetValid ? '' : 'opacity-50 grayscale'}`}>Pay & Post</button>
            ) : (
              <button type="button" onClick={onGoToDeposit} className="px-6 py-3 rounded-2xl font-bold text-sm bg-amber-600 shadow-lg">Deposit Now</button>
            )}
          </div>
        </form>
      )}

      {mode === 'manage' && (
        <div className="space-y-4">
          {[...tasks, ...adTasks].filter(t => t.ownerId === user.id).map(task => (
            <div key={task.id} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-2">
              <p className="font-bold text-sm">{task.title}</p>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Promote;
