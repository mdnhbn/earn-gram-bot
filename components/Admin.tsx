
import React, { useState } from 'react';
import { TaskSubmission, WithdrawalRequest, Task, User, AdTask, MaintenanceSettings } from '../types';
import { TelegramService } from '../services/telegram';
import { isUserAdmin } from '../state';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, CheckCircle, List, Users, Wallet, 
  Send, CreditCard, ScrollText, Shield,
  Zap
} from 'lucide-react';

import { AdminApprovals } from './AdminApprovals';
import { AdminBalances } from './AdminBalances';
import { AdminBroadcast } from './AdminBroadcast';
import { AdminDeposits } from './AdminDeposits';
import { AdminPayouts } from './AdminPayouts';
import { AdminLogs } from './AdminLogs';
import { AdminSystem } from './AdminSystem';
import { AdminTasks } from './AdminTasks';
import { AdminUsers } from './AdminUsers';

interface AdminProps {
  submissions: TaskSubmission[];
  withdrawals: WithdrawalRequest[];
  tasks: Task[];
  adTasks: AdTask[];
  users: User[];
  currentUser: User;
  maintenanceSettings: MaintenanceSettings;
  onUpdateMaintenance: (settings: MaintenanceSettings) => void;
  onAction: (id: string, type: 'submission' | 'withdrawal', status: any) => Promise<void>;
  onAddTask: (task: Task) => void;
  onAddAdTask: (task: AdTask) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteAdTask: (taskId: string) => void;
  onUnban: (userId: number) => void;
  onUpdateBalance: (userId: number, amount: number, currency: 'SAR' | 'USDT', type: 'ADJUSTMENT', description: string) => Promise<void>;
  onResetLeaderboard: () => void;
  onApproveTask: (taskId: string, isVideo: boolean) => Promise<void>;
  onRejectTask: (taskId: string, isVideo: boolean) => Promise<void>;
  onResetDevice: (userId: number) => Promise<void>;
}

const Admin: React.FC<AdminProps> = ({ 
  withdrawals, tasks, adTasks, users, currentUser, 
  maintenanceSettings, onUpdateMaintenance, onAction, 
  onAddTask, onAddAdTask, onDeleteTask, onDeleteAdTask, 
  onUnban, onUpdateBalance, onResetLeaderboard, 
  onApproveTask, onRejectTask, onResetDevice 
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'system' | 'payouts' | 'messaging' | 'balances' | 'tasks' | 'approvals' | 'users' | 'deposits' | 'logs'>('system');
  const [searchUserId, setSearchUserId] = useState<string>('');

  const isPreviewMode = !currentUser.id || currentUser.id === 12345678 || currentUser.id === 0;
  const isAdmin = isUserAdmin(currentUser.id);
  const isSuperAdmin = currentUser.id === 929198867 || isPreviewMode;

  if (!isAdmin && !isPreviewMode) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 h-[70vh]">
        <Shield className="w-16 h-16 text-red-500 opacity-20" />
        <h2 className="text-2xl font-black uppercase text-red-500">Access Denied</h2>
        <p className="text-slate-400 text-sm">You do not have administrative privileges to access this control panel.</p>
      </div>
    );
  }

  const adminTabs = [
    { id: 'system', label: 'SYSTEM', icon: Settings },
    { id: 'approvals', label: 'APPROVALS', icon: CheckCircle },
    { id: 'tasks', label: 'TASKS', icon: List },
    { id: 'users', label: 'USERS', icon: Users },
    { id: 'balances', label: 'BALANCES', icon: Wallet, super: true },
    { id: 'payouts', label: 'PAYOUTS', icon: CreditCard },
    { id: 'messaging', label: 'BROADCAST', icon: Send },
    { id: 'deposits', label: 'DEPOSITS', icon: Zap, super: true },
    { id: 'local_pay', label: 'LOCAL PAY', icon: CreditCard, super: true }
  ].filter(tab => !tab.super || isSuperAdmin);

  return (
    <div className="space-y-6 pb-20">
      <header className="text-center space-y-2 py-6">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black italic uppercase tracking-[0.1em] text-white"
        >
          ADMIN PANEL
        </motion.h2>
      </header>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-4 gap-2 px-2">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              TelegramService.haptic('light');
              setActiveAdminTab(tab.id as any);
              if (tab.id !== 'balances') setSearchUserId('');
            }}
            className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg transition-all duration-300 border ${
              activeAdminTab === tab.id
                ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-lg shadow-blue-500/20'
                : 'bg-[#1e293b]/40 backdrop-blur-md border-[#334155]/50 text-[#64748b] hover:text-[#94a3b8]'
            }`}
          >
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeAdminTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="px-1"
        >
          {activeAdminTab === 'system' && (
            <AdminSystem 
              maintenanceSettings={maintenanceSettings}
              onUpdateMaintenance={onUpdateMaintenance}
              onResetLeaderboard={onResetLeaderboard}
              currentUser={currentUser}
            />
          )}

          {activeAdminTab === 'tasks' && (
            <AdminTasks 
              tasks={tasks}
              adTasks={adTasks}
              currentUser={currentUser}
              onAddTask={onAddTask}
              onAddAdTask={onAddAdTask}
              onDeleteTask={onDeleteTask}
              onDeleteAdTask={onDeleteAdTask}
            />
          )}

          {activeAdminTab === 'approvals' && (
            <AdminApprovals 
              tasks={tasks} 
              adTasks={adTasks} 
              users={users} 
              onApprove={onApproveTask} 
              onReject={onRejectTask} 
            />
          )}

          {activeAdminTab === 'payouts' && (
            <AdminPayouts 
              withdrawals={withdrawals} 
              users={users}
              onAction={onAction} 
            />
          )}

          {activeAdminTab === 'balances' && isSuperAdmin && (
            <AdminBalances 
              onUpdateBalance={onUpdateBalance} 
              onResetDevice={onResetDevice} 
              initialSearchId={searchUserId}
            />
          )}

          {activeAdminTab === 'messaging' && (
            <AdminBroadcast 
              onAction={onAction} 
            />
          )}

          {activeAdminTab === 'deposits' && isSuperAdmin && (
            <AdminDeposits 
              onAction={onAction} 
            />
          )}

          {activeAdminTab === 'users' && (
            <AdminUsers 
              users={users}
              onUnban={onUnban}
              onResetDevice={onResetDevice}
              onUpdateBalance={onUpdateBalance}
              onManageUser={(userId) => {
                setSearchUserId(userId.toString());
                setActiveAdminTab('balances');
              }}
            />
          )}

          {activeAdminTab === 'logs' && isSuperAdmin && (
            <AdminLogs />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Admin;
