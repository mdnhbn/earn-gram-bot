
import React, { useState } from 'react';
import { 
  Settings, Zap, AlertTriangle, CreditCard, Wallet, 
  Globe, Shield, ChevronDown, ChevronUp, Save, 
  RefreshCw, Link as LinkIcon, FileText, Megaphone,
  Lock, Key, Globe2, BarChart3
} from 'lucide-react';
import { MaintenanceSettings, AdminPaymentDetails } from '../types';
import { TelegramService } from '../services/telegram';
import { motion, AnimatePresence } from 'motion/react';

interface AdminSystemProps {
  maintenanceSettings: MaintenanceSettings;
  onUpdateMaintenance: (settings: MaintenanceSettings) => void;
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

export const AdminSystem: React.FC<AdminSystemProps> = ({ maintenanceSettings, onUpdateMaintenance, currentUser }) => {
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
    minWithdraw: (maintenanceSettings.minWithdraw || 10).toString(),
    maxWithdraw: (maintenanceSettings.maxWithdraw || 1000).toString(),
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
      minWithdraw: parseFloat(paymentLimits.minWithdraw),
      maxWithdraw: parseFloat(paymentLimits.maxWithdraw),
      minDeposit: parseFloat(paymentLimits.minDeposit),
      maxDeposit: parseFloat(paymentLimits.maxDeposit)
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
    { id: 'maintenance', label: 'Core', icon: Settings },
    { id: 'ad_config', label: 'Ads', icon: Megaphone },
    { id: 'app_info', label: 'App', icon: Shield },
    { id: 'payment', label: 'Pay', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              TelegramService.haptic('light');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-neon-blue text-midnight shadow-lg shadow-neon-blue/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon size={12} />
            <span className="hidden xs:inline">{tab.label}</span>
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
          className="space-y-6"
        >
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h4 className="text-[9px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
                  <Shield size={10} className="text-neon-blue" /> System Toggles
                </h4>
                <div className="glass-card divide-y divide-white/5">
                  {[
                    { key: 'maintenanceMode', label: 'Maintenance Mode', icon: AlertTriangle, color: 'text-amber-400' },
                    { key: 'videoTasksEnabled', label: 'Video Missions', icon: Zap, color: 'text-neon-blue' },
                    { key: 'adTasksEnabled', label: 'Ad Missions', icon: Megaphone, color: 'text-emerald-green' },
                    { key: 'withdrawalsEnabled', label: 'Withdrawals', icon: CreditCard, color: 'text-purple-400' },
                    { key: 'depositsEnabled', label: 'Deposits', icon: Wallet, color: 'text-orange-400' }
                  ].map((item) => (
                    <div key={item.key} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                          <item.icon size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-200">{item.label}</span>
                      </div>
                      <button
                        onClick={() => toggleService(item.key as any)}
                        className={`w-12 h-6 rounded-full transition-all relative border ${
                          maintenanceSettings[item.key as keyof MaintenanceSettings] 
                            ? 'bg-emerald-green border-emerald-green/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                            : 'bg-slate-800 border-white/10'
                        }`}
                      >
                        <div className={`absolute top-1 w-3.5 h-3.5 bg-white rounded-full transition-all ${
                          maintenanceSettings[item.key as keyof MaintenanceSettings] ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-[9px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
                  <Zap size={10} className="text-emerald-green" /> Reward Configuration
                </h4>
                <form onSubmit={handleUpdateDailyBonus} className="glass-card p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Daily Bonus (SAR)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        step="0.01" 
                        value={dailyBonus} 
                        onChange={e => setDailyBonus(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-neon-blue/50 transition-all"
                      />
                      <button className="glass-button px-6 rounded-xl text-[10px] font-black uppercase tracking-widest neon-blue-glow">Update</button>
                    </div>
                  </div>
                </form>
              </section>
            </div>
          )}

          {activeTab === 'ad_config' && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h4 className="text-[9px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
                  <Zap size={10} className="text-neon-blue" /> Boost Configuration
                </h4>
                <form onSubmit={handleUpdateBoostSettings} className="glass-card p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Boost Smart Link</label>
                    <input 
                      type="text" 
                      placeholder="https://..." 
                      value={boostForm.link} 
                      onChange={e => setBoostForm({...boostForm, link: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-neon-blue/50 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[8px] text-slate-500 uppercase font-black px-1">Reward (SAR)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={boostForm.reward} 
                        onChange={e => setBoostForm({...boostForm, reward: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-neon-blue/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] text-slate-500 uppercase font-black px-1">Duration (Sec)</label>
                      <input 
                        type="number" 
                        value={boostForm.duration} 
                        onChange={e => setBoostForm({...boostForm, duration: e.target.value})} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-neon-blue/50 transition-all"
                      />
                    </div>
                  </div>
                  <button className="w-full glass-button py-3 rounded-xl font-black text-[10px] uppercase tracking-widest neon-blue-glow">Save Boost Settings</button>
                </form>
              </section>

              <section className="space-y-3">
                <h4 className="text-[9px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
                  <LinkIcon size={10} className="text-emerald-green" /> Global Script Injector
                </h4>
                <form onSubmit={handleUpdateAdScripts} className="glass-card p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Header Scripts</label>
                    <textarea 
                      value={adScripts.header} 
                      onChange={e => setAdScripts({...adScripts, header: e.target.value})} 
                      placeholder="Paste Adsterra/Monetag code..." 
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono outline-none focus:border-neon-blue/50 transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Footer Scripts</label>
                    <textarea 
                      value={adScripts.footer} 
                      onChange={e => setAdScripts({...adScripts, footer: e.target.value})} 
                      placeholder="Paste additional tracking code..." 
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono outline-none focus:border-neon-blue/50 transition-all resize-none"
                    />
                  </div>
                  <button className="w-full glass-button py-3 rounded-xl font-black text-[10px] uppercase tracking-widest emerald-green-glow">Update Global Scripts</button>
                </form>
              </section>
            </div>
          )}

          {activeTab === 'app_info' && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h4 className="text-[9px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
                  <Globe size={10} className="text-neon-blue" /> System Links & Rules
                </h4>
                <form onSubmit={handleUpdateSystemLinks} className="glass-card p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Support Link</label>
                    <input 
                      type="text" 
                      value={systemLinks.support} 
                      onChange={e => setSystemLinks({...systemLinks, support: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-neon-blue/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] text-slate-500 uppercase font-black px-1">Terms of Service</label>
                    <textarea 
                      value={systemLinks.tos} 
                      onChange={e => setSystemLinks({...systemLinks, tos: e.target.value})} 
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-blue/50 transition-all resize-none"
                    />
                  </div>
                  <button className="w-full glass-button py-3 rounded-xl font-black text-[10px] uppercase tracking-widest neon-blue-glow">Save App Info</button>
                </form>
              </section>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                {[
                  { id: 'crypto_bank', label: 'Crypto/Bank' },
                  { id: 'local_method', label: 'Local' },
                  { id: 'limits', label: 'Limits' },
                  { id: 'auto_gateway', label: 'Gateway' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActivePaymentTab(tab.id as any);
                      TelegramService.haptic('light');
                    }}
                    className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                      activePaymentTab === tab.id
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'text-slate-500 hover:text-slate-300'
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
                    <form onSubmit={handleSavePaymentSettings} className="glass-card p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[8px] text-slate-500 uppercase font-black px-1">USDT TRC20 Address</label>
                        <input 
                          type="text" 
                          value={paymentForm.cryptoAddress} 
                          onChange={e => setPaymentForm({...paymentForm, cryptoAddress: e.target.value})} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] text-slate-500 uppercase font-black px-1">Bank Details</label>
                        <textarea 
                          value={paymentForm.bankInfo} 
                          onChange={e => setPaymentForm({...paymentForm, bankInfo: e.target.value})} 
                          className="w-full h-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] text-slate-500 uppercase font-black px-1">Deposit Instructions</label>
                        <textarea 
                          value={systemLinks.instructions} 
                          onChange={e => setSystemLinks({...systemLinks, instructions: e.target.value})} 
                          className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-orange-500/50 transition-all resize-none"
                        />
                      </div>
                      <button className="w-full glass-button py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-orange-500/20 bg-orange-500 text-white">Save Crypto/Bank Settings</button>
                    </form>
                  )}

                  {activePaymentTab === 'local_method' && (
                    <div className="glass-card p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[8px] text-slate-500 uppercase font-black px-1">Select Country</label>
                        <select 
                          value={selectedCountry}
                          onChange={e => setSelectedCountry(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none appearance-none cursor-pointer text-white"
                        >
                          {countries.map(c => (
                            <option key={c.code} value={c.code} className="bg-midnight">{c.flag} {c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        {countries.find(c => c.code === selectedCountry)?.methods.map(method => (
                          <div key={method} className="space-y-1.5">
                            <label className="text-[8px] text-slate-500 uppercase font-black px-1">{method} Number</label>
                            <input 
                              type="text"
                              value={localPayConfig[selectedCountry]?.[method] || ''}
                              onChange={e => {
                                const newConfig = { ...localPayConfig };
                                if (!newConfig[selectedCountry]) newConfig[selectedCountry] = {};
                                newConfig[selectedCountry][method] = e.target.value;
                                setLocalPayConfig(newConfig);
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500/50 transition-all"
                            />
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={handleSaveLocalPayConfig}
                        className="w-full glass-button py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-orange-500 text-white shadow-orange-500/20"
                      >
                        Save Local Methods
                      </button>
                    </div>
                  )}

                  {activePaymentTab === 'limits' && (
                    <form onSubmit={handleSavePaymentLimits} className="glass-card p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] text-slate-500 uppercase font-black px-1">Min Withdraw</label>
                          <input 
                            type="number" 
                            value={paymentLimits.minWithdraw}
                            onChange={e => setPaymentLimits({...paymentLimits, minWithdraw: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500/50 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] text-slate-500 uppercase font-black px-1">Max Withdraw</label>
                          <input 
                            type="number" 
                            value={paymentLimits.maxWithdraw}
                            onChange={e => setPaymentLimits({...paymentLimits, maxWithdraw: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500/50 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] text-slate-500 uppercase font-black px-1">Min Deposit</label>
                          <input 
                            type="number" 
                            value={paymentLimits.minDeposit}
                            onChange={e => setPaymentLimits({...paymentLimits, minDeposit: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500/50 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] text-slate-500 uppercase font-black px-1">Max Deposit</label>
                          <input 
                            type="number" 
                            value={paymentLimits.maxDeposit}
                            onChange={e => setPaymentLimits({...paymentLimits, maxDeposit: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500/50 transition-all"
                          />
                        </div>
                      </div>
                      <button className="w-full glass-button py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-orange-500 text-white shadow-orange-500/20">Update Limits</button>
                    </form>
                  )}

                  {activePaymentTab === 'auto_gateway' && (
                    <form onSubmit={handleSaveAutoGateway} className="glass-card p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[8px] text-slate-500 uppercase font-black px-1">API Key</label>
                        <input 
                          type="password" 
                          value={autoGateway.apiKey}
                          onChange={e => setAutoGateway({...autoGateway, apiKey: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] text-slate-500 uppercase font-black px-1">API Secret</label>
                        <input 
                          type="password" 
                          value={autoGateway.apiSecret}
                          onChange={e => setAutoGateway({...autoGateway, apiSecret: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] text-slate-500 uppercase font-black px-1">Gateway URL</label>
                        <input 
                          type="text" 
                          value={autoGateway.gatewayUrl}
                          onChange={e => setAutoGateway({...autoGateway, gatewayUrl: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500/50 transition-all"
                        />
                      </div>
                      <button className="w-full glass-button py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-orange-500 text-white shadow-orange-500/20">Save Gateway API</button>
                    </form>
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
