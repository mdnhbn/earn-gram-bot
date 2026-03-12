
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
import { AdminWithdrawals } from './AdminWithdrawals';
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
    { id: 'system', label: 'System', icon: Settings },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
    { id: 'tasks', label: 'Tasks', icon: List },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'balances', label: 'Balances', icon: Wallet, super: true },
    { id: 'payouts', label: 'Payouts', icon: CreditCard },
    { id: 'messaging', label: 'Broadcast', icon: Send },
    { id: 'deposits', label: 'Deposits', icon: Zap, super: true },
    { id: 'logs', label: 'Logs', icon: ScrollText, super: true }
  ].filter(tab => !tab.super || isSuperAdmin);

  return (
    <div className="space-y-6 pb-20">
      <header className="text-center space-y-2 py-4">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black glow-text tracking-tight"
        >
          CONTROL CENTER
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]"
        >
          System Administration • v2.0
        </motion.p>
      </header>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-3 gap-2 px-1">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              TelegramService.haptic('light');
              setActiveAdminTab(tab.id as any);
            }}
            className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl transition-all duration-300 border ${
              activeAdminTab === tab.id
                ? 'bg-neon-blue border-neon-blue text-midnight shadow-lg shadow-neon-blue/20 scale-[1.02]'
                : 'glass-card border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeAdminTab === tab.id ? 'text-midnight' : 'text-slate-500'}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
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
            <AdminWithdrawals 
              withdrawals={withdrawals} 
              onAction={onAction} 
            />
          )}

          {activeAdminTab === 'balances' && isSuperAdmin && (
            <AdminBalances 
              onUpdateBalance={onUpdateBalance} 
              onResetDevice={onResetDevice} 
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
