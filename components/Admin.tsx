
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
  const [activeAdminTab, setActiveAdminTab] = useState<'system' | 'payouts' | 'messaging' | 'balances' | 'tasks' | 'approvals' | 'users' | 'deposits'>('system');
  const [activeSysTab, setActiveSysTab] = useState<'maintenance' | 'ad_config' | 'app_info' | 'payment'>('maintenance');
  const [balanceSearch, setBalanceSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [isFetchingDeposits, setIsFetchingDeposits] = useState(false);
  const [adjustment, setAdjustment] = useState({ amount: '', currency: 'SAR' as const });
  const [paymentForm, setPaymentForm] = useState<AdminPaymentDetails>(maintenanceSettings.paymentDetails);
  const [boostForm, setBoostForm] = useState({
    link: maintenanceSettings.boostAdLink,
    reward: maintenanceSettings.boostRewardRiyal.toString()
  });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isResettingLeaderboard, setIsResettingLeaderboard] = useState(false);
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
  const [channelInputs, setChannelInputs] = useState<string[]>(
    maintenanceSettings.verificationChannels?.length ? [...maintenanceSettings.verificationChannels] : ['', '', '', '', '']
  );

  // Ensure we always have 5 inputs
  useEffect(() => {
    if (channelInputs.length < 5) {
      const newInputs = [...channelInputs];
      while (newInputs.length < 5) newInputs.push('');
      setChannelInputs(newInputs);
    }
  }, [channelInputs]);

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

  useEffect(() => {
    if (activeAdminTab === 'deposits') {
      fetchDeposits();
    }
  }, [activeAdminTab]);

  const fetchDeposits = async () => {
    setIsFetchingDeposits(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/deposits?admin_id=${currentUser.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDeposits(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingDeposits(false);
    }
  };

  const handleApproveDeposit = async (id: string) => {
    if (!window.confirm('Approve this deposit and credit user?')) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/approve_deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: currentUser.id, deposit_id: id })
      });
      if (res.ok) {
        TelegramService.showAlert('Deposit Approved!');
        fetchDeposits();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    if (!window.confirm('Reject this deposit?')) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/reject_deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: currentUser.id, deposit_id: id })
      });
      if (res.ok) {
        TelegramService.showAlert('Deposit Rejected');
        fetchDeposits();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/update_settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser.id,
          paymentDetails: paymentForm
        })
      });
      
      if (res.ok) {
        onUpdateMaintenance({ ...maintenanceSettings, paymentDetails: paymentForm });
        TelegramService.showAlert('System settings updated successfully!');
      } else {
        TelegramService.showAlert('Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      TelegramService.showAlert('Error updating settings');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleResetLeaderboardClick = async () => {
    if (!window.confirm('Are you sure you want to start a new season? This will reset ranks.')) return;
    
    setIsResettingLeaderboard(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/reset_leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: currentUser.id })
      });
      
      if (res.ok) {
        onResetLeaderboard();
        TelegramService.showAlert('Leaderboard reset successfully!');
      } else {
        TelegramService.showAlert('Failed to reset leaderboard');
      }
    } catch (err) {
      console.error(err);
      TelegramService.showAlert('Error resetting leaderboard');
    } finally {
      setIsResettingLeaderboard(false);
    }
  };

  const handleUpdateChannels = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    
    // Filter out empty channels and ensure they start with @
    const cleanedChannels = channelInputs
      .map(c => c.trim())
      .filter(c => c !== '')
      .map(c => c.startsWith('@') ? c : `@${c}`);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...maintenanceSettings,
          verificationChannels: cleanedChannels
        })
      });

      if (res.ok) {
        onUpdateMaintenance({
          ...maintenanceSettings,
          verificationChannels: cleanedChannels
        });
        TelegramService.showAlert('Mandatory channels updated successfully!');
      } else {
        TelegramService.showAlert('Failed to update channels');
      }
    } catch (err) {
      console.error(err);
      TelegramService.showAlert('Error updating channels');
    } finally {
      setIsUpdatingSettings(false);
    }
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

  const handleUpdateDepositSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/update_settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser.id,
          paymentDetails: paymentForm
        })
      });
      
      if (res.ok) {
        onUpdateMaintenance({ 
          ...maintenanceSettings, 
          paymentDetails: paymentForm,
          depositInstructions: systemLinks.instructions
        });
        TelegramService.showAlert('Deposit settings updated successfully!');
      } else {
        TelegramService.showAlert('Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      TelegramService.showAlert('Error updating settings');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleSearchUser = async (userId?: string) => {
    const idToSearch = userId || balanceSearch;
    if (!idToSearch) return;
    setIsSearching(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/user_details/${idToSearch}?admin_id=${currentUser.id}`);
      const data = await res.json();
      if (data.status === 'success') {
        const userIdNum = parseInt(idToSearch);
        setSelectedUserId(userIdNum);
        setSearchedUser({
          id: userIdNum,
          username: data.username,
          balanceRiyal: data.balance_sar,
          balanceCrypto: data.balance_usdt,
          deviceId: data.device_id,
          lastIp: data.last_ip
        });
      } else {
        TelegramService.showAlert('User not found');
        setSearchedUser(null);
        setSelectedUserId(null);
      }
    } catch (err) {
      console.error(err);
      TelegramService.showAlert('Error searching user');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!searchedUser || !adjustment.amount) return;
    
    setIsUpdatingSettings(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/update_balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser.id,
          user_id: searchedUser.id,
          amount: parseFloat(adjustment.amount),
          currency: adjustment.currency
        })
      });
      
      if (res.ok) {
        TelegramService.showAlert('Balance Updated Successfully!');
        onUpdateBalance(searchedUser.id, parseFloat(adjustment.amount), adjustment.currency);
        setAdjustment({ ...adjustment, amount: '' });
        handleSearchUser();
      } else {
        TelegramService.showAlert('Failed to update balance');
      }
    } catch (err) {
      console.error(err);
      TelegramService.showAlert('Error updating balance');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleAdminResetDevice = async () => {
    if (!searchedUser) return;
    
    setIsUpdatingSettings(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/admin/reset_device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser.id,
          user_id: searchedUser.id
        })
      });
      
      if (res.ok) {
        TelegramService.showAlert('Device ID reset successfully!');
        handleSearchUser(); // Refresh user data
      } else {
        TelegramService.showAlert('Failed to reset device');
      }
    } catch (err) {
      console.error(err);
      TelegramService.showAlert('Error resetting device');
    } finally {
      setIsUpdatingSettings(false);
    }
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
      platform: videoTaskForm.platform as any,
      status: 'active',
      ownerId: currentUser.id,
      budget: 1000 // Default budget for admin tasks
    };
    onAddTask(newTask);
    setVideoTaskForm({ title: '', url: '', duration: '15', reward: '1.00', platform: 'YouTube' });
    TelegramService.showAlert('Video task added!');
    setTimeout(() => window.location.reload(), 1000);
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
      networkName: adTaskForm.network,
      status: 'active',
      ownerId: currentUser.id,
      budget: 1000 // Default budget for admin tasks
    };
    onAddAdTask(newAd);
    setAdTaskForm({ title: '', url: '', duration: '10', reward: '0.50', network: 'Monetag' });
    TelegramService.showAlert('Ad task added!');
    setTimeout(() => window.location.reload(), 1000);
  };
  
  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser.id,
          message: broadcastMsg
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        TelegramService.showAlert(`Broadcast Started: Sending message to ${data.total} users...`);
        setBroadcastMsg('');
      } else {
        TelegramService.showAlert(data.message || 'Broadcast failed');
      }
    } catch (e) {
      console.error('Broadcast error:', e);
      TelegramService.showAlert('Server error during broadcast');
    }
  };

  const isSuperAdmin = currentUser.id === 929198867 || isPreviewMode;

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
            { id: 'balances', label: 'Balances', super: true },
            { id: 'payouts', label: 'Payouts' },
            { id: 'messaging', label: 'Broadcast' },
            { id: 'deposits', label: 'Deposits', super: true }
          ]
          .filter(tab => !tab.super || isSuperAdmin)
          .map((tab) => (
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

      {activeAdminTab === 'deposits' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <section className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Payment Logs</h3>
              <button onClick={fetchDeposits} className="text-[10px] text-blue-400 font-bold uppercase">Refresh</button>
            </div>
            <div className="space-y-3">
              {isFetchingDeposits ? (
                <div className="text-center py-10 text-slate-500 text-sm italic">Loading deposits...</div>
              ) : deposits.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm italic">No deposit attempts found.</div>
              ) : (
                deposits.map(d => (
                  <div key={d._id} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold">User ID: {d.userId}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{d.method} • {d.currency}</p>
                        <p className="text-[10px] text-blue-400 font-mono mt-1">TxID: {d.txId}</p>
                        {d.senderNumber && <p className="text-[10px] text-amber-400 font-bold mt-1">Sender: {d.senderNumber}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-sm">{d.amount} {d.currency}</p>
                        <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${
                          d.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' :
                          d.status === 'APPROVED' ? 'bg-green-500/20 text-green-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {d.status}
                        </p>
                      </div>
                    </div>
                    {d.status === 'PENDING' && (
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => handleApproveDeposit(d._id)}
                          className="flex-1 bg-green-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/20"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectDeposit(d._id)}
                          className="flex-1 bg-red-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
      {activeAdminTab === 'balances' && isSuperAdmin && (
        <div className="space-y-6 animate-in zoom-in duration-300">
          <section className="space-y-3">
            <h3 className="font-bold text-blue-400">User Balance Manager</h3>
            <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Enter User ID" 
                  value={balanceSearch} 
                  onChange={e => setBalanceSearch(e.target.value)} 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none" 
                />
                <button 
                  onClick={() => handleSearchUser()}
                  disabled={isSearching}
                  className="bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold uppercase disabled:opacity-50"
                >
                  {isSearching ? '...' : 'SEARCH'}
                </button>
              </div>
              
              {isSearching && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fetching User Data...</p>
                </div>
              )}

              {searchedUser && !isSearching && (
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-blue-500/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold">@{searchedUser.username}</p>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">{searchedUser.balanceRiyal.toFixed(2)} SAR</p>
                      <p className="text-[10px] text-slate-400">{searchedUser.balanceCrypto.toFixed(2)} USDT</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="any" 
                      placeholder="Amount (+ or -)" 
                      value={adjustment.amount} 
                      onChange={e => setAdjustment({...adjustment, amount: e.target.value})} 
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none" 
                    />
                    <select value={adjustment.currency} onChange={e => setAdjustment({...adjustment, currency: e.target.value as any})} className="bg-slate-800 border border-slate-700 rounded-lg px-2 text-[10px] outline-none">
                      <option value="SAR">SAR</option>
                      <option value="USDT">USDT</option>
                    </select>
                    <button 
                      onClick={handleAdjustBalance} 
                      disabled={isUpdatingSettings}
                      className="bg-blue-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                    >
                      APPLY
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 uppercase font-bold">Device ID</span>
                      <span className="text-slate-300 font-mono">{searchedUser.deviceId || 'Not Set'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 uppercase font-bold">Last IP</span>
                      <span className="text-slate-300 font-mono">{searchedUser.lastIp || 'Unknown'}</span>
                    </div>
                    
                    <button 
                      onClick={handleAdminResetDevice}
                      disabled={isUpdatingSettings}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all disabled:opacity-50"
                    >
                      RESET DEVICE ID
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
                onClick={handleResetLeaderboardClick}
                disabled={isResettingLeaderboard}
                className={`w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${isResettingLeaderboard ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 {isResettingLeaderboard ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Resetting...
                   </>
                 ) : (
                   'REFRESH LEADERBOARD'
                 )}
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
              <button 
                disabled={isUpdatingSettings}
                className={`w-full bg-amber-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${isUpdatingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUpdatingSettings ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  'Update Payment Details'
                )}
              </button>
            </form>
          </section>
        </div>
      )}

      {activeAdminTab === 'system' && (
        <div className="space-y-6">
          {/* SYS Sub-Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-700/50 shadow-inner">
            {[
              { id: 'maintenance', label: 'Maintenance' },
              { id: 'ad_config', label: 'Ad Config' },
              { id: 'app_info', label: 'App Info' },
              { id: 'payment', label: 'Payment' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSysTab(tab.id as any)}
                className={`flex-1 px-3 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                  activeSysTab === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-[1.02] border border-blue-400/30'
                    : 'bg-slate-800/40 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeSysTab === 'maintenance' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <section className="space-y-3">
                  <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Global Toggles</h3>
                  <div className="bg-slate-800 rounded-3xl border border-slate-700 divide-y divide-slate-700">
                    {['global', 'videoTasks', 'adTasks', 'promote', 'wallet'].map(id => {
                      const isActive = maintenanceSettings[id as keyof MaintenanceSettings];
                      return (
                        <div key={id} className="p-4 flex items-center justify-between">
                          <span className="text-xs font-bold capitalize">{id}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase ${isActive ? 'text-green-500' : 'text-red-500'}`}>
                              {isActive ? 'ON' : 'OFF'}
                            </span>
                            <button 
                              onClick={() => toggleService(id as any)} 
                              className={`h-6 w-10 rounded-full transition-all duration-200 relative ${isActive ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-900 border border-slate-700'}`}
                            >
                              <div className={`h-4 w-4 bg-white rounded-full transition-transform duration-200 absolute top-1 ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {activeSysTab === 'ad_config' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
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
              </div>
            )}

            {activeSysTab === 'app_info' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <section className="space-y-3">
                  <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Mandatory Channels Manager</h3>
                  <form onSubmit={handleUpdateChannels} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
                    <p className="text-[9px] text-slate-400 px-1 uppercase font-bold">Enter Telegram usernames (e.g. @channelname)</p>
                    <div className="space-y-2">
                      {channelInputs.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold w-4">{idx + 1}</span>
                          <input 
                            type="text" 
                            placeholder={`@channel${idx + 1}`}
                            value={val}
                            onChange={(e) => {
                              const newInputs = [...channelInputs];
                              newInputs[idx] = e.target.value;
                              setChannelInputs(newInputs);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500/50 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                    <button 
                      disabled={isUpdatingSettings}
                      className={`w-full bg-blue-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isUpdatingSettings ? 'opacity-50' : ''}`}
                    >
                      {isUpdatingSettings ? 'Saving...' : 'Save Channels'}
                    </button>
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
              </div>
            )}

            {activeSysTab === 'payment' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <section className="space-y-3">
                  <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Deposit Settings</h3>
                  <form onSubmit={handleUpdateDepositSettings} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase font-bold px-1">Gateway API Key (CoinRemitter/NowPayments)</label>
                      <input 
                        type="password" 
                        placeholder="API Key..." 
                        value={paymentForm.apiKey || ''} 
                        onChange={e => setPaymentForm({...paymentForm, apiKey: e.target.value})} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs outline-none" 
                      />
                    </div>
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
                    <button 
                      disabled={isUpdatingSettings}
                      className={`w-full bg-amber-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${isUpdatingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isUpdatingSettings ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Deposit Settings'
                      )}
                    </button>
                  </form>
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messaging and Payouts */}
      {activeAdminTab === 'messaging' && (
        <section className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
          <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Message to all users..." className="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs outline-none" />
          <button onClick={handleBroadcast} className="w-full bg-blue-600 py-3 rounded-xl font-bold text-xs uppercase">Send Broadcast</button>
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
                        handleSearchUser(u.id.toString());
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
