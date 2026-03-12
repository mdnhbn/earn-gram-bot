
import { User, Task, AdTask, AdView, TaskSubmission, TaskStatus, WithdrawalRequest, MaintenanceSettings, Transaction } from './types';

// GLOBAL CONFIGURATION
export const ADMIN_TELEGRAM_ID = 929198867; // Replace with your actual Telegram User ID

// Initial Mock Data
const DEFAULT_TASKS: Task[] = [];

const DEFAULT_AD_TASKS: AdTask[] = [];

export const MOCK_USER: User = {
  id: 0,
  username: 'Guest',
  fullName: 'Guest User',
  balanceRiyal: 0,
  balanceCrypto: 0,
  totalEarningsRiyal: 0,
  referrals: 0,
  role: 'user',
  isBanned: false,
  warningCount: 0,
  isVerified: false
};

const LEADERBOARD_USERS: User[] = [];

export const isUserAdmin = (userId: number | undefined | string): boolean => {
  return userId === ADMIN_TELEGRAM_ID;
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem('earngram_users');
  if (!data) return [];
  return JSON.parse(data);
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem('earngram_users', JSON.stringify(users));
};

export const getCurrentUser = (): User => {
  const users = getUsers();
  return users[0] || MOCK_USER;
};

export const getTasks = (): Task[] => {
  const data = localStorage.getItem('earngram_tasks');
  return data ? JSON.parse(data) : DEFAULT_TASKS;
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem('earngram_tasks', JSON.stringify(tasks));
};

export const getAdTasks = (): AdTask[] => {
  const data = localStorage.getItem('earngram_ad_tasks');
  return data ? JSON.parse(data) : DEFAULT_AD_TASKS;
};

export const saveAdTasks = (tasks: AdTask[]) => {
  localStorage.setItem('earngram_ad_tasks', JSON.stringify(tasks));
};

export const getAdViews = (): AdView[] => {
  const data = localStorage.getItem('earngram_ad_views');
  const views: AdView[] = data ? JSON.parse(data) : [];
  const now = new Date().getTime();
  const validViews = views.filter(v => (now - new Date(v.viewedAt).getTime()) < 24 * 60 * 60 * 1000);
  if (validViews.length !== views.length) saveAdViews(validViews);
  return validViews;
};

export const saveAdViews = (views: AdView[]) => {
  localStorage.setItem('earngram_ad_views', JSON.stringify(views));
};

export const getSubmissions = (): TaskSubmission[] => {
  const data = localStorage.getItem('submissions');
  return data ? JSON.parse(data) : [];
};

export const saveSubmissions = (subs: TaskSubmission[]) => {
  localStorage.setItem('submissions', JSON.stringify(subs));
};

export const getWithdrawals = (): WithdrawalRequest[] => {
  const data = localStorage.getItem('withdrawals');
  return data ? JSON.parse(data) : [];
};

export const saveWithdrawals = (requests: WithdrawalRequest[]) => {
  localStorage.setItem('withdrawals', JSON.stringify(requests));
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem('earngram_transactions');
  return data ? JSON.parse(data) : [];
};

export const saveTransactions = (txs: Transaction[]) => {
  localStorage.setItem('earngram_transactions', JSON.stringify(txs));
};

export const saveActiveTask = (task: any, startTime: number | null) => {
  if (!task) {
    localStorage.removeItem('earngram_active_task');
    return;
  }
  localStorage.setItem('earngram_active_task', JSON.stringify({ task, startTime }));
};

export const getActiveTask = () => {
  const data = localStorage.getItem('earngram_active_task');
  return data ? JSON.parse(data) : null;
};

export const getMaintenanceSettings = (): MaintenanceSettings => {
  const data = localStorage.getItem('earngram_maintenance_settings');
  return data ? JSON.parse(data) : {
    global: false,
    videoTasks: false,
    adTasks: false,
    promote: false,
    wallet: false,
    verificationChannels: ['@EarnGramNews', '@EarnGramSupport', '@EarnGramCrypto', '@EarnGramGlobal', '@EarnGramCommunity'],
    paymentDetails: {
      cryptoAddress: '',
      bankInfo: '',
      supportUsername: '',
      apiKey: '',
      apiSecret: '',
      gatewayUrl: ''
    },
    boostAdLink: '',
    boostRewardRiyal: 0.0,
    boostDuration: 15,
    headerAdScript: '',
    footerAdScript: '',
    supportLink: '',
    tosContent: 'Welcome to EarnGram! Please follow the rules.',
    reportLink: '',
    depositInstructions: 'Contact support for deposit instructions.',
    localPayConfig: {},
    minWithdraw: 10,
    maxWithdraw: 1000,
    minDeposit: 5,
    maxDeposit: 5000,
    season: 2,
    dailyBonusAmount: 1.0
  };
};

export const saveMaintenanceSettings = (settings: MaintenanceSettings) => {
  localStorage.setItem('earngram_maintenance_settings', JSON.stringify(settings));
};
