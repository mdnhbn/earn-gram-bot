
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Task, AdTask, AdView, TaskSubmission, WithdrawalRequest, TaskStatus, MaintenanceSettings, Transaction, CurrencyInfo } from './types';
import { getCurrentUser, getTasks, saveTasks, getAdTasks, saveAdTasks, getAdViews, saveAdViews, getSubmissions, saveSubmissions, getWithdrawals, saveWithdrawals, getUsers, saveUsers, saveActiveTask, getActiveTask, getMaintenanceSettings, saveMaintenanceSettings, getTransactions, saveTransactions, ADMIN_TELEGRAM_ID, isUserAdmin } from './state';
import { EXCHANGE_RATES, CURRENCY_LABELS } from './constants';
import { fetchWithTimeout } from './services/api';
import { TelegramService } from './services/telegram';
import { SecurityService } from './services/security';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
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

const BannerAd: React.FC<{ script?: string; id: string }> = ({ script, id }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!script || !containerRef.current) return;
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create a range to parse the script string into DOM nodes
    const range = document.createRange();
    const documentFragment = range.createContextualFragment(script);
    
    // Append the fragment which will execute scripts
    containerRef.current.appendChild(documentFragment);
  }, [script]);

  return (
    <div 
      id={id} 
      ref={containerRef} 
      className="w-full flex justify-center items-center min-h-[10px] bg-transparent overflow-visible relative z-50" 
    />
  );
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
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>({
    code: 'SAR',
    symbol: 'SAR',
    label: 'RIYAL',
    rate: 1.0
  });
  
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          const code = data.currency || 'SAR';
          const country = data.country_name || 'Unknown';
          
          let label = CURRENCY_LABELS[code] || code;
          if (country === 'Bangladesh') label = 'TAKA';
          if (country === 'India') label = 'RUPEE';
          if (country === 'Pakistan') label = 'RUPEE';
          
          const rate = EXCHANGE_RATES[code] || 1.0;
          
          setCurrencyInfo({
            code,
            symbol: code,
            label,
            rate
          });
          
          console.log(`Detected: ${country} (${code}), Rate: ${rate}, Label: ${label}`);
        }
      } catch (e) {
        console.warn('Currency detection failed, using default SAR:', e);
      }
    };
    detectCurrency();
  }, []);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetchWithTimeout(`${apiUrl}/api/maintenance`);
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setMaintenance(prev => {
              const updated = { ...prev, ...data };
              saveMaintenanceSettings(updated);
              return updated;
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch maintenance settings (using local):', e);
      }
    };
    fetchMaintenance();
  }, []);

  const handleUpdateMaintenance = async (settings: MaintenanceSettings) => {
    setMaintenance(settings);
    saveMaintenanceSettings(settings);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await fetch(`${apiUrl}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch (e) {
      console.error('Failed to sync maintenance settings to backend:', e);
    }
  };
  
  const persistedState = getActiveTask();
  const [executionTask, setExecutionTask] = useState<Task | AdTask | null>(persistedState?.task || null);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(persistedState?.startTime || null);
  const [strikesBeforeTask, setStrikesBeforeTask] = useState<number | null>(null);
  
  const [isPaused, setIsPaused] = useState(false);
  const [liveRank, setLiveRank] = useState<number | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null); // null = unknown, true = connected, false = failed
  const [isSecurityBlocked, setIsSecurityBlocked] = useState(false);
  const initialFetchDone = useRef(false);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    TelegramService.init();
  }, []);
  const [securityError, setSecurityError] = useState('');
  
  // Real-time synchronization: Initialize User from Telegram Data
  const currentUser = useMemo(() => {
    const tgUser = TelegramService.getUser();
    if (!tgUser || !tgUser.id) {
      // Return a stable mock user for preview if TG user is missing
      return users[0] || {
        id: 12345678,
        username: 'PreviewUser',
        balanceRiyal: 100,
        balanceCrypto: 10,
        totalEarningsRiyal: 50,
        referrals: 0,
        isBanned: false,
        role: 'admin',
        warningCount: 0,
        isVerified: true,
        isFlagged: false,
        flagReason: ''
      } as User;
    }
    
    const localUser = users.find(u => u.id === tgUser.id);
    if (localUser) return localUser;
    
    // Fallback if not found locally, create a temp one
    return {
        id: tgUser.id,
        username: tgUser.username || `user_${tgUser.id}`,
        balanceRiyal: 0,
        balanceCrypto: 0,
        totalEarningsRiyal: 0,
        referrals: 0,
        isBanned: false,
        role: tgUser.id === ADMIN_TELEGRAM_ID ? 'admin' : 'user',
        warningCount: 0,
        isVerified: false,
        isFlagged: false,
        flagReason: ''
    } as User;
  }, [users]);

  const isSuperAdmin = useMemo(() => currentUser.id === 929198867, [currentUser.id]);
  const isPreviewMode = useMemo(() => {
    const tgUser = TelegramService.getUser();
    return !tgUser || !tgUser.id || tgUser.id === 12345678 || tgUser.id === 0 || tgUser.id === 'demo_id';
  }, [currentUser.id]);
  const isAdmin = useMemo(() => isSuperAdmin || isPreviewMode, [isSuperAdmin, isPreviewMode]);

  // Leaderboard Logic
  const leaderboard = useMemo(() => {
    if (liveLeaderboard.length > 0) return liveLeaderboard;
    return [...users]
      .sort((a, b) => b.totalEarningsRiyal - a.totalEarningsRiyal)
      .slice(0, 10);
  }, [users, liveLeaderboard]);

  const userRank = useMemo(() => {
    const sorted = [...users].sort((a, b) => b.totalEarningsRiyal - a.totalEarningsRiyal);
    return sorted.findIndex(u => u.id === currentUser.id) + 1;
  }, [users, currentUser.id]);

  // Fetch live user stats from the backend API
  const syncSecurity = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const deviceId = await SecurityService.generateFingerprint();
      const ip = await SecurityService.getIpAddress();
      
      await fetchWithTimeout(`${apiUrl}/api/sync_security`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          username: currentUser.username,
          device_id: deviceId,
          ip: ip
        })
      }, 3000);
      
      // Silent sync - we don't block here anymore as per new requirement
      // Detection happens at payout
    } catch (e) {
      console.warn('Security sync failed (likely backend starting):', e);
    }
  };

  const fetchLiveStats = async (silent = false) => {
    if (!currentUser?.id || isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (!silent) setIsSyncing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Fetch user stats
      const response = await fetchWithTimeout(`${apiUrl}/api/user_stats/${currentUser.id}`, {}, 4000);
      if (response.ok) {
        setIsBackendConnected(true);
        const rawData = await response.json();
        const data = {
          balance_sar: 0,
          balance_usdt: 0,
          total_earnings_sar: 0,
          rank: 0,
          is_flagged: false,
          flag_reason: "",
          device_id: "",
          ...rawData
        };
        
        setLiveRank(data.rank);
        
        setUsers(prevUsers => {
          let userExists = false;
          const updatedUsers = prevUsers.map(u => {
            if (u.id === currentUser.id) {
              userExists = true;
              return {
                ...u,
                balanceRiyal: data.balance_sar,
                balanceCrypto: data.balance_usdt,
                totalEarningsRiyal: data.total_earnings_sar,
                isFlagged: data.is_flagged,
                flagReason: data.flag_reason,
                deviceId: data.device_id
              };
            }
            return u;
          });
          
          if (!userExists) {
            updatedUsers.push({
              ...currentUser,
              balanceRiyal: data.balance_sar,
              balanceCrypto: data.balance_usdt,
              totalEarningsRiyal: data.total_earnings_sar,
              isFlagged: data.is_flagged,
              flagReason: data.flag_reason,
              deviceId: data.device_id
            });
          }
          
          saveUsers(updatedUsers);
          return updatedUsers;
        });
      }

      // Fetch leaderboard
      const lbResponse = await fetchWithTimeout(`${apiUrl}/api/leaderboard`, {}, 4000);
      if (lbResponse.ok) {
        const lbData = await lbResponse.json();
        setLiveLeaderboard(lbData);
      }

      // Fetch Tasks
      const tasksRes = await fetchWithTimeout(`${apiUrl}/api/tasks`, {}, 4000);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
        saveTasks(tasksData);
      }

      // Fetch Ad Tasks
      const adTasksRes = await fetchWithTimeout(`${apiUrl}/api/ad_tasks`, {}, 4000);
      if (adTasksRes.ok) {
        const adTasksData = await adTasksRes.json();
        setAdTasks(adTasksData);
        saveAdTasks(adTasksData);
      }

      // Fetch Maintenance
      const maintRes = await fetchWithTimeout(`${apiUrl}/api/maintenance`, {}, 4000);
      if (maintRes.ok) {
        const maintData = await maintRes.json();
        if (maintData && Object.keys(maintData).length > 0) {
          setMaintenance(prev => ({ ...prev, ...maintData }));
        }
      }

      // Fetch Withdrawals
      const withdrawalsRes = await fetchWithTimeout(
        isAdmin 
          ? `${apiUrl}/api/admin/withdrawals?admin_id=${currentUser.id}` 
          : `${apiUrl}/api/user/withdrawals/${currentUser.id}`, 
        {}, 4000
      );
      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json();
        // Map backend fields to frontend types if needed
        const mappedWithdrawals = withdrawalsData.map((w: any) => ({
          id: w._id,
          userId: w.userId,
          amount: w.amount,
          currency: w.currency === 'SAR' ? 'Riyal' : 'Crypto',
          method: w.method,
          address: w.address,
          status: w.status,
          createdAt: w.createdAt,
          processedAt: w.processedAt
        }));
        setWithdrawals(mappedWithdrawals);
        saveWithdrawals(mappedWithdrawals);
      }

    } catch (error) {
      console.warn('Live stats sync failed (backend may be busy or unreachable):', error);
      setIsBackendConnected(false);
    } finally {
      isSyncingRef.current = false;
      if (!silent) {
        // Keep the syncing state visible for at least 1s for UX
        setTimeout(() => setIsSyncing(false), 1000);
      }
    }
  };

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    syncSecurity();
    fetchLiveStats(true);
    
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchLiveStats(true);
      }
    }, 60000); // Poll every 60s instead of 30s to reduce load
    
    return () => clearInterval(intervalId);
  }, [currentUser.id]);

  // Only refresh on tab change if it's not admin and we haven't synced in a while
  const lastSyncTime = useRef(Date.now());
  useEffect(() => {
    const now = Date.now();
    if (currentTab !== 'admin' && (now - lastSyncTime.current > 10000)) {
      fetchLiveStats(true);
      lastSyncTime.current = now;
    }
  }, [currentTab]);

  useEffect(() => {
    const detectLocation = async () => {
      if (currentUser.country && currentUser.preferredCurrency) return;
      try {
        const response = await fetchWithTimeout('https://ipapi.co/json/');
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (data && data.country_name) {
          const detectedCountry = data.country_name;
          const detectedCurrency = CURRENCY_MAPPING[detectedCountry] || 'USD';
          setUsers(prevUsers => {
            const userExists = prevUsers.some(u => u.id === currentUser.id);
            let updated;
            if (userExists) {
              updated = prevUsers.map(u => u.id === currentUser.id ? { ...u, country: detectedCountry, preferredCurrency: u.preferredCurrency || detectedCurrency } : u);
            } else {
              updated = [...prevUsers, { ...currentUser, country: detectedCountry, preferredCurrency: detectedCurrency }];
            }
            saveUsers(updated);
            return updated;
          });
        } else {
          throw new Error();
        }
      } catch (error) { 
        // Fallback to International/USD
        setUsers(prevUsers => {
          const userExists = prevUsers.some(u => u.id === currentUser.id);
          let updated;
          if (userExists) {
            updated = prevUsers.map(u => u.id === currentUser.id ? { ...u, country: 'International', preferredCurrency: u.preferredCurrency || 'USD' } : u);
          } else {
            updated = [...prevUsers, { ...currentUser, country: 'International', preferredCurrency: 'USD' }];
          }
          saveUsers(updated);
          return updated;
        });
      }
    };
    detectLocation();
  }, [currentUser.id]);

  useEffect(() => {
    saveActiveTask(executionTask, executionStartTime);
  }, [executionTask, executionStartTime]);

  useEffect(() => {
    if (currentTab === 'admin' && !isAdmin && !isPreviewMode) {
      setCurrentTab('home');
    }
  }, [currentTab, isAdmin, isPreviewMode]);

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

  const handleStartBoost = (url: string, time: number) => {
    const boostTask: AdTask = {
      id: 'boost-' + Date.now(),
      title: 'Quick Earnings Boost',
      url: url || maintenance.boostAdLink,
      rewardRiyal: maintenance.boostRewardRiyal,
      rewardCrypto: maintenance.boostRewardRiyal / 10,
      durationSeconds: time || maintenance.boostDuration || 15,
    };
    handleStartExecution(boostTask);
  };

  const handleClaimExecution = async () => {
    if (!currentUser?.id || !executionTask || !executionStartTime) return;
    const isBoostTask = executionTask.id.startsWith('boost-');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetchWithTimeout(`${apiUrl}/api/update_balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          amount: executionTask.rewardRiyal,
          task_name: `${isBoostTask ? 'Boost' : 'Task'}: ${executionTask.title}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedUsers = users.map((u) => u.id === currentUser.id ? {
          ...u,
          balanceRiyal: data.balanceRiyal,
          balanceCrypto: data.balanceCrypto,
          totalEarningsRiyal: data.totalEarningsRiyal,
          lastBoostClaim: isBoostTask ? new Date().toISOString() : u.lastBoostClaim
        } : u);
        setUsers(updatedUsers);
        saveUsers(updatedUsers);
      }
    } catch (error) {
      console.error('Failed to update balance on server:', error);
      // Fallback to local update if server fails
      const updatedUsers = users.map((u) => u.id === currentUser.id ? {
        ...u,
        balanceRiyal: u.balanceRiyal + executionTask.rewardRiyal,
        balanceCrypto: u.balanceCrypto + (executionTask.rewardCrypto || 0),
        totalEarningsRiyal: u.totalEarningsRiyal + executionTask.rewardRiyal,
        lastBoostClaim: isBoostTask ? new Date().toISOString() : u.lastBoostClaim
      } : u);
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
    }

    addTransaction(currentUser.id, executionTask.rewardRiyal, 'SAR', 'EARNING', `${isBoostTask ? 'Boost' : 'Task'}: ${executionTask.title}`);

    setExecutionTask(null);
    setExecutionStartTime(null);
    setStrikesBeforeTask(null);
    TelegramService.showAlert('Reward claimed successfully!');
  };

  const handleCancelExecution = () => {
    if (currentUser?.id && strikesBeforeTask !== null) {
      const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, warningCount: strikesBeforeTask, isBanned: strikesBeforeTask >= 3 } : u);
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
    }
    setExecutionTask(null);
    setExecutionStartTime(null);
    setStrikesBeforeTask(null);
    setIsPaused(false);
    // Ensure we return to a valid tab
    if (currentTab === 'admin') {
      setCurrentTab('home');
    }
    // Clear console errors from session if possible
    console.clear();
  };

  const handleClaimBonus = async () => {
    if (!currentUser?.id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetchWithTimeout(`${apiUrl}/api/daily_bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          initData: TelegramService.getInitData()
        })
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to claim bonus');
      }

      if (data.success) {
        const updatedUser = data.user;
        setUsers(prevUsers => {
          const updated = prevUsers.map((u) => u.id === currentUser.id ? { 
            ...u, 
            balanceRiyal: updatedUser.balanceRiyal, 
            totalEarningsRiyal: updatedUser.totalEarningsRiyal, 
            dailyBonusLastClaim: updatedUser.dailyBonusLastClaim 
          } : u);
          saveUsers(updated);
          return updated;
        });
        addTransaction(currentUser.id, 1, 'SAR', 'EARNING', 'Daily Bonus');
        TelegramService.showAlert(data.message || 'Daily Bonus Claimed! +1.00 SAR');
      }
    } catch (error: any) {
      console.error('Failed to claim bonus on server:', error);
      
      // Fallback for preview mode if backend is unreachable
      if (isPreviewMode && (error.message === 'Failed to fetch' || error.name === 'TypeError')) {
        // Simulate success locally for preview stability
        const now = new Date().toISOString();
        setUsers(prevUsers => {
          const updated = prevUsers.map((u) => u.id === currentUser.id ? { 
            ...u, 
            balanceRiyal: u.balanceRiyal + 1, 
            totalEarningsRiyal: u.totalEarningsRiyal + 1, 
            dailyBonusLastClaim: now
          } : u);
          saveUsers(updated);
          return updated;
        });
        addTransaction(currentUser.id, 1, 'SAR', 'EARNING', 'Daily Bonus (Mock)');
        TelegramService.showAlert('Preview Mode: Daily Bonus Claimed! +1 SAR');
        return;
      }
      
      throw error; // Let Home.tsx handle the error message
    }
  };

  const handleWithdrawRequest = async (data: any) => {
    if (!currentUser?.id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          amount: data.amount,
          method: data.method,
          address: data.address,
          currency: data.currency === 'Riyal' ? 'SAR' : 'USDT'
        })
      });

      const result = await res.json();
      if (res.ok) {
        TelegramService.showAlert(result.message || 'Withdrawal requested successfully!');
        fetchLiveStats(); // Refresh balance and stats
        
        // Update local state for immediate feedback
        const newWithdrawal: WithdrawalRequest = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          amount: data.amount, currency: data.currency,
          localCurrency: data.localCurrency, localAmount: data.localAmount,
          country: currentUser.country, method: data.method, address: data.address,
          status: 'PENDING', createdAt: new Date().toISOString()
        };
        setWithdrawals([newWithdrawal, ...withdrawals]);
        saveWithdrawals([newWithdrawal, ...withdrawals]);
        
        addTransaction(currentUser.id, data.amount, data.currency === 'Riyal' ? 'SAR' : 'USDT', 'WITHDRAWAL', `Payout: ${data.method}`);
      } else {
        TelegramService.showAlert(result.message || 'Failed to request withdrawal.');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      TelegramService.showAlert('Network error. Please try again.');
    }
  };

  const handleAdminAction = async (id: string, type: 'submission' | 'withdrawal', status: any) => {
    if (!isAdmin || !currentUser?.id) return;
    
    if (type === 'withdrawal') {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const action = status === 'COMPLETED' ? 'approve' : 'reject';
        
        const res = await fetch(`${apiUrl}/api/admin/process_withdrawal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_id: currentUser.id,
            withdrawal_id: id,
            action: action
          })
        });

        if (res.ok) {
          TelegramService.showAlert(`Withdrawal ${action}d!`);
          // Update local state
          const updatedWithdrawals = withdrawals.map(w => w.id === id ? { ...w, status } : w);
          setWithdrawals(updatedWithdrawals);
          saveWithdrawals(updatedWithdrawals);
          fetchLiveStats(); // Refresh user balances
        } else {
          const data = await res.json();
          TelegramService.showAlert(data.message || 'Action failed');
        }
      } catch (err) {
        console.error('Admin action error:', err);
        TelegramService.showAlert('Network error');
      }
      return;
    }
    
    // Original logic for submissions if needed
    if (type === 'submission') {
      // ... existing submission logic if any ...
    }
  };

  const handleUpdateUserBalance = (userId: number, amount: number, currency: 'SAR' | 'USDT') => {
    if (!isAdmin) return;
    setUsers(prevUsers => {
      const updated = prevUsers.map(u => u.id === userId ? { ...u, balanceRiyal: currency === 'SAR' ? u.balanceRiyal + amount : u.balanceRiyal, balanceCrypto: currency === 'USDT' ? u.balanceCrypto + amount : u.balanceCrypto } : u);
      saveUsers(updated);
      return updated;
    });
  };

  const handleViolation = () => {
    if (!currentUser?.id) return;
    setIsPaused(true);
    setUsers(prevUsers => {
      const updated = prevUsers.map((u) => {
        if (u.id === currentUser.id) {
          const warningCount = u.warningCount + 1;
          return { ...u, warningCount, isBanned: warningCount >= 3 };
        }
        return u;
      });
      saveUsers(updated);
      return updated;
    });
    TelegramService.showAlert('Violation strike added!');
  };

  const handleAddTask = async (task: Task, cost?: number, currency?: 'SAR' | 'USDT') => {
    if (!currentUser?.id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      if (cost !== undefined && currency !== undefined) {
        // 1. Deduct Balance
        const balanceRes = await fetchWithTimeout(`${apiUrl}/api/update_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            amount: -cost,
            currency: currency === 'SAR' ? 'SAR' : 'USDT',
            type: 'AD_PROMOTION',
            description: `Campaign: ${task.title}`
          })
        });

        if (!balanceRes.ok) throw new Error('Balance deduction failed');
      }

      // 2. Add Task
      const res = await fetchWithTimeout(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      
      if (res.ok) {
        setTasks(prev => {
          const updated = [...prev, task];
          saveTasks(updated);
          return updated;
        });
        if (cost !== undefined) fetchLiveStats(); // Refresh balance
      }
    } catch (e) {
      console.error('Failed to add task:', e);
      if (cost !== undefined) TelegramService.showAlert('Failed to launch campaign. Please check balance.');
    }
  };

  const handleAddAdTask = async (ad: AdTask, cost?: number, currency?: 'SAR' | 'USDT') => {
    if (!currentUser?.id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      if (cost !== undefined && currency !== undefined) {
        // 1. Deduct Balance
        const balanceRes = await fetchWithTimeout(`${apiUrl}/api/update_balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            amount: -cost,
            currency: currency === 'SAR' ? 'SAR' : 'USDT',
            type: 'AD_PROMOTION',
            description: `Campaign: ${ad.title}`
          })
        });

        if (!balanceRes.ok) throw new Error('Balance deduction failed');
      }

      // 2. Add Ad Task
      const res = await fetchWithTimeout(`${apiUrl}/api/ad_tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ad)
      });
      
      if (res.ok) {
        setAdTasks(prev => {
          const updated = [...prev, ad];
          saveAdTasks(updated);
          return updated;
        });
        if (cost !== undefined) fetchLiveStats(); // Refresh balance
      }
    } catch (e) {
      console.error('Failed to add ad task:', e);
      if (cost !== undefined) TelegramService.showAlert('Failed to launch campaign. Please check balance.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!currentUser?.id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetchWithTimeout(`${apiUrl}/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updated = tasks.filter(t => t.id !== id);
        setTasks(updated);
        saveTasks(updated);
      }
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  const handleApproveTask = async (taskId: string, isVideo: boolean) => {
    if (!currentUser?.id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = isVideo ? 'tasks' : 'ad_tasks';
      const res = await fetch(`${apiUrl}/api/${endpoint}/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });

      if (res.ok) {
        if (isVideo) {
          setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'active' } : t));
        } else {
          setAdTasks(adTasks.map(a => a.id === taskId ? { ...a, status: 'active' } : a));
        }
        TelegramService.showAlert('Task approved and launched!');
      }
    } catch (e) {
      console.error('Approval failed:', e);
    }
  };

  const handleRejectTask = async (taskId: string, isVideo: boolean) => {
    if (!currentUser?.id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const task = isVideo ? tasks.find(t => t.id === taskId) : adTasks.find(a => a.id === taskId);
      if (!task) return;

      // 1. Refund logic (Optional but recommended by user)
      // We need to calculate the cost. In a real app, we'd store the original cost or recalculate.
      // For simplicity, let's assume we can recalculate or just refund based on reward + profit.
      const ADMIN_PROFIT_PER_VIEW_SAR = 0.05;
      const costPerView = task.rewardRiyal + ADMIN_PROFIT_PER_VIEW_SAR;
      const totalRefund = (task.budget || 0) * costPerView;

      const refundRes = await fetch(`${apiUrl}/api/update_balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: task.ownerId,
          amount: totalRefund,
          currency: 'SAR',
          type: 'EARNING',
          description: `Refund: Rejected Campaign (${task.title})`
        })
      });

      if (!refundRes.ok) throw new Error('Refund failed');

      // 2. Delete or mark as rejected
      const endpoint = isVideo ? 'tasks' : 'ad_tasks';
      const res = await fetch(`${apiUrl}/api/${endpoint}/${taskId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        if (isVideo) {
          setTasks(tasks.filter(t => t.id !== taskId));
        } else {
          setAdTasks(adTasks.filter(a => a.id !== taskId));
        }
        fetchLiveStats(); // Refresh balance for creator if they are current user
        TelegramService.showAlert('Task rejected and user refunded.');
      }
    } catch (e) {
      console.error('Rejection failed:', e);
    }
  };

  const handleDeleteAdTask = async (id: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetchWithTimeout(`${apiUrl}/api/ad_tasks/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updated = adTasks.filter(a => a.id !== id);
        setAdTasks(updated);
        saveAdTasks(updated);
      }
    } catch (e) {
      console.error('Failed to delete ad task:', e);
    }
  };

  const handleResetDevice = async (userId: number) => {
    if (!currentUser?.id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetchWithTimeout(`${apiUrl}/api/admin/reset_device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          admin_id: currentUser.id,
          user_id: userId 
        })
      });
      if (res.ok) {
        setUsers(prevUsers => {
          const updated = prevUsers.map(u => u.id === userId ? { ...u, deviceId: undefined, isFlagged: false, flagReason: '' } : u);
          saveUsers(updated);
          return updated;
        });
        TelegramService.showAlert('Device ID reset successfully!');
      }
    } catch (e) {
      console.error('Reset device failed:', e);
    }
  };

  // Removed redundant isSuperAdmin definition as it's now at the top

  if (currentUser.isBanned) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-10 text-center font-bold text-red-500 uppercase tracking-widest">Account Banned</div>;
  if (isSecurityBlocked) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center space-y-6">
      <div className="text-6xl">❌</div>
      <h2 className="text-2xl font-black uppercase text-red-500">Multiple Accounts Detected</h2>
      <p className="text-slate-400 text-sm leading-relaxed">
        To prevent fraud, you can only use one Telegram account per device on this platform.
      </p>
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 w-full">
        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Security Details</p>
        <p className="text-[10px] text-slate-400 font-mono break-all">{securityError}</p>
      </div>
    </div>
  );
  if (!currentUser.isVerified && !isAdmin && !isSuperAdmin) return (
    <>
      <Verification 
        channels={maintenance.verificationChannels || []} 
        onVerify={() => {
          setUsers(prevUsers => {
            const userExists = prevUsers.some(u => u.id === currentUser.id);
            let updated;
            if (userExists) {
              updated = prevUsers.map(u => u.id === currentUser.id ? {...u, isVerified: true} : u);
            } else {
              updated = [...prevUsers, {...currentUser, isVerified: true}];
            }
            saveUsers(updated);
            return updated;
          });
        }} 
      />
    </>
  );

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto relative bg-slate-900 shadow-2xl overflow-x-hidden pt-12">
      <BannerAd id="header-ad-container" script={maintenance.headerAdScript} />
      
      {executionTask && <ActiveTask task={executionTask} onClaim={handleClaimExecution} onCancel={handleCancelExecution} isPaused={isPaused} onFocusSignal={(lost) => lost ? handleViolation() : setIsPaused(false)} />}
      
      {currentTab === 'home' && (
        <ErrorBoundary>
          <Home user={currentUser} onClaimBonus={handleClaimBonus} leaderboard={leaderboard} userRank={liveRank ?? userRank} onStartBoost={handleStartBoost} isSyncing={isSyncing} onRefresh={() => fetchLiveStats()} currencyInfo={currencyInfo} maintenanceSettings={maintenance} />
        </ErrorBoundary>
      )}
      {currentTab === 'tasks' && <TasksHub user={currentUser} tasks={tasks} adTasks={adTasks} submissions={submissions} adViews={adViews} onStartTask={handleStartExecution} onStartAd={handleStartExecution} onAddTask={handleAddTask} onAddAdTask={handleAddAdTask} isMaintenanceVideos={maintenance.videoTasks && !isAdmin} isMaintenanceAds={maintenance.adTasks && !isAdmin} isMaintenancePromote={maintenance.promote && !isAdmin} onGoToDeposit={() => setCurrentTab('wallet')} isSyncing={isSyncing} />}
      {currentTab === 'wallet' && <Wallet user={currentUser} withdrawals={withdrawals} transactions={transactions} onWithdraw={handleWithdrawRequest} isMaintenance={maintenance.wallet && !isAdmin} onUpdatePreference={(p) => setUsers(users.map(u => u.id === currentUser.id ? {...u, ...p} : u))} maintenanceSettings={maintenance} currencyInfo={currencyInfo} />}
      {currentTab === 'profile' && <Profile user={currentUser} maintenanceSettings={maintenance} onNavigate={setCurrentTab} />}
      {currentTab === 'admin' && (isSuperAdmin || isPreviewMode) && <Admin submissions={submissions} withdrawals={withdrawals} tasks={tasks} adTasks={adTasks} users={users} currentUser={currentUser} maintenanceSettings={maintenance} onUpdateMaintenance={handleUpdateMaintenance} onAction={handleAdminAction} onAddTask={handleAddTask} onAddAdTask={handleAddAdTask} onDeleteTask={handleDeleteTask} onDeleteAdTask={handleDeleteAdTask} onUnban={(uid) => setUsers(users.map(u => u.id === uid ? { ...u, isBanned: false, warningCount: 0 } : u))} onUpdateBalance={handleUpdateUserBalance} onResetLeaderboard={() => setUsers(users.map(u => ({...u, totalEarningsRiyal: 0})))} onApproveTask={handleApproveTask} onRejectTask={handleRejectTask} onResetDevice={handleResetDevice} />}
      
      <BannerAd id="footer-ad-container" script={maintenance.footerAdScript} />
      
      {!executionTask && <Navigation currentTab={currentTab} setTab={setCurrentTab} isAdmin={isSuperAdmin || isPreviewMode} />}
    </div>
  );
};

export default App;
