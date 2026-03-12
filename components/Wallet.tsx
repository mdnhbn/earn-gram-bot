
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, WithdrawalRequest, Transaction, AdminPaymentDetails, MaintenanceSettings, CurrencyInfo } from '../types';
import { TelegramService } from '../services/telegram';
import { EXCHANGE_RATES } from '../constants';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Flag, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Coins,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';

interface WalletProps {
  user: User;
  withdrawals: WithdrawalRequest[];
  transactions: Transaction[];
  onWithdraw: (data: any) => void;
  isMaintenance?: boolean;
  onUpdatePreference: (pref: Partial<User>) => void;
  maintenanceSettings: MaintenanceSettings;
  currencyInfo: CurrencyInfo;
}

const Wallet: React.FC<WalletProps> = ({ user, withdrawals, transactions, onWithdraw, isMaintenance, onUpdatePreference, maintenanceSettings, currencyInfo }) => {
  const [view, setView] = useState<'withdraw' | 'deposit' | 'history' | 'flagged'>('withdraw');
  const [mode, setMode] = useState<'Local' | 'USDT'>('Local');
  const [depositType, setDepositType] = useState<'auto' | 'manual'>('auto');
  const [selectedCurrency, setSelectedCurrency] = useState(currencyInfo.code);
  const [amountInput, setAmountInput] = useState('');
  const [address, setAddress] = useState('');
  const [txId, setTxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedCurrency(currencyInfo.code);
  }, [currencyInfo.code]);

  const currentRate = useMemo(() => EXCHANGE_RATES[selectedCurrency] || EXCHANGE_RATES['USD'], [selectedCurrency]);
  const usdtRate = EXCHANGE_RATES['USDT'];

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaintenance) {
      TelegramService.showAlert('Withdrawals are temporarily paused.');
      return;
    }

    if (user?.isFlagged) {
      setView('flagged');
      return;
    }

    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) {
      TelegramService.showAlert('Please enter a valid amount.');
      return;
    }
    const rateToUse = mode === 'USDT' ? usdtRate : currentRate;
    const amountInSAR = val / rateToUse;
    if (mode === 'Local') {
      if (amountInSAR > (user?.balanceRiyal || 0)) {
        TelegramService.showAlert('Insufficient Balance.');
        return;
      }
      onWithdraw({ amount: amountInSAR, currency: 'Riyal', localCurrency: selectedCurrency, localAmount: val, address, method: 'Local Bank' });
    } else {
      if (val > (user?.balanceCrypto || 0)) {
        TelegramService.showAlert('Insufficient USDT balance.');
        return;
      }
      onWithdraw({ amount: val, currency: 'Crypto', localCurrency: 'USDT', localAmount: val, address, method: 'Crypto Wallet' });
    }
    setAmountInput('');
    setAddress('');
    TelegramService.haptic('medium');
  };

  const handleAutoDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountInput || !txId || (mode === 'Local' && !senderNumber)) {
      TelegramService.showAlert('Please fill all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = mode === 'USDT' ? '/api/deposit/crypto' : '/api/deposit/local';
      const body = mode === 'USDT' 
        ? { user_id: user?.id, tx_id: txId, amount: parseFloat(amountInput) }
        : { user_id: user?.id, tx_id: txId, sender: senderNumber, amount: parseFloat(amountInput) };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        TelegramService.showAlert(data.message || 'Deposit submitted successfully!');
        setAmountInput('');
        setTxId('');
        setSenderNumber('');
        setView('history');
      } else {
        TelegramService.showAlert(data.message || 'Failed to submit deposit.');
      }
    } catch (err) {
      console.error(err);
      TelegramService.showAlert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    TelegramService.showAlert('Copied to clipboard!');
    TelegramService.haptic('light');
  };

  const tabs = [
    { id: 'withdraw', label: 'Withdraw', icon: <ArrowUpRight size={14} /> },
    { id: 'deposit', label: 'Deposit', icon: <ArrowDownLeft size={14} /> },
    { id: 'history', label: 'History', icon: <History size={14} /> },
  ];

  return (
    <div className="p-4 space-y-6 pb-32">
      <div className="flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          <h2 className="text-2xl font-black tracking-tight text-white">Wallet</h2>
        </motion.div>
        
        <div className="glass-card-dark p-1 rounded-xl flex border border-white/5">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => {
                TelegramService.haptic('light');
                setView(tab.id as any);
              }} 
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${
                view === tab.id ? 'text-white' : 'text-slate-500'
              }`}
            >
              {view === tab.id && (
                <motion.div
                  layoutId="wallet-tab-active"
                  className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-lg shadow-primary/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="flex items-center gap-1.5">
                {tab.icon}
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'withdraw' && (
          <motion.div 
            key="withdraw"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass-card-dark p-1 flex border border-white/5">
              <button 
                onClick={() => setMode('Local')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${
                  mode === 'Local' ? 'text-white' : 'text-slate-500'
                }`}
              >
                {mode === 'Local' && (
                  <motion.div
                    layoutId="mode-active"
                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/30"
                  />
                )}
                <div className="flex items-center justify-center gap-2">
                  <CreditCard size={14} />
                  <span>Local Cash</span>
                </div>
              </button>
              <button 
                onClick={() => setMode('USDT')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${
                  mode === 'USDT' ? 'text-white' : 'text-slate-500'
                }`}
              >
                {mode === 'USDT' && (
                  <motion.div
                    layoutId="mode-active"
                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/30"
                  />
                )}
                <div className="flex items-center justify-center gap-2">
                  <Coins size={14} />
                  <span>USDT Crypto</span>
                </div>
              </button>
            </div>

            <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 rounded-full" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Available Funds</p>
                  {mode === 'Local' && (
                    <div className="flex gap-2">
                      {['SAR', 'BDT', 'INR'].map(curr => (
                        <button 
                          key={curr}
                          onClick={() => setSelectedCurrency(curr)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tighter transition-all border ${
                            selectedCurrency === curr 
                            ? 'bg-primary border-primary-light text-white' 
                            : 'glass-card-dark border-white/5 text-slate-500'
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="glass-card-dark p-8 rounded-3xl border-white/5 flex flex-col items-center justify-center text-center shadow-inner">
                  <motion.h2 
                    key={mode + selectedCurrency}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl font-black tracking-tight text-white mb-1"
                  >
                    {mode === 'Local' ? `${((user?.balanceRiyal || 0) * currentRate).toFixed(2)}` : `${(user?.balanceCrypto || 0).toFixed(2)}`}
                  </motion.h2>
                  <p className="text-[10px] text-primary-light font-black uppercase tracking-[0.3em] opacity-80">
                    {mode === 'Local' ? selectedCurrency : 'USDT'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-5 relative z-10">
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 font-black uppercase px-2 tracking-widest">Withdraw Amount</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="any" 
                      value={amountInput} 
                      onChange={e => setAmountInput(e.target.value)} 
                      placeholder={`0.00 ${mode === 'Local' ? selectedCurrency : 'USDT'}`} 
                      className="w-full glass-card-dark border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/50 transition-colors text-white placeholder:text-slate-600" 
                      required 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase">
                      {mode === 'Local' ? selectedCurrency : 'USDT'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-500 font-black uppercase px-2 tracking-widest">
                    {mode === 'Local' ? 'Bank Details / IBAN / Mobile Number' : 'USDT (TRC20) Wallet Address'}
                  </label>
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder={mode === 'Local' ? 'Enter receiving details' : 'Paste TRC20 address'} 
                    className="w-full glass-card-dark border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/50 transition-colors text-white placeholder:text-slate-600" 
                    required 
                  />
                </div>
                <button 
                  disabled={isMaintenance} 
                  className="btn-premium w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:grayscale"
                >
                  {isMaintenance ? (
                    <>
                      <AlertCircle size={16} />
                      <span>Withdrawals Paused</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Withdrawal</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-8 border-t border-white/5 space-y-4 relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <History size={14} className="text-primary" />
                  Recent Withdrawals
                </h3>
                
                <div className="space-y-3">
                  {withdrawals.length === 0 ? (
                    <div className="glass-card-dark rounded-2xl border-dashed border-white/5 p-8 text-center">
                      <p className="text-[10px] text-slate-500 font-medium italic">No withdrawal records found.</p>
                    </div>
                  ) : (
                    withdrawals.slice(0, 3).map((w) => (
                      <div key={w.id} className="glass-card-dark p-4 rounded-2xl border-white/5 flex justify-between items-center group hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">{w.method}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                            {new Date(w.createdAt).toLocaleDateString()} • {w.currency === 'Riyal' ? 'SAR' : 'USDT'}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs font-black text-white">
                            {w.amount.toFixed(2)} {w.currency === 'Riyal' ? 'SAR' : 'USDT'}
                          </p>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            w.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            w.status === 'COMPLETED' || w.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {w.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'deposit' && (
          <motion.div 
            key="deposit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass-card-dark p-1 flex border border-white/5">
              <button 
                onClick={() => setDepositType('auto')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${
                  depositType === 'auto' ? 'text-white' : 'text-slate-500'
                }`}
              >
                {depositType === 'auto' && (
                  <motion.div
                    layoutId="deposit-type-active"
                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/30"
                  />
                )}
                <div className="flex items-center justify-center gap-2">
                  <Zap size={14} />
                  <span>Fast Auto</span>
                </div>
              </button>
              <button 
                onClick={() => setDepositType('manual')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${
                  depositType === 'manual' ? 'text-white' : 'text-slate-500'
                }`}
              >
                {depositType === 'manual' && (
                  <motion.div
                    layoutId="deposit-type-active"
                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/30"
                  />
                )}
                <div className="flex items-center justify-center gap-2">
                  <Info size={14} />
                  <span>Manual Support</span>
                </div>
              </button>
            </div>

            <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
              <header className="text-center space-y-2 relative z-10">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">{depositType === 'auto' ? 'Automatic Deposit' : 'Manual Deposit'}</h3>
                <p className="text-[11px] text-slate-400 font-medium px-4">
                  {depositType === 'auto' 
                    ? 'Submit your transaction details for instant verification.' 
                    : 'Transfer funds and contact support for manual credit.'}
                </p>
              </header>

              {depositType === 'auto' && (
                <div className="glass-card-dark p-1 rounded-2xl flex border border-white/5 mb-4 relative z-10">
                  <button onClick={() => setMode('Local')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest relative z-10 ${mode === 'Local' ? 'text-white' : 'text-slate-500'}`}>
                    {mode === 'Local' && <motion.div layoutId="dep-mode-active" className="absolute inset-0 bg-primary rounded-xl -z-10" />}
                    Local (bKash/STC)
                  </button>
                  <button onClick={() => setMode('USDT')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest relative z-10 ${mode === 'USDT' ? 'text-white' : 'text-slate-500'}`}>
                    {mode === 'USDT' && <motion.div layoutId="dep-mode-active" className="absolute inset-0 bg-primary rounded-xl -z-10" />}
                    USDT (TRC20)
                  </button>
                </div>
              )}

              <div className="space-y-4 relative z-10">
                <div className="p-6 glass-card-dark rounded-3xl border-white/5 space-y-4 shadow-inner">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">
                    {mode === 'USDT' ? 'Crypto Wallet (USDT/TRX)' : 'Local Payment Details'}
                  </p>
                  {mode === 'USDT' ? (
                    maintenanceSettings.paymentDetails.cryptoAddress ? (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-mono text-primary-light truncate font-bold">{maintenanceSettings.paymentDetails.cryptoAddress}</p>
                        <button onClick={() => copyToClipboard(maintenanceSettings.paymentDetails.cryptoAddress)} className="bg-primary/10 text-primary-light px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1.5">
                          <Copy size={12} />
                          <span>Copy</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Contact Admin for Details</p>
                    )
                  ) : (
                    maintenanceSettings.paymentDetails.bankInfo ? (
                      <div className="space-y-4">
                        <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{maintenanceSettings.paymentDetails.bankInfo}</pre>
                        <button onClick={() => copyToClipboard(maintenanceSettings.paymentDetails.bankInfo)} className="w-full bg-primary/10 text-primary-light py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary/20 flex items-center justify-center gap-2">
                          <Copy size={14} />
                          <span>Copy Payment Info</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Contact Admin for Details</p>
                    )
                  )}
                </div>
              </div>

              {depositType === 'auto' ? (
                <form onSubmit={handleAutoDeposit} className="space-y-5 relative z-10">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] text-slate-500 font-black uppercase px-2 tracking-widest">Deposit Amount</label>
                      <input 
                        type="number" 
                        step="any" 
                        placeholder={`0.00 ${mode === 'Local' ? selectedCurrency : 'USDT'}`} 
                        value={amountInput}
                        onChange={e => setAmountInput(e.target.value)}
                        className="w-full glass-card-dark border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/50 text-white placeholder:text-slate-600" 
                        required 
                      />
                    </div>
                    {mode === 'Local' && (
                      <div className="space-y-2">
                        <label className="text-[9px] text-slate-500 font-black uppercase px-2 tracking-widest">Sender Number</label>
                        <input 
                          type="text" 
                          placeholder="Your payment number" 
                          value={senderNumber}
                          onChange={e => setSenderNumber(e.target.value)}
                          className="w-full glass-card-dark border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/50 text-white placeholder:text-slate-600" 
                          required 
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[9px] text-slate-500 font-black uppercase px-2 tracking-widest">Transaction ID / Hash</label>
                      <input 
                        type="text" 
                        placeholder="Paste TxID here" 
                        value={txId}
                        onChange={e => setTxId(e.target.value)}
                        className="w-full glass-card-dark border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary/50 text-white placeholder:text-slate-600" 
                        required 
                      />
                    </div>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="btn-premium w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Transaction</span>
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-6 relative z-10">
                  <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl space-y-4 shadow-inner">
                    <h4 className="text-[10px] font-black text-primary-light uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      Step-by-step instructions
                    </h4>
                    {maintenanceSettings.depositInstructions ? (
                      <div className="text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed font-medium">
                        {maintenanceSettings.depositInstructions.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0">{line}</p>
                        ))}
                        <div className="mt-6 p-4 glass-card-dark rounded-2xl border-white/5 flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Your UserID</span>
                          <span className="text-white font-black tracking-[0.2em]">{user.id}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Contact Admin for instructions.</p>
                    )}
                  </div>

                  <button 
                    onClick={() => TelegramService.openTelegramLink(maintenanceSettings.supportLink || `https://t.me/${maintenanceSettings.paymentDetails.supportUsername}`)}
                    className="btn-premium w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  >
                    <Rocket size={16} />
                    <span>Contact Support Now</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 px-1">
              <History size={14} className="text-slate-500" />
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Transaction Records</p>
            </div>
            
            {transactions.filter(tx => tx.userId === user.id).length === 0 ? (
              <div className="glass-card-dark rounded-3xl border-dashed border-white/5 p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <History size={32} className="text-slate-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">No Transactions</h4>
                  <p className="text-[10px] text-slate-500">Your transaction history will appear here once you start earning.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.filter(tx => tx.userId === user.id).map(tx => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={tx.id} 
                    className="glass-card p-4 rounded-2xl border-white/5 flex justify-between items-center group hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        tx.type === 'EARNING' || tx.type === 'DEPOSIT' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {tx.type === 'EARNING' || tx.type === 'DEPOSIT' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-primary-light transition-colors">{tx.description}</p>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{tx.type} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-sm ${tx.type === 'EARNING' || tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'EARNING' || tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toFixed(2)} {tx.currency}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {view === 'flagged' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-[#0f172a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center space-y-8"
          >
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <Flag size={48} className="text-red-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black uppercase text-white tracking-tighter">Payout Restricted</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto font-medium">
                Our system has detected multiple accounts linked to this device. To maintain platform integrity, only one account per device is eligible for rewards.
              </p>
            </div>
            <button 
              onClick={() => setView('withdraw')}
              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95"
            >
              Back to Wallet
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
</div>
  );
};

export default Wallet;
