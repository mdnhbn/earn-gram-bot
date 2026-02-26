
import React, { useState, useEffect } from 'react';
import { TaskSubmission, WithdrawalRequest, Task, User, AdTask, MaintenanceSettings, AdminPaymentDetails } from '../types';
import { TelegramService } from '../services/telegram';
import { isUserAdmin } from '../state';

interface AdminProps {
  submissions: TaskSubmission[];
  withdrawals: WithdrawalRequest[];
  tasks: Task[];
  adTasks: AdTask[];
  users: User[];
  currentUser: User;
  maintenanceSettings: MaintenanceSettings;
  onUpdateMaintenance: (settings: MaintenanceSettings) => void;
  onAction: (id: string, type: 'submission' | 'withdrawal', status: any) => void;
  onAddTask: (task: Task) => void;
  onAddAdTask: (task: AdTask) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteAdTask: (taskId: string) => void;
  onUnban: (userId: number) => void;
  onUpdateBalance: (userId: number, amount: number, currency: 'SAR' | 'USDT') => void;
  onResetLeaderboard: () => void;
  onApproveTask: (taskId: string, isVideo: boolean) => void;
  onRejectTask: (taskId: string, isVideo: boolean) => void;
  onResetDevice: (userId: number) => void;
}

const Admin: React.FC<AdminProps> = ({ withdrawals, tasks, adTasks, users, currentUser, maintenanceSettings, onUpdateMaintenance, onAction, onAddTask, onAddAdTask, onDeleteTask, onDeleteAdTask, onUnban, onUpdateBalance, onResetLeaderboard, onApproveTask, onRejectTask, onResetDevice }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'system' | 'payouts' | 'messaging' | 'balances' | 'tasks' | 'approvals' | 'users'>('system');
  const [balanceSearch, setBalanceSearch] = useState('');
  const [adjustment, setAdjustment] = useState({ amount: '', currency: 'SAR' as const });
  const [paymentForm, setPaymentForm] = useState<AdminPaymentDetails>(maintenanceSettings.paymentDetails);
  const [boostForm, setBoostForm] = useState({
    link: maintenanceSettings.boostAdLink,
    reward: maintenanceSettings.boostRewardRiyal.toString()
  });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [adScripts, setAdScripts] = useState({
    header: maintenanceSettings.headerAdScript || '',
    footer: maintenanceSettings.footerAdScript || ''
  });
  const [systemLinks, setSystemLinks] = useState({
    support: maintenanceSettings.supportLink || '',
    tos: maintenanceSettings.tosContent || '',
    report: maintenanceSettings.reportLink || '',
    instructions: maintenanceSettings.depositInstructions || ''
  });

  // Task Forms
  const [videoTaskForm, setVideoTaskForm] = useState({
    title: '',
    url: '',
    duration: '15',
    reward: '1.00',
    platform: 'YouTube'
  });

  const [adTaskForm, setAdTaskForm] = useState({
    title: '',
    url: '',
    duration: '10',
    reward: '0.50',
    network: 'Monetag'
  });

  const isPreviewMode = !currentUser.id || currentUser.id === 12345678 || currentUser.id === 0;
  const isAdmin = isUserAdmin(currentUser.id);

  if (!isAdmin && !isPreviewMode) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 h-[70vh]">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-black uppercase text-red-500">Access Denied</h2>
        <p className="text-slate-400 text-sm">You do not have administrative privileges to access this control panel.</p>
      </div>
    );
  }

  const foundUser = users.find(u => u.id.toString() === balanceSearch);

  const toggleService = (key: keyof MaintenanceSettings) => {
    onUpdateMaintenance({ ...maintenanceSettings, [key]: !maintenanceSettings[key] as any });
  };

  const handleUpdatePaymentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({ ...maintenanceSettings, paymentDetails: paymentForm });
    TelegramService.showAlert('Payment details updated successfully!');
  };

  const handleUpdateBoostSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({ 
      ...maintenanceSettings, 
      boostAdLink: boostForm.link, 
      boostRewardRiyal: parseFloat(boostForm.reward) || 0.05 
    });
    TelegramService.showAlert('Boost settings updated successfully!');
  };

  const handleUpdateAdScripts = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({ 
      ...maintenanceSettings, 
      headerAdScript: adScripts.header,
      footerAdScript: adScripts.footer
    });
    TelegramService.showAlert('Banner ad scripts updated!');
  };

  const handleUpdateSystemLinks = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({ 
      ...maintenanceSettings, 
      supportLink: systemLinks.support,
      tosContent: systemLinks.tos,
      reportLink: systemLinks.report,
      depositInstructions: systemLinks.instructions
    });
    TelegramService.showAlert('System settings updated!');
  };

  const handleUpdateDepositSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({ 
      ...maintenanceSettings, 
      paymentDetails: paymentForm,
      depositInstructions: systemLinks.instructions
    });
    TelegramService.showAlert('Deposit settings updated!');
  };

  const handleAdjustBalance = () => {
    if (!foundUser || !adjustment.amount) return;
    onUpdateBalance(foundUser.id, parseFloat(adjustment.amount), adjustment.currency);
    setAdjustment({ ...adjustment, amount: '' });
  };

  const handleAddVideoTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTaskForm.title || !videoTaskForm.url) return;
    const newTask: Task = {
      id: 'v-' + Date.now(),
      title: videoTaskForm.title,
      url: videoTaskForm.url,
      timerSeconds: parseInt(videoTaskForm.duration),
      rewardRiyal: parseFloat(videoTaskForm.reward),
      rewardCrypto: parseFloat(videoTaskForm.reward) / 10,
      platform: videoTaskForm.platform as any
    };
    onAddTask(newTask);
    setVideoTaskForm({ title: '', url: '', duration: '15', reward: '1.00', platform: 'YouTube' });
    TelegramService.showAlert('Video task added!');
  };

  const handleAddAdTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTaskForm.title || !adTaskForm.url) return;
    const newAd: AdTask = {
      id: 'ad-' + Date.now(),
      title: adTaskForm.title,
      url: adTaskForm.url,
      durationSeconds: parseInt(adTaskForm.duration),
      rewardRiyal: parseFloat(adTaskForm.reward),
      rewardCrypto: parseFloat(adTaskForm.reward) / 10,
      networkName: adTaskForm.network
    };
    onAddAdTask(newAd);
    setAdTaskForm({ title: '', url: '', duration: '10', reward: '0.50', network: 'Monetag' });
    TelegramService.showAlert('Ad task added!');
  };

  return (
    <div className="p-4 space-y-6 pb-32">
      <header className="flex flex-col items-center space-y-4 mb-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Admin Panel</h2>
        <div className="flex flex-wrap justify-center gap-2 w-full">
          {[
            { id: 'system', label: 'System' },
            { id: 'approvals', label: 'Approvals' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'users', label: 'Users' },
            { id: 'payouts', label: 'Payouts' },
            { id: 'messaging', label: 'Broadcast' },
            { id: 'balances', label: 'Balances' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 border ${
                activeAdminTab === tab.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeAdminTab === 'approvals' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <section className="space-y-3">
            <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Review Pending Ads</h3>
            <div className="space-y-3">
              {[...tasks, ...adTasks].filter(t => t.status === 'pending_approval').length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm italic">No pending ads to review.</div>
              ) : (
                [...tasks, ...adTasks].filter(t => t.status === 'pending_approval').map(task => {
                  const isVideo = 'platform' in task;
                  const creator = users.find(u => u.id === task.ownerId);
                  return (
                    <div key={task.id} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm">{task.title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {isVideo ? `Video (${(task as Task).platform})` : `Ad Link (${(task as AdTask).networkName})`}
                          </p>
                          <p className="text-[10px] text-blue-400 font-medium">Creator: @{creator?.username || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold text-sm">{task.rewardRiyal} SAR/View</p>
                          <p className="text-[10px] text-slate-500">Target: {task.budget} Views</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onApproveTask(task.id, isVideo)}
                          className="flex-1 bg-green-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => onRejectTask(task.id, isVideo)}
                          className="flex-1 bg-red-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      {activeAdminTab === 'tasks' && (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
          {/* Video Task Form */}
          <section className="space-y-3">
            <h3 className="font-bold text-blue-400 flex items-center gap-2">📹 Add Video Task</h3>
            <form onSubmit={handleAddVideoTask} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
              <input type="text" placeholder="Task Title" value={videoTaskForm.title} onChange={e => setVideoTaskForm({...videoTaskForm, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
              <input type="text" placeholder="Video URL" value={videoTaskForm.url} onChange={e => setVideoTaskForm({...videoTaskForm, url: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Timer (Sec)</label>
                  <input type="number" value={videoTaskForm.duration} onChange={e => setVideoTaskForm({...videoTaskForm, duration: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Reward (SAR)</label>
                  <input type="number" step="0.01" value={videoTaskForm.reward} onChange={e => setVideoTaskForm({...videoTaskForm, reward: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
                </div>
              </div>
              <select value={videoTaskForm.platform} onChange={e => setVideoTaskForm({...videoTaskForm, platform: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none">
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Dailymotion">Dailymotion</option>
                <option value="Vimeo">Vimeo</option>
                <option value="Facebook">Facebook Video</option>
                <option value="Custom">Custom MP4 Link</option>
              </select>
              <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Add Video Task</button>
            </form>
          </section>

          {/* Ad Task Form */}
          <section className="space-y-3">
            <h3 className="font-bold text-amber-500 flex items-center gap-2">🔗 Add Ad Task (Universal Link)</h3>
            <form onSubmit={handleAddAdTask} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
              <input type="text" placeholder="Ad Title" value={adTaskForm.title} onChange={e => setAdTaskForm({...adTaskForm, title: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
              <input type="text" placeholder="Direct/Smart Link URL" value={adTaskForm.url} onChange={e => setAdTaskForm({...adTaskForm, url: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Duration (Sec)</label>
                  <input type="number" value={adTaskForm.duration} onChange={e => setAdTaskForm({...adTaskForm, duration: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Reward (SAR)</label>
                  <input type="number" step="0.01" value={adTaskForm.reward} onChange={e => setAdTaskForm({...adTaskForm, reward: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Ad Network / Category</label>
                <select 
                  value={adTaskForm.network} 
                  onChange={e => setAdTaskForm({...adTaskForm, network: e.target.value})} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none"
                >
                  <option value="Adsterra">Adsterra</option>
                  <option value="Monetag">Monetag</option>
                  <option value="AdOperator">AdOperator</option>
                  <option value="AdMaven">AdMaven</option>
                  <option value="HilltopAds">HilltopAds</option>
                  <option value="PropellerAds">PropellerAds</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <button className="w-full bg-amber-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Add Ad Task</button>
            </form>
          </section>

          {/* Active Tasks List */}
          <section className="space-y-4">
            <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Active Tasks</h3>
            
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-blue-400 uppercase px-1">Videos ({tasks.length})</p>
              {tasks.length === 0 ? (
                <p className="text-center py-4 text-[10px] text-slate-600 italic">No video tasks active.</p>
              ) : (
                tasks.map(t => (
                  <div key={t.id} className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{t.title}</p>
                      <p className="text-[9px] text-slate-500 truncate">{t.url}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-blue-400">{t.rewardRiyal} SAR</p>
                        <p className="text-[8px] text-slate-500">{t.timerSeconds}s</p>
                      </div>
                      <button onClick={() => onDeleteTask(t.id)} className="p-2 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-900/40 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-amber-500 uppercase px-1">Ads ({adTasks.length})</p>
              {adTasks.length === 0 ? (
                <p className="text-center py-4 text-[10px] text-slate-600 italic">No ad tasks active.</p>
              ) : (
                adTasks.map(a => (
                  <div key={a.id} className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{a.title}</p>
                      <p className="text-[9px] text-slate-500 truncate">{a.url}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-amber-500">{a.rewardRiyal} SAR</p>
                        <p className="text-[8px] text-slate-500">{a.durationSeconds}s</p>
                      </div>
                      <button onClick={() => onDeleteAdTask(a.id)} className="p-2 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-900/40 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {activeAdminTab === 'balances' && (
        <div className="space-y-6 animate-in zoom-in duration-300">
          <section className="space-y-3">
            <h3 className="font-bold text-blue-400">User Balance Manager</h3>
            <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
              <input type="number" placeholder="Search User ID" value={balanceSearch} onChange={e => setBalanceSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none" />
              {foundUser && (
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-blue-500/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold">@{foundUser.username}</p>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">{foundUser.balanceRiyal.toFixed(2)} SAR</p>
                      <p className="text-[10px] text-slate-400">{foundUser.balanceCrypto.toFixed(2)} USDT</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" step="any" placeholder="Amount (+ or -)" value={adjustment.amount} onChange={e => setAdjustment({...adjustment, amount: e.target.value})} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none" />
                    <select value={adjustment.currency} onChange={e => setAdjustment({...adjustment, currency: e.target.value as any})} className="bg-slate-800 border border-slate-700 rounded-lg px-2 text-[10px] outline-none">
                      <option value="SAR">SAR</option>
                      <option value="USDT">USDT</option>
                    </select>
                    <button onClick={handleAdjustBalance} className="bg-blue-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Apply</button>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 uppercase font-bold">Device ID</span>
                      <span className="text-slate-300 font-mono">{foundUser.deviceId || 'Not Set'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 uppercase font-bold">Last IP</span>
                      <span className="text-slate-300 font-mono">{foundUser.lastIp || 'Unknown'}</span>
                    </div>
                    {foundUser.isFlagged && (
                      <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-[10px] font-bold border border-red-900/30 space-y-1">
                        <p>⚠️ IP SECURITY FLAG DETECTED</p>
                        <p className="text-[9px] text-red-300/70 font-medium italic">{foundUser.flagReason || 'Multiple accounts detected from this IP/Device.'}</p>
                      </div>
                    )}
                    <button 
                      onClick={() => onResetDevice(foundUser.id)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all"
                    >
                      Reset Device ID
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-emerald-500">Season Management</h3>
            <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700">
               <button 
                onClick={onResetLeaderboard}
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
               >
                 🔄 Refresh Leaderboard (New Season)
               </button>
               <p className="text-[9px] text-slate-500 mt-2 text-center uppercase font-black">Clears all total earnings but keeps user balances.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-amber-500">Payment Details Editor</h3>
            <form onSubmit={handleUpdatePaymentDetails} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
              <input type="text" placeholder="Crypto Address" value={paymentForm.cryptoAddress} onChange={e => setPaymentForm({...paymentForm, cryptoAddress: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
              <textarea placeholder="Bank Info" value={paymentForm.bankInfo} onChange={e => setPaymentForm({...paymentForm, bankInfo: e.target.value})} className="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none resize-none" />
              <input type="text" placeholder="Support Username (no @)" value={paymentForm.supportUsername} onChange={e => setPaymentForm({...paymentForm, supportUsername: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
              <button className="w-full bg-amber-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Update Payment Details</button>
            </form>
          </section>
        </div>
      )}

      {activeAdminTab === 'system' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Global Toggles</h3>
            <div className="bg-slate-800 rounded-3xl border border-slate-700 divide-y divide-slate-700">
              {['global', 'videoTasks', 'adTasks', 'promote', 'wallet'].map(id => (
                <div key={id} className="p-4 flex items-center justify-between">
                  <span className="text-xs font-bold capitalize">{id}</span>
                  <button onClick={() => toggleService(id as any)} className={`h-6 w-10 rounded-full transition-colors ${maintenanceSettings[id as keyof MaintenanceSettings] ? 'bg-amber-500' : 'bg-slate-900 border border-slate-700'}`}>
                    <div className={`h-4 w-4 bg-white rounded-full transition-transform ${maintenanceSettings[id as keyof MaintenanceSettings] ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Boost Settings</h3>
            <form onSubmit={handleUpdateBoostSettings} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
              <input type="text" placeholder="Boost Ad Link (Direct)" value={boostForm.link} onChange={e => setBoostForm({...boostForm, link: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
              <input type="number" step="0.01" placeholder="Reward Amount (SAR)" value={boostForm.reward} onChange={e => setBoostForm({...boostForm, reward: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" />
              <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Update Boost Config</button>
            </form>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Universal Script Injector</h3>
            <form onSubmit={handleUpdateAdScripts} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Global Header Script (Social Bar/Popunder/Banners)</label>
                <textarea 
                  value={adScripts.header} 
                  onChange={e => setAdScripts({...adScripts, header: e.target.value})} 
                  placeholder="Paste Adsterra/Monetag/AdOperator code here..." 
                  className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-[10px] font-mono outline-none resize-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Global Footer Script (Tracking/Banners)</label>
                <textarea 
                  value={adScripts.footer} 
                  onChange={e => setAdScripts({...adScripts, footer: e.target.value})} 
                  placeholder="Paste additional ad scripts here..." 
                  className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-[10px] font-mono outline-none resize-none" 
                />
              </div>
              <button className="w-full bg-emerald-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Update Global Scripts</button>
            </form>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">System Links & Rules</h3>
            <form onSubmit={handleUpdateSystemLinks} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Support Telegram Link</label>
                <input 
                  type="text" 
                  placeholder="https://t.me/YourSupport" 
                  value={systemLinks.support} 
                  onChange={e => setSystemLinks({...systemLinks, support: e.target.value})} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Report/Feedback Link</label>
                <input 
                  type="text" 
                  placeholder="https://t.me/YourSupportBot" 
                  value={systemLinks.report} 
                  onChange={e => setSystemLinks({...systemLinks, report: e.target.value})} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Terms of Service Content</label>
                <textarea 
                  value={systemLinks.tos} 
                  onChange={e => setSystemLinks({...systemLinks, tos: e.target.value})} 
                  placeholder="App rules and policies..." 
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-[10px] outline-none resize-none" 
                />
              </div>
              <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Save System Settings</button>
            </form>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Deposit Settings</h3>
            <form onSubmit={handleUpdateDepositSettings} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Crypto Wallet Address (USDT-TRC20)</label>
                <input 
                  type="text" 
                  placeholder="T..." 
                  value={paymentForm.cryptoAddress} 
                  onChange={e => setPaymentForm({...paymentForm, cryptoAddress: e.target.value})} 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Local Payment Info (Bank Details)</label>
                <textarea 
                  placeholder="Bank Name: ...&#10;Account: ...&#10;Name: ..." 
                  value={paymentForm.bankInfo} 
                  onChange={e => setPaymentForm({...paymentForm, bankInfo: e.target.value})} 
                  className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none resize-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Deposit Instructions</label>
                <textarea 
                  placeholder="Step 1: ...&#10;Step 2: ..." 
                  value={systemLinks.instructions} 
                  onChange={e => setSystemLinks({...systemLinks, instructions: e.target.value})} 
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-[10px] outline-none resize-none" 
                />
              </div>
              <button className="w-full bg-amber-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Save Deposit Settings</button>
            </form>
          </section>
        </div>
      )}

      {/* Messaging and Payouts */}
      {activeAdminTab === 'messaging' && (
        <section className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
          <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Message to all users..." className="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs outline-none" />
          <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-xs uppercase">Send Broadcast</button>
        </section>
      )}

      {activeAdminTab === 'users' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
          <section className="space-y-3">
            <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">User Directory ({users.length})</h3>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className={`bg-slate-800 p-4 rounded-3xl border ${u.isFlagged ? 'border-red-500/50 bg-red-900/5' : 'border-slate-700'} flex justify-between items-center`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">@{u.username}</p>
                      {u.isFlagged && <span className="px-1.5 py-0.5 bg-red-600 text-[8px] font-black rounded uppercase">Flagged</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {u.id}</p>
                    {u.isFlagged && <p className="text-[9px] text-red-400 font-medium mt-1">{u.flagReason}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-blue-400">{u.balanceRiyal.toFixed(2)} SAR</p>
                    <button 
                      onClick={() => {
                        setBalanceSearch(u.id.toString());
                        setActiveAdminTab('balances');
                      }}
                      className="text-[9px] text-slate-400 underline uppercase font-bold mt-1"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeAdminTab === 'payouts' && (
        <section className="space-y-4">
          <h3 className="font-bold flex items-center gap-2">💰 Pending Withdrawals</h3>
          {withdrawals.filter(w => w.status === 'PENDING').length === 0 ? (
            <p className="text-center py-10 opacity-30 italic">No pending requests.</p>
          ) : (
            withdrawals.filter(w => w.status === 'PENDING').map(w => (
              <div key={w.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs font-bold uppercase">User: {w.userId}</span>
                  <span className="text-xs font-black text-blue-400">{w.localAmount || w.amount} {w.localCurrency || (w.currency === 'Riyal' ? 'SAR' : 'USDT')}</span>
                </div>
                <p className="text-[10px] text-slate-500 break-all">{w.address}</p>
                <div className="flex gap-2">
                   <button onClick={() => onAction(w.id, 'withdrawal', 'COMPLETED')} className="flex-1 bg-green-600 py-1.5 rounded-lg text-[10px] font-black uppercase">Approve</button>
                   <button onClick={() => onAction(w.id, 'withdrawal', 'FAILED')} className="flex-1 bg-red-600/20 text-red-500 py-1.5 rounded-lg text-[10px] font-black uppercase">Reject</button>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
};

export default Admin;
