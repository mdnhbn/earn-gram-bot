
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
}

const Admin: React.FC<AdminProps> = ({ withdrawals, tasks, adTasks, users, maintenanceSettings, onUpdateMaintenance, onAction, onAddTask, onAddAdTask, onDeleteTask, onDeleteAdTask, onUnban, onUpdateBalance, onResetLeaderboard }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'system' | 'payouts' | 'messaging' | 'balances'>('system');
  const [balanceSearch, setBalanceSearch] = useState('');
  const [adjustment, setAdjustment] = useState({ amount: '', currency: 'SAR' as const });
  const [paymentForm, setPaymentForm] = useState<AdminPaymentDetails>(maintenanceSettings.paymentDetails);
  const [boostForm, setBoostForm] = useState({
    link: maintenanceSettings.boostAdLink,
    reward: maintenanceSettings.boostRewardRiyal.toString()
  });
  const [broadcastMsg, setBroadcastMsg] = useState('');

  const currentUser = users[0]; // Assuming user[0] is current session user
  if (!isUserAdmin(currentUser.id)) {
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

  const handleAdjustBalance = () => {
    if (!foundUser || !adjustment.amount) return;
    onUpdateBalance(foundUser.id, parseFloat(adjustment.amount), adjustment.currency);
    setAdjustment({ ...adjustment, amount: '' });
  };

  return (
    <div className="p-4 space-y-6 pb-32">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin</h2>
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button onClick={() => setActiveAdminTab('system')} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${activeAdminTab === 'system' ? 'bg-blue-600' : ''}`}>Sys</button>
          <button onClick={() => setActiveAdminTab('payouts')} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${activeAdminTab === 'payouts' ? 'bg-blue-600' : ''}`}>Pay</button>
          <button onClick={() => setActiveAdminTab('messaging')} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${activeAdminTab === 'messaging' ? 'bg-blue-600' : ''}`}>Chat</button>
          <button onClick={() => setActiveAdminTab('balances')} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${activeAdminTab === 'balances' ? 'bg-blue-600' : ''}`}>Bal</button>
        </div>
      </header>

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
        </div>
      )}

      {/* Messaging and Payouts */}
      {activeAdminTab === 'messaging' && (
        <section className="bg-slate-800 p-4 rounded-3xl border border-slate-700 space-y-3">
          <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Message to all users..." className="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs outline-none" />
          <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-xs uppercase">Send Broadcast</button>
        </section>
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
