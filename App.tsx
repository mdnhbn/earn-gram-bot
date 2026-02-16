
import React, { useState, useEffect, useMemo } from 'react';
import { User, Task, AdTask, AdView, TaskSubmission, WithdrawalRequest, TaskStatus, MaintenanceSettings, Transaction } from './types';
import { getCurrentUser, getTasks, saveTasks, getAdTasks, saveAdTasks, getAdViews, saveAdViews, getSubmissions, saveSubmissions, getWithdrawals, saveWithdrawals, getUsers, saveUsers, saveActiveTask, getActiveTask, getMaintenanceSettings, saveMaintenanceSettings, getTransactions, saveTransactions, ADMIN_TELEGRAM_ID, isUserAdmin } from './state';
import { TelegramService } from './services/telegram';
import Navigation from './components/Navigation';
import Home from './components/Home';
import TasksHub from './components/TasksHub';
import ActiveTask from './components/ActiveTask';
import Wallet from './components/Wallet';
import Profile from './components/Profile';
import Admin from './components/Admin';
import Verification from './components/Verification';

const CURRENCY_MAPPING: Record<string, string> = {
  'Saudi Arabia': 'SAR',
  'Bangladesh': 'BDT',
  'India': 'INR',
  'United States': 'USD',
  'United Kingdom': 'GBP',
  'United Arab Emirates': 'AED',
  'Pakistan': 'PKR'
};

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const [users, setUsers] = useState<User[]>(getUsers());
  const [tasks, setTasks] = useState<Task[]>(getTasks());
  const [adTasks, setAdTasks] = useState<AdTask[]>(getAdTasks());
  const [adViews, setAdViews] = useState<AdView[]>(getAdViews());
  const [submissions, setSubmissions] = useState<TaskSubmission[]>(getSubmissions());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(getWithdrawals());
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions());
  const [maintenance, setMaintenance] = useState<MaintenanceSettings>(getMaintenanceSettings());
  
  const persistedState = getActiveTask();
  const [executionTask, setExecutionTask] = useState<Task | AdTask | null>(persistedState?.task || null);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(persistedState?.startTime || null);
  const [strikesBeforeTask, setStrikesBeforeTask] = useState<number | null>(null);
  
  const [isPaused, setIsPaused] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showWarning, setShowWarning] = useState(false);

  const currentUser = users[0];
  const isAdmin = useMemo(() => isUserAdmin(currentUser.id), [currentUser.id]);

  // Leaderboard Logic
  const leaderboard = useMemo(() => {
    return [...users]
      .sort((a, b) => b.totalEarningsRiyal - a.totalEarningsRiyal)
      .slice(0, 10);
  }, [users]);

  const userRank = useMemo(() => {
    const sorted = [...users].sort((a, b) => b.totalEarningsRiyal - a.totalEarningsRiyal);
    return sorted.findIndex(u => u.id === currentUser.id) + 1;
  }, [users, currentUser.id]);

  useEffect(() => {
    const detectLocation = async () => {
      if (currentUser.country && currentUser.preferredCurrency) return;
      const defaultState = {
        country: currentUser.country || 'International',
        preferredCurrency: currentUser.preferredCurrency || 'USD'
      };
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Network response not ok');
        const data = await response.json();
        if (data && data.country_name) {
          const detectedCountry = data.country_name;
          const detectedCurrency = CURRENCY_MAPPING[detectedCountry] || 'USD';
          const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, country: detectedCountry, preferredCurrency: u.preferredCurrency || detectedCurrency } : u);
          setUsers(updatedUsers);
          saveUsers(updatedUsers);
        }
      } catch (error) {
        console.debug('Location detection failed, using defaults:', error);
        const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, country: defaultState.country, preferredCurrency: defaultState.preferredCurrency } : u);
        setUsers(updatedUsers);
        saveUsers(updatedUsers);
      }
    };
    detectLocation();
  }, [currentUser.id]);

  // Sync active task state to persistence
  useEffect(() => {
    saveActiveTask(executionTask, executionStartTime);
  }, [executionTask, executionStartTime]);

  // Safety: Prevent unauthorized tab access
  useEffect(() => {
    if (currentTab === 'admin' && !isAdmin) {
      setCurrentTab('home');
      TelegramService.showAlert('Access Denied: You are not an administrator.');
    }
  }, [currentTab, isAdmin]);

  const addTransaction = (userId: number, amount: number, currency: 'SAR' | 'USDT', type: Transaction['type'], description: string) => {
    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId, amount, currency, type, description,
      createdAt: new Date().toISOString()
    };
    const updated = [tx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  };

  const handleStartExecution = (task: Task | AdTask) => {
    setStrikesBeforeTask(currentUser.warningCount);
    setExecutionTask(task);
    setExecutionStartTime(Date.now());
  };

  const handleStartBoost = () => {
    const boostTask: AdTask = {
      id: 'boost-' + Date.now(),
      title: 'Quick Earnings Boost',
      url: maintenance.boostAdLink,
      rewardRiyal: maintenance.boostRewardRiyal,
      rewardCrypto: maintenance.boostRewardRiyal / 10, // Approx
      durationSeconds: 15,
    };
    handleStartExecution(boostTask);
  };

  const handleClaimExecution = () => {
    if (!executionTask || !executionStartTime) return;
    const isBoostTask = executionTask.id.startsWith('boost-');
    
    const updatedUsers = users.map((u) => u.id === currentUser.id ? {
      ...u,
      balanceRiyal: u.balanceRiyal + executionTask.rewardRiyal,
      balanceCrypto: u.balanceCrypto + (executionTask.rewardCrypto || 0),
      totalEarningsRiyal: u.totalEarningsRiyal + executionTask.rewardRiyal,
      lastBoostClaim: isBoostTask ? new Date().toISOString() : u.lastBoostClaim
    } : u);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    addTransaction(currentUser.id, executionTask.rewardRiyal, 'SAR', 'EARNING', `${isBoostTask ? 'Boost' : 'Task'}: ${executionTask.title}`);

    if (!isBoostTask && executionTask.ownerId) {
      if ('platform' in executionTask) {
        const updatedTasks = tasks.map(t => (t.id === executionTask.id ? { ...t, budget: (t.budget || 0) - 1 } : t)).filter(t => (t.budget === undefined || t.budget > 0));
        setTasks(updatedTasks);
        saveTasks(updatedTasks);
      } else {
        const updatedAds = adTasks.map(a => (a.id === executionTask.id ? { ...a, budget: (a.budget || 0) - 1 } : a)).filter(a => (a.budget === undefined || a.budget > 0));
        setAdTasks(updatedAds);
        saveAdTasks(updatedAds);
      }
    }

    if (!isBoostTask) {
        if ('platform' in executionTask) {
          const newSubs = [...submissions, { id: Math.random().toString(36).substr(2, 9), userId: currentUser.id, taskId: executionTask.id, status: TaskStatus.APPROVED, submittedAt: new Date().toISOString() }];
          setSubmissions(newSubs);
          saveSubmissions(newSubs);
        } else {
          const newViews = [...adViews, { userId: currentUser.id, adTaskId: executionTask.id, viewedAt: new Date().toISOString() }];
          setAdViews(newViews);
          saveAdViews(newViews);
        }
    }

    setExecutionTask(null);
    setExecutionStartTime(null);
    setStrikesBeforeTask(null);
    TelegramService.showAlert('Reward claimed successfully!');
  };

  const handleCancelExecution = () => {
    // Revert strikes earned during this session
    if (strikesBeforeTask !== null) {
      const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, warningCount: strikesBeforeTask, isBanned: strikesBeforeTask >= 3 } : u);
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
    }
    
    // Full state reset
    setExecutionTask(null);
    setExecutionStartTime(null);
    setStrikesBeforeTask(null);
    setIsPaused(false);
  };

  const handleClaimBonus = () => {
    const updatedUsers = users.map((u) => u.id === currentUser.id ? { ...u, balanceRiyal: u.balanceRiyal + 1.00, totalEarningsRiyal: u.totalEarningsRiyal + 1.00, dailyBonusLastClaim: new Date().toISOString() } : u);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    addTransaction(currentUser.id, 1, 'SAR', 'EARNING', 'Daily Bonus');
    TelegramService.showAlert('Daily bonus of 1.00 SAR claimed!');
    TelegramService.haptic('medium');
  };

  const handleWithdrawRequest = (data: any) => {
    const newWithdrawal: WithdrawalRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      amount: data.amount, currency: data.currency,
      localCurrency: data.localCurrency, localAmount: data.localAmount,
      country: currentUser.country, method: data.method, address: data.address,
      status: 'PENDING', createdAt: new Date().toISOString()
    };
    const updatedWithdrawals = [newWithdrawal, ...withdrawals];
    setWithdrawals(updatedWithdrawals);
    saveWithdrawals(updatedWithdrawals);

    const updatedUsers = users.map((u) => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          balanceRiyal: data.currency === 'Riyal' ? u.balanceRiyal - data.amount : u.balanceRiyal,
          balanceCrypto: data.currency === 'Crypto' ? u.balanceCrypto - data.amount : u.balanceCrypto
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    addTransaction(currentUser.id, data.amount, data.currency === 'Riyal' ? 'SAR' : 'USDT', 'WITHDRAWAL', `Payout Request: ${data.method}`);
  };

  const handleAdminAction = (id: string, type: 'submission' | 'withdrawal', status: any) => {
    if (!isAdmin) return; // Strict block
    if (type === 'withdrawal') {
      const request = withdrawals.find(w => w.id === id);
      if (!request) return;
      const updatedWithdrawals = withdrawals.map(w => w.id === id ? { ...w, status } : w);
      setWithdrawals(updatedWithdrawals);
      saveWithdrawals(updatedWithdrawals);
      if (status === 'FAILED') {
        const updatedUsers = users.map(u => u.id === request.userId ? { ...u, balanceRiyal: request.currency === 'Riyal' ? u.balanceRiyal + request.amount : u.balanceRiyal, balanceCrypto: request.currency === 'Crypto' ? u.balanceCrypto + request.amount : u.balanceCrypto } : u);
        setUsers(updatedUsers);
        saveUsers(updatedUsers);
        addTransaction(request.userId, request.amount, request.currency === 'Riyal' ? 'SAR' : 'USDT', 'EARNING', 'Withdrawal Refund');
      }
      TelegramService.haptic('medium');
    }
  };

  const handleUpdateUserBalance = (userId: number, amount: number, currency: 'SAR' | 'USDT') => {
    if (!isAdmin) return; // Strict block
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          balanceRiyal: currency === 'SAR' ? u.balanceRiyal + amount : u.balanceRiyal,
          balanceCrypto: currency === 'USDT' ? u.balanceCrypto + amount : u.balanceCrypto,
          totalEarningsRiyal: amount > 0 ? u.totalEarningsRiyal + amount : u.totalEarningsRiyal
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    addTransaction(userId, Math.abs(amount), currency, amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL', 'Admin Manual Adjustment');
    TelegramService.showAlert(`Balance updated for User ${userId}`);
  };

  const handleAddUserTask = (task: Task, cost: number, currency: 'SAR' | 'USDT') => {
    const updatedUsers = users.map((u) => u.id === currentUser.id ? { ...u, balanceRiyal: currency === 'SAR' ? u.balanceRiyal - cost : u.balanceRiyal, balanceCrypto: currency === 'USDT' ? u.balanceCrypto - cost : u.balanceCrypto } : u);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    addTransaction(currentUser.id, cost, currency, 'AD_PROMOTION', `Promotion: ${task.title}`);
    const newTasks = [...tasks, task];
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const handleAddUserAdTask = (ad: AdTask, cost: number, currency: 'SAR' | 'USDT') => {
    const updatedUsers = users.map((u) => u.id === currentUser.id ? { ...u, balanceRiyal: currency === 'SAR' ? u.balanceRiyal - cost : u.balanceRiyal, balanceCrypto: currency === 'USDT' ? u.balanceCrypto - cost : u.balanceCrypto } : u);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    addTransaction(currentUser.id, cost, currency, 'AD_PROMOTION', `Promotion: ${ad.title}`);
    const newAds = [...adTasks, ad];
    setAdTasks(newAds);
    saveAdTasks(newAds);
  };

  const handleCompleteVerification = () => {
    const updatedUsers = users.map((u) => u.id === currentUser.id ? { ...u, isVerified: true } : u);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    TelegramService.showAlert('Account verified!');
  };

  const handleViolation = () => {
    setIsPaused(true);
    const updatedUsers = users.map((u) => {
      if (u.id === currentUser.id) {
        const warningCount = u.warningCount + 1;
        const isBanned = warningCount >= 3;
        return { ...u, warningCount, isBanned };
      }
      return u;
    });
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    TelegramService.haptic('heavy');
    TelegramService.showAlert('Security violation detected! Leaving the page during a task results in a strike.');
    if (updatedUsers.find(u => u.id === currentUser.id)?.isBanned) {
      setExecutionTask(null);
      setExecutionStartTime(null);
    }
  };

  const handleUpdatePreference = (pref: Partial<User>) => {
    const updatedUsers = users.map((u) => u.id === currentUser.id ? { ...u, ...pref } : u);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  };

  const handleUpdateMaintenance = (settings: MaintenanceSettings) => {
    if (!isAdmin) return;
    setMaintenance(settings);
    saveMaintenanceSettings(settings);
  };

  const handleResetLeaderboard = () => {
    if (!isAdmin) return;
    TelegramService.showConfirm('Are you sure you want to reset leaderboard points? This will not affect user balances, only total earning stats for the current season.', (ok) => {
      if (ok) {
        const updatedUsers = users.map(u => ({ ...u, totalEarningsRiyal: 0 }));
        setUsers(updatedUsers);
        saveUsers(updatedUsers);
        TelegramService.showAlert('Leaderboard reset for a new season!');
      }
    });
  };

  if (currentUser.isBanned) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-10 text-center font-bold text-red-500 uppercase tracking-widest">Account Banned<br/><span className="text-xs text-slate-500 mt-2">Contact Support</span></div>;
  if (!currentUser.isVerified && !isAdmin) return <Verification channels={maintenance.verificationChannels} onVerify={handleCompleteVerification} />;
  if (maintenance.global && !isAdmin) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500"><div className="text-8xl mb-6">🛠️</div><h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Under Maintenance</h1><p className="text-slate-400 text-lg leading-relaxed">We are performing some updates. We will be back shortly!</p></div>;

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto relative bg-slate-900 shadow-2xl overflow-x-hidden pt-12">
      {executionTask && <ActiveTask task={executionTask} onClaim={handleClaimExecution} onCancel={handleCancelExecution} isPaused={isPaused} onFocusSignal={(lost) => lost ? handleViolation() : setIsPaused(false)} />}
      
      {currentTab === 'home' && (
        <Home 
          user={currentUser} 
          onClaimBonus={handleClaimBonus} 
          leaderboard={leaderboard} 
          userRank={userRank} 
          onStartBoost={handleStartBoost}
        />
      )}
      
      {currentTab === 'tasks' && (
        <TasksHub 
          user={currentUser}
          tasks={tasks}
          adTasks={adTasks}
          submissions={submissions}
          adViews={adViews}
          onStartTask={handleStartExecution}
          onStartAd={handleStartExecution}
          onAddTask={handleAddUserTask}
          onAddAdTask={handleAddUserAdTask}
          isMaintenanceVideos={maintenance.videoTasks && !isAdmin}
          isMaintenanceAds={maintenance.adTasks && !isAdmin}
          isMaintenancePromote={maintenance.promote && !isAdmin}
          onGoToDeposit={() => setCurrentTab('wallet')}
        />
      )}
      
      {currentTab === 'wallet' && <Wallet user={currentUser} withdrawals={withdrawals} transactions={transactions} onWithdraw={handleWithdrawRequest} isMaintenance={maintenance.wallet && !isAdmin} onUpdatePreference={handleUpdatePreference} paymentDetails={maintenance.paymentDetails} />}
      {currentTab === 'profile' && <Profile user={currentUser} />}
      
      {currentTab === 'admin' && isAdmin && (
        <Admin 
          submissions={submissions} 
          withdrawals={withdrawals} 
          tasks={tasks} 
          adTasks={adTasks} 
          users={users} 
          maintenanceSettings={maintenance} 
          onUpdateMaintenance={handleUpdateMaintenance} 
          onAction={handleAdminAction} 
          onAddTask={(t) => { const nt = [...tasks, t]; setTasks(nt); saveTasks(nt); }} 
          onAddAdTask={(t) => { const na = [...adTasks, t]; setAdTasks(na); saveAdTasks(na); }} 
          onDeleteTask={(id) => { const nt = tasks.filter(t => t.id !== id); setTasks(nt); saveTasks(nt); }} 
          onDeleteAdTask={(id) => { const na = adTasks.filter(a => a.id !== id); setAdTasks(na); saveAdTasks(na); }} 
          onUnban={(uid) => setUsers(users.map(u => u.id === uid ? { ...u, isBanned: false, warningCount: 0 } : u))} 
          onUpdateBalance={handleUpdateUserBalance} 
          onResetLeaderboard={handleResetLeaderboard}
        />
      )}
      
      {!executionTask && <Navigation currentTab={currentTab} setTab={setCurrentTab} isAdmin={isAdmin} />}
    </div>
  );
};

export default App;
