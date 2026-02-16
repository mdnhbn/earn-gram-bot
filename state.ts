
import { User, Task, AdTask, AdView, TaskSubmission, TaskStatus, WithdrawalRequest, MaintenanceSettings, Transaction } from './types';

// GLOBAL CONFIGURATION
export const ADMIN_TELEGRAM_ID = 12345678; // Replace with your actual Telegram User ID

// Initial Mock Data
const DEFAULT_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Watch New Tech Review',
    platform: 'YouTube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    rewardRiyal: 10,
    rewardCrypto: 0.0005,
    timerSeconds: 15
  },
  {
    id: 't2',
    title: 'Crypto Market Update',
    platform: 'TikTok',
    url: 'https://www.tiktok.com/@tiktok/video/7106364024467328261',
    rewardRiyal: 5,
    rewardCrypto: 0.0002,
    timerSeconds: 10
  }
];

const DEFAULT_AD_TASKS: AdTask[] = [
  {
    id: 'ad1',
    title: 'Visit Partner Site',
    url: 'https://example.com/ad1',
    rewardRiyal: 0.5,
    rewardCrypto: 0.00001,
    durationSeconds: 10
  },
  {
    id: 'ad2',
    title: 'Explore New Game',
    url: 'https://example.com/ad2',
    rewardRiyal: 0.8,
    rewardCrypto: 0.00002,
    durationSeconds: 15
  }
];

export const MOCK_USER: User = {
  id: 12345678,
  username: 'DemoUser',
  balanceRiyal: 150.50,
  balanceCrypto: 0.00245,
  totalEarningsRiyal: 450.75,
  referrals: 12,
  role: 'admin',
  isBanned: false,
  warningCount: 0,
  isVerified: false
};

const LEADERBOARD_USERS: User[] = [
  { id: 98765432, username: 'TopG_98', balanceRiyal: 1200, balanceCrypto: 0.5, totalEarningsRiyal: 2500, referrals: 150, isBanned: false, role: 'user', warningCount: 0, isVerified: true },
  { id: 11223344, username: 'EarnMaster', balanceRiyal: 850, balanceCrypto: 0.2, totalEarningsRiyal: 1800, referrals: 89, isBanned: false, role: 'user', warningCount: 0, isVerified: true },
  { id: 55667788, username: 'CryptoKing', balanceRiyal: 400, balanceCrypto: 1.2, totalEarningsRiyal: 1650, referrals: 45, isBanned: false, role: 'user', warningCount: 0, isVerified: true },
  { id: 99887766, username: 'RiyalRich', balanceRiyal: 750, balanceCrypto: 0.1, totalEarningsRiyal: 1400, referrals: 30, isBanned: false, role: 'user', warningCount: 0, isVerified: true },
  { id: 44332211, username: 'TaskPro', balanceRiyal: 300, balanceCrypto: 0.05, totalEarningsRiyal: 1100, referrals: 25, isBanned: false, role: 'user', warningCount: 0, isVerified: true },
  { id: 77889900, username: 'QuickEarn', balanceRiyal: 150, balanceCrypto: 0.02, totalEarningsRiyal: 950, referrals: 18, isBanned: false, role: 'user', warningCount: 0, isVerified: true },
  { id: 22446688, username: 'DollarZ', balanceRiyal: 90, balanceCrypto: 0.01, totalEarningsRiyal: 800, referrals: 12, isBanned: false, role: 'user', warningCount: 0, isVerified: true },
  { id: 33557799, username: 'BotHunter', balanceRiyal: 45, balanceCrypto: 0.005, totalEarningsRiyal: 650, referrals: 8, isBanned: false, role: 'user', warningCount: 0, isVerified: true },
  { id: 88775544, username: 'StarUser', balanceRiyal: 200, balanceCrypto: 0.03, totalEarningsRiyal: 550, referrals: 5, isBanned: false, role: 'user', warningCount: 0, isVerified: true },
];

export const isUserAdmin = (userId: number): boolean => {
  return userId === ADMIN_TELEGRAM_ID;
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem('earngram_users');
  if (!data) return [MOCK_USER, ...LEADERBOARD_USERS];
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
      cryptoAddress: 'T-Your-TRC20-Address-Here',
      bankInfo: 'Bank: X Bank\nAccount: 123456789\nName: Admin',
      supportUsername: 'YourSupportUsername'
    },
    boostAdLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Functional placeholder
    boostRewardRiyal: 0.05
  };
};

export const saveMaintenanceSettings = (settings: MaintenanceSettings) => {
  localStorage.setItem('earngram_maintenance_settings', JSON.stringify(settings));
};
