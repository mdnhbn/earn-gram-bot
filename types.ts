
export enum TaskStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: number;
  username: string;
  balanceRiyal: number;
  balanceCrypto: number;
  totalEarningsRiyal: number; // Cumulative earnings for leaderboard
  referrals: number;
  invitedBy?: number;
  dailyBonusLastClaim?: string;
  lastBoostClaim?: string; // Track the last time boost earnings were used
  isBanned: boolean;
  role: 'user' | 'admin';
  warningCount: number;
  country?: string;
  preferredCurrency?: string;
  isVerified: boolean;
  deviceId?: string;
  lastIp?: string;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface Transaction {
  id: string;
  userId: number;
  amount: number;
  currency: 'SAR' | 'USDT';
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'EARNING' | 'AD_PROMOTION';
  description: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  platform: 'YouTube' | 'TikTok' | 'Dailymotion' | 'Vimeo' | 'Facebook' | 'Custom';
  url: string;
  rewardRiyal: number;
  rewardCrypto: number;
  timerSeconds: number;
  ownerId?: number;
  budget?: number;
  status?: 'pending_approval' | 'active' | 'rejected';
}

export interface AdTask {
  id: string;
  title: string;
  url: string;
  rewardRiyal: number;
  rewardCrypto: number;
  durationSeconds: number;
  networkName?: string; // For grouping (e.g., Monetag, Adsterra)
  ownerId?: number;
  budget?: number;
  status?: 'pending_approval' | 'active' | 'rejected';
}

export interface AdView {
  userId: number;
  adTaskId: string;
  viewedAt: string;
}

export interface TaskSubmission {
  id: string;
  userId: number;
  taskId: string;
  status: TaskStatus;
  submittedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: number;
  amount: number;
  currency: 'Riyal' | 'Crypto';
  localCurrency?: string;
  localAmount?: number;
  country?: string;
  method: string;
  address: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AdminPaymentDetails {
  cryptoAddress: string;
  bankInfo: string;
  supportUsername: string;
  apiKey?: string;
}

export interface MaintenanceSettings {
  global: boolean;
  videoTasks: boolean;
  adTasks: boolean;
  promote: boolean;
  wallet: boolean;
  verificationChannels: string[];
  paymentDetails: AdminPaymentDetails;
  boostAdLink: string;
  boostRewardRiyal: number;
  boostDuration: number;
  headerAdScript?: string;
  footerAdScript?: string;
  supportLink: string;
  tosContent: string;
  reportLink: string;
  depositInstructions: string;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  label: string;
  rate: number;
}
