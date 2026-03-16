
import React, { useState } from 'react';
import { 
  ChevronDown
} from 'lucide-react';
import { MaintenanceSettings, AdminPaymentDetails } from '../types';
import { TelegramService } from '../services/telegram';
import { motion, AnimatePresence } from 'motion/react';

interface AdminSystemProps {
  maintenanceSettings: MaintenanceSettings;
  onUpdateMaintenance: (settings: MaintenanceSettings) => void;
  onResetLeaderboard: () => void;
  currentUser: any;
}

const countries = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', methods: ['bKash', 'Nagad', 'Rocket'] },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', methods: ['JazzCash', 'EasyPaisa'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', methods: ['UPI', 'Paytm', 'PhonePe'] },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', methods: ['GCash', 'Maya'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', methods: ['OPay', 'PalmPay'] },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', methods: ['OVO', 'Dana', 'GoPay'] },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', methods: ['Touch \'n Go', 'Boost'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', methods: ['Vodafone Cash', 'Orange'] },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', methods: ['STC Pay', 'Madhu'] },
  { code: 'OTHER', name: 'Other (Custom)', flag: '🌐', methods: ['Method 1', 'Method 2', 'Method 3'] },
];

export const AdminSystem: React.FC<AdminSystemProps> = ({ maintenanceSettings, onUpdateMaintenance, onResetLeaderboard, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'ad_config' | 'app_info' | 'payment'>('maintenance');
  const [activePaymentTab, setActivePaymentTab] = useState<'crypto_bank' | 'local_method' | 'limits' | 'auto_gateway'>('crypto_bank');
  
  const [dailyBonus, setDailyBonus] = useState((maintenanceSettings.dailyBonusAmount || 1).toString());
  const [boostForm, setBoostForm] = useState({
    link: maintenanceSettings.boostAdLink || '',
    reward: (maintenanceSettings.boostRewardRiyal || 0.05).toString(),
    duration: (maintenanceSettings.boostDuration || 15).toString()
  });
  
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

  const [paymentForm, setPaymentForm] = useState<AdminPaymentDetails>(maintenanceSettings.paymentDetails);
  const [localPayConfig, setLocalPayConfig] = useState<Record<string, Record<string, string>>>(
    maintenanceSettings.localPayConfig || {}
  );
  const [selectedCountry, setSelectedCountry] = useState<string>('BD');

  const [paymentLimits, setPaymentLimits] = useState({
    minWithdrawSAR: (maintenanceSettings.minWithdrawSAR || 10).toString(),
    maxWithdrawSAR: (maintenanceSettings.maxWithdrawSAR || 1000).toString(),
    minWithdrawUSDT: (maintenanceSettings.minWithdrawUSDT || 5).toString(),
    maxWithdrawUSDT: (maintenanceSettings.maxWithdrawUSDT || 500).toString(),
    minDeposit: (maintenanceSettings.minDeposit || 5).toString(),
    maxDeposit: (maintenanceSettings.maxDeposit || 5000).toString(),
  });

  const [autoGateway, setAutoGateway] = useState({
    apiKey: maintenanceSettings.paymentDetails.apiKey || '',
    apiSecret: maintenanceSettings.paymentDetails.apiSecret || '',
    gatewayUrl: maintenanceSettings.paymentDetails.gatewayUrl || 'https://api.gateway.com',
  });

  const toggleService = (key: keyof MaintenanceSettings) => {
    const updated = { ...maintenanceSettings, [key]: !maintenanceSettings[key] as any };
    onUpdateMaintenance(updated);
    TelegramService.haptic('medium');
  };

  const handleUpdateDailyBonus = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({ ...maintenanceSettings, dailyBonusAmount: parseFloat(dailyBonus) || 1.0 });
    TelegramService.haptic('medium');
    TelegramService.showAlert('Daily bonus updated!');
  };

  const handleUpdateBoostSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({ 
      ...maintenanceSettings, 
      boostAdLink: boostForm.link, 
      boostRewardRiyal: parseFloat(boostForm.reward) || 0.05,
      boostDuration: parseInt(boostForm.duration) || 15
    });
    TelegramService.haptic('medium');
    TelegramService.showAlert('Boost settings updated!');
  };

  const handleUpdateAdScripts = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({ 
      ...maintenanceSettings, 
      headerAdScript: adScripts.header,
      footerAdScript: adScripts.footer
    });
    TelegramService.haptic('medium');
    TelegramService.showAlert('Ad scripts updated!');
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
    TelegramService.haptic('medium');
    TelegramService.showAlert('System links updated!');
  };

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({
      ...maintenanceSettings,
      paymentDetails: {
        ...maintenanceSettings.paymentDetails,
        cryptoAddress: paymentForm.cryptoAddress,
        bankInfo: paymentForm.bankInfo
      },
      depositInstructions: systemLinks.instructions
    });
    TelegramService.haptic('medium');
    TelegramService.showAlert('Payment settings saved!');
  };

  const handleSaveLocalPayConfig = () => {
    onUpdateMaintenance({
      ...maintenanceSettings,
      localPayConfig: localPayConfig
    });
    TelegramService.haptic('medium');
    TelegramService.showAlert('Local pay configuration saved!');
  };

  const handleSavePaymentLimits = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({
      ...maintenanceSettings,
      minWithdrawSAR: parseFloat(paymentLimits.minWithdrawSAR) || 0,
      maxWithdrawSAR: parseFloat(paymentLimits.maxWithdrawSAR) || 0,
      minWithdrawUSDT: parseFloat(paymentLimits.minWithdrawUSDT) || 0,
      maxWithdrawUSDT: parseFloat(paymentLimits.maxWithdrawUSDT) || 0,
      minDeposit: parseFloat(paymentLimits.minDeposit) || 0,
      maxDeposit: parseFloat(paymentLimits.maxDeposit) || 0
    });
    TelegramService.haptic('medium');
    TelegramService.showAlert('Payment limits updated!');
  };

  const handleSaveAutoGateway = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMaintenance({
      ...maintenanceSettings,
      paymentDetails: {
        ...maintenanceSettings.paymentDetails,
        apiKey: autoGateway.apiKey,
        apiSecret: autoGateway.apiSecret,
        gatewayUrl: autoGateway.gatewayUrl
      }
    });
    TelegramService.haptic('medium');
    TelegramService.showAlert('Auto Gateway settings updated!');
  };

  const tabs = [
    { id: 'maintenance', label: 'MAINTENANCE' },
    { id: 'ad_config', label: 'AD CONFIG' },
    { id: 'app_info', label: 'APP INFO' },
    { id: 'payment', label: 'PAYMENT' }
  ];

  const paymentTabs = [
    { id: 'crypto_bank', label: 'CRYPTO & BANK' },
    { id: 'local_method', label: 'LOCAL METHODS' },
    { id: 'limits', label: 'LIMITS' },
    { id: 'auto_gateway', label: 'AUTO GATEWAY' }
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="grid grid-cols-4 gap-2 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              TelegramService.haptic('light');
            }}
            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
              activeTab === tab.id
                ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                : 'bg-[#1e293b]/40 backdrop-blur-md border-[#334155]/50 text-[#64748b]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 px-2"
        >
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <section className="bg-[#1e293b]/30 border border-blue-500/50 rounded-2xl p-4 space-y-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <h4 className="text-[9px] text-blue-400 uppercase font-black tracking-widest">Global Toggles</h4>
                <div className="space-y-3">
                  {[
                    { key: 'global', label: 'Global' },
                    { key: 'videoTasks', label: 'VideoTasks' },
                    { key: 'adTasks', label: 'AdTasks' },
                    { key: 'promote', label: 'Promote' },
                    { key: 'wallet', label: 'Wallet' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between bg-[#0f172a]/60 p-4 rounded-xl border border-[#334155]/50">
                      <span className="text-[11px] font-black uppercase tracking-widest text-white">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black tracking-widest ${maintenanceSettings[item.key as keyof MaintenanceSettings] ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                          {maintenanceSettings[item.key as keyof MaintenanceSettings] ? 'ON' : 'OFF'}
                        </span>
                        <button
                          onClick={() => toggleService(item.key as any)}
                          className={`w-11 h-6 rounded-full transition-all relative ${
                            maintenanceSettings[item.key as keyof MaintenanceSettings] 
                              ? 'bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                              : 'bg-[#334155]'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${
                            maintenanceSettings[item.key as keyof MaintenanceSettings] ? 'left-6' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ad_config' && (
            <div className="space-y-6">
              <section className="bg-[#1e293b]/30 border border-[#334155]/50 rounded-2xl p-4 space-y-4">
                <h4 className="text-[9px] text-[#64748b] uppercase font-black tracking-widest">Daily Bonus & Boost Settings</h4>
                <form onSubmit={handleUpdateDailyBonus} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Daily Bonus Amount (SAR)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01" 
                        value={dailyBonus} 
                        onChange={e => setDailyBonus(e.target.value)}
                        className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500/50 transition-all text-white font-bold"
                      />
                      <button 
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#2563eb] text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                      >
                        SAVE
                      </button>
                    </div>
                  </div>
                </form>

                <form onSubmit={handleUpdateBoostSettings} className="space-y-4">
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="https://..." 
                      value={boostForm.link} 
                      onChange={e => setBoostForm({...boostForm, link: e.target.value})} 
                      className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Reward (SAR)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={boostForm.reward} 
                        onChange={e => setBoostForm({...boostForm, reward: e.target.value})} 
                        className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Duration (sec)</label>
                      <input 
                        type="number" 
                        value={boostForm.duration} 
                        onChange={e => setBoostForm({...boostForm, duration: e.target.value})} 
                        className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <button className="w-full bg-[#2563eb] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">Update Boost Config</button>
                </form>
              </section>

              <section className="bg-[#1e293b]/30 border border-[#334155]/50 rounded-2xl p-4 space-y-4">
                <h4 className="text-[9px] text-[#64748b] uppercase font-black tracking-widest">Universal Script Injector</h4>
                <form onSubmit={handleUpdateAdScripts} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Global Header Script (Social Ads/Popunders/Banners)</label>
                    <textarea 
                      value={adScripts.header} 
                      onChange={e => setAdScripts({...adScripts, header: e.target.value})} 
                      placeholder="<!-- Paste script here -->"
                      className="w-full h-32 bg-[#0f172a]/80 border border-[#334155]/50 rounded-xl px-4 py-3 text-[10px] font-mono text-blue-400 outline-none focus:border-blue-500/50 transition-all resize-none shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Global Footer Script (Tracking/Banners)</label>
                    <textarea 
                      value={adScripts.footer} 
                      onChange={e => setAdScripts({...adScripts, footer: e.target.value})} 
                      placeholder="<!-- Paste script here -->"
                      className="w-full h-32 bg-[#0f172a]/80 border border-[#334155]/50 rounded-xl px-4 py-3 text-[10px] font-mono text-emerald-400 outline-none focus:border-blue-500/50 transition-all resize-none shadow-inner"
                    />
                  </div>
                  <button className="w-full bg-[#2563eb] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">Update Global Scripts</button>
                </form>
              </section>
            </div>
          )}

          {activeTab === 'app_info' && (
            <div className="space-y-6">
              <section className="bg-[#1e293b]/30 border border-[#334155]/50 rounded-2xl p-4 space-y-4">
                <h4 className="text-[9px] text-[#64748b] uppercase font-black tracking-widest">Mandatory Channels (5 Channels Max)</h4>
                <div className="space-y-2">
                  {maintenanceSettings.verificationChannels.map((channel, idx) => (
                    <input 
                      key={idx}
                      type="text" 
                      value={channel} 
                      onChange={e => {
                        const newChannels = [...maintenanceSettings.verificationChannels];
                        newChannels[idx] = e.target.value;
                        onUpdateMaintenance({ ...maintenanceSettings, verificationChannels: newChannels });
                      }}
                      className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500/50 transition-all"
                    />
                  ))}
                </div>
                <button 
                  onClick={() => {
                    TelegramService.haptic('medium');
                    TelegramService.showAlert('Channels saved!');
                  }}
                  className="w-full bg-[#2563eb] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
                >
                  Save Channels
                </button>
              </section>

              <section className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-[9px] text-[#ef4444] uppercase font-black tracking-widest">Season Management</h4>
                    <p className="text-xs font-bold text-white">Current Season {maintenanceSettings.season || 1}</p>
                    <p className="text-[10px] text-slate-500">Reset all user balances and stats</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure? This will reset ALL user data!')) {
                        TelegramService.haptic('heavy');
                        onResetLeaderboard();
                        TelegramService.showAlert('Leaderboard has been reset!');
                      }
                    }}
                    className="bg-[#ef4444] text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                  >
                    Reset Leaderboard
                  </button>
                </div>
              </section>

              <section className="bg-[#1e293b]/30 border border-[#334155]/50 rounded-2xl p-4 space-y-4">
                <h4 className="text-[9px] text-[#64748b] uppercase font-black tracking-widest">System Links & Rules</h4>
                <form onSubmit={handleUpdateSystemLinks} className="space-y-4">
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Support Telegram Bot"
                      value={systemLinks.support} 
                      onChange={e => setSystemLinks({...systemLinks, support: e.target.value})} 
                      className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Support Channel"
                      value={systemLinks.report} 
                      onChange={e => setSystemLinks({...systemLinks, report: e.target.value})} 
                      className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <textarea 
                      placeholder="Terms of Service content..."
                      value={systemLinks.tos} 
                      onChange={e => setSystemLinks({...systemLinks, tos: e.target.value})} 
                      className="w-full h-24 bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500/50 transition-all resize-none"
                    />
                  </div>
                  <button className="w-full bg-[#2563eb] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">Save System Settings</button>
                </form>
              </section>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {paymentTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActivePaymentTab(tab.id as any);
                          TelegramService.haptic('light');
                        }}
                        className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                          activePaymentTab === tab.id
                            ? 'bg-[#f97316] border-[#f97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                            : 'bg-[#1e293b]/40 backdrop-blur-md border-[#334155]/50 text-[#64748b]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activePaymentTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  {activePaymentTab === 'crypto_bank' && (
                    <section className="bg-[#1e293b]/30 border border-[#334155]/50 rounded-2xl p-4 space-y-4">
                      <h4 className="text-[9px] text-[#64748b] uppercase font-black tracking-widest">Crypto & Bank</h4>
                      <form onSubmit={handleSavePaymentSettings} className="space-y-4">
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Your USDT TRC20 Address"
                            value={paymentForm.cryptoAddress} 
                            onChange={e => setPaymentForm({...paymentForm, cryptoAddress: e.target.value})} 
                            className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <textarea 
                            placeholder="Bank Name, Account No, Account Name..."
                            value={paymentForm.bankInfo} 
                            onChange={e => setPaymentForm({...paymentForm, bankInfo: e.target.value})} 
                            className="w-full h-24 bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <textarea 
                            placeholder="Deposit instructions..."
                            value={systemLinks.instructions} 
                            onChange={e => setSystemLinks({...systemLinks, instructions: e.target.value})} 
                            className="w-full h-24 bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all resize-none"
                          />
                        </div>
                        <button className="w-full bg-[#f97316] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20">Save</button>
                      </form>
                    </section>
                  )}

                  {activePaymentTab === 'local_method' && (
                    <section className="bg-[#1e293b]/30 border border-[#334155]/50 rounded-2xl p-4 space-y-4">
                      <h4 className="text-[9px] text-[#64748b] uppercase font-black tracking-widest">Local Payment Methods by Country</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Select Country</label>
                          <div className="relative">
                            <select 
                              value={selectedCountry}
                              onChange={e => setSelectedCountry(e.target.value)}
                              className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none appearance-none cursor-pointer text-white"
                            >
                              {countries.map(c => (
                                <option key={c.code} value={c.code} className="bg-midnight">{c.flag} {c.name} ({c.methods.join(' / ')})</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                          </div>
                        </div>

                        <div className="space-y-4">
                          {countries.find(c => c.code === selectedCountry)?.methods.map(method => (
                            <div key={method} className="space-y-2">
                              <label className="text-[9px] text-[#64748b] uppercase font-black px-1">{method} Number</label>
                              <input 
                                type="text"
                                placeholder="01XXXXXXXXX"
                                value={localPayConfig[selectedCountry]?.[method] || ''}
                                onChange={e => {
                                  const newConfig = { ...localPayConfig };
                                  if (!newConfig[selectedCountry]) newConfig[selectedCountry] = {};
                                  newConfig[selectedCountry][method] = e.target.value;
                                  setLocalPayConfig(newConfig);
                                }}
                                className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all"
                              />
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={handleSaveLocalPayConfig}
                          className="w-full bg-[#f97316] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20"
                        >
                          Save
                        </button>
                      </div>
                    </section>
                  )}

                  {activePaymentTab === 'limits' && (
                    <section className="bg-[#1e293b]/30 border border-[#334155]/50 rounded-2xl p-4 space-y-4">
                      <h4 className="text-[9px] text-[#64748b] uppercase font-black tracking-widest">Transaction Limits (SAR)</h4>
                      <form onSubmit={handleSavePaymentLimits} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Min Withdrawal</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 10"
                              value={paymentLimits.minWithdrawSAR}
                              onChange={e => setPaymentLimits({...paymentLimits, minWithdrawSAR: e.target.value})}
                              className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Max Withdrawal</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 1000"
                              value={paymentLimits.maxWithdrawSAR}
                              onChange={e => setPaymentLimits({...paymentLimits, maxWithdrawSAR: e.target.value})}
                              className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Min Deposit</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 5"
                              value={paymentLimits.minDeposit}
                              onChange={e => setPaymentLimits({...paymentLimits, minDeposit: e.target.value})}
                              className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Max Deposit</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 5000"
                              value={paymentLimits.maxDeposit}
                              onChange={e => setPaymentLimits({...paymentLimits, maxDeposit: e.target.value})}
                              className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all"
                            />
                          </div>
                        </div>
                        <button className="w-full bg-[#f97316] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20">Save</button>
                      </form>
                    </section>
                  )}

                  {activePaymentTab === 'auto_gateway' && (
                    <section className="bg-[#1e293b]/30 border border-[#334155]/50 rounded-2xl p-4 space-y-4">
                      <h4 className="text-[9px] text-[#64748b] uppercase font-black tracking-widest">Auto Deposit Gateway API</h4>
                      <form onSubmit={handleSaveAutoGateway} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] text-[#64748b] uppercase font-black px-1">API Key</label>
                          <input 
                            type="password" 
                            placeholder="Gateway API Key"
                            value={autoGateway.apiKey}
                            onChange={e => setAutoGateway({...autoGateway, apiKey: e.target.value})}
                            className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] text-[#64748b] uppercase font-black px-1">API Secret</label>
                          <input 
                            type="password" 
                            placeholder="Gateway API Secret"
                            value={autoGateway.apiSecret}
                            onChange={e => setAutoGateway({...autoGateway, apiSecret: e.target.value})}
                            className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] text-[#64748b] uppercase font-black px-1">Gateway URL</label>
                          <input 
                            type="text" 
                            placeholder="https://api.gateway.com"
                            value={autoGateway.gatewayUrl}
                            onChange={e => setAutoGateway({...autoGateway, gatewayUrl: e.target.value})}
                            className="w-full bg-[#0f172a]/60 border border-[#334155]/50 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all"
                          />
                        </div>
                        <button className="w-full bg-[#f97316] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20">Save</button>
                      </form>
                    </section>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
