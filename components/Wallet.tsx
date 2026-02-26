
import React, { useState, useMemo, useEffect } from 'react';
import { User, WithdrawalRequest, Transaction, AdminPaymentDetails, MaintenanceSettings } from '../types';
import { TelegramService } from '../services/telegram';

interface WalletProps {
  user: User;
  withdrawals: WithdrawalRequest[];
  transactions: Transaction[];
  onWithdraw: (data: any) => void;
  isMaintenance?: boolean;
  onUpdatePreference: (pref: Partial<User>) => void;
  maintenanceSettings: MaintenanceSettings;
}

const EXCHANGE_RATES: Record<string, number> = {
  'SAR': 1.0,
  'BDT': 31.5,
  'INR': 22.1,
  'USD': 0.27,
  'USDT': 0.27,
  'AED': 0.99,
  'GBP': 0.21,
  'PKR': 75.0
};

const Wallet: React.FC<WalletProps> = ({ user, withdrawals, transactions, onWithdraw, isMaintenance, onUpdatePreference, maintenanceSettings }) => {
  const [view, setView] = useState<'withdraw' | 'deposit' | 'history' | 'flagged'>('withdraw');
  const [mode, setMode] = useState<'Local' | 'USDT'>('Local');
  const [selectedCurrency, setSelectedCurrency] = useState(user.preferredCurrency || 'USD');
  const [amountInput, setAmountInput] = useState('');
  const [address, setAddress] = useState('');

  const currentRate = useMemo(() => EXCHANGE_RATES[selectedCurrency] || EXCHANGE_RATES['USD'], [selectedCurrency]);
  const usdtRate = EXCHANGE_RATES['USDT'];

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaintenance) {
      TelegramService.showAlert('Withdrawals are temporarily paused.');
      return;
    }

    if (user.isFlagged) {
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
      if (amountInSAR > user.balanceRiyal) {
        TelegramService.showAlert('Insufficient Balance.');
        return;
      }
      onWithdraw({ amount: amountInSAR, currency: 'Riyal', localCurrency: selectedCurrency, localAmount: val, address, method: 'Local Bank' });
    } else {
      if (val > user.balanceCrypto) {
        TelegramService.showAlert('Insufficient USDT balance.');
        return;
      }
      onWithdraw({ amount: val, currency: 'Crypto', localCurrency: 'USDT', localAmount: val, address, method: 'Crypto Wallet' });
    }
    setAmountInput('');
    setAddress('');
    TelegramService.haptic('medium');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    TelegramService.showAlert('Copied to clipboard!');
    TelegramService.haptic('light');
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold">Wallet</h2>
        <div className="bg-slate-800 p-1 rounded-xl flex border border-slate-700">
          <button onClick={() => setView('withdraw')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${view === 'withdraw' ? 'bg-blue-600' : 'text-slate-400'}`}>Withdraw</button>
          <button onClick={() => setView('deposit')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${view === 'deposit' ? 'bg-blue-600' : 'text-slate-400'}`}>Deposit</button>
          <button onClick={() => setView('history')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${view === 'history' ? 'bg-blue-600' : 'text-slate-400'}`}>History</button>
        </div>
      </div>

      {view === 'withdraw' && (
        <div className="space-y-6 animate-in slide-in-from-right">
          <div className="bg-slate-800 p-1 rounded-2xl flex border border-slate-700">
            <button onClick={() => setMode('Local')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${mode === 'Local' ? 'bg-blue-600 shadow-lg' : 'text-slate-400'}`}>Local Cash</button>
            <button onClick={() => setMode('USDT')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${mode === 'USDT' ? 'bg-blue-600 shadow-lg' : 'text-slate-400'}`}>USDT Crypto</button>
          </div>

          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-5">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Available Balance</p>
                <p className="text-xl font-black">{mode === 'Local' ? `${(user.balanceRiyal * currentRate).toFixed(2)} ${selectedCurrency}` : `${user.balanceCrypto.toFixed(2)} USDT`}</p>
              </div>
              {mode === 'Local' && (
                <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-blue-400">
                  {Object.keys(EXCHANGE_RATES).filter(k => k !== 'USDT').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <input type="number" step="any" value={amountInput} onChange={e => setAmountInput(e.target.value)} placeholder={`Amount in ${mode === 'Local' ? selectedCurrency : 'USDT'}`} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" required />
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={mode === 'Local' ? 'Bank details or IBAN' : 'USDT Address'} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" required />
              <button disabled={isMaintenance} className="w-full py-4 rounded-2xl font-black text-sm bg-blue-600 shadow-xl shadow-blue-900/30">REQUEST PAYOUT</button>
            </form>
          </div>
        </div>
      )}

      {view === 'deposit' && (
        <div className="space-y-6 animate-in slide-in-from-left">
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-6">
            <header className="text-center">
              <h3 className="text-lg font-bold">Manual Deposit</h3>
              <p className="text-xs text-slate-400">Transfer funds and contact support for manual credit.</p>
            </header>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700/50 space-y-2">
                <p className="text-[10px] text-slate-500 font-black uppercase">Crypto Wallet (USDT/TRX)</p>
                {maintenanceSettings.paymentDetails.cryptoAddress ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-mono text-blue-400 truncate">{maintenanceSettings.paymentDetails.cryptoAddress}</p>
                    <button onClick={() => copyToClipboard(maintenanceSettings.paymentDetails.cryptoAddress)} className="text-[10px] font-black uppercase text-blue-500">Copy</button>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Contact Admin for Details</p>
                )}
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700/50 space-y-2">
                <p className="text-[10px] text-slate-500 font-black uppercase">Local Payment Details</p>
                {maintenanceSettings.paymentDetails.bankInfo ? (
                  <>
                    <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap">{maintenanceSettings.paymentDetails.bankInfo}</pre>
                    <button onClick={() => copyToClipboard(maintenanceSettings.paymentDetails.bankInfo)} className="text-[10px] font-black uppercase text-blue-500">Copy Info</button>
                  </>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Contact Admin for Details</p>
                )}
              </div>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase">Step-by-step instructions</h4>
              {maintenanceSettings.depositInstructions ? (
                <div className="text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {maintenanceSettings.depositInstructions.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">{line}</p>
                  ))}
                  <p className="mt-2 text-white font-bold">Your UserID: {user.id}</p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Contact Admin for instructions.</p>
              )}
            </div>

            <button 
              onClick={() => TelegramService.openTelegramLink(maintenanceSettings.supportLink || `https://t.me/${maintenanceSettings.paymentDetails.supportUsername}`)}
              className="w-full py-4 rounded-2xl font-black text-sm bg-blue-600 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2"
            >
              🚀 CONTACT SUPPORT NOW
            </button>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-3 animate-in fade-in">
          <p className="text-[10px] text-slate-500 font-black uppercase px-1 tracking-widest">Transaction Records</p>
          {transactions.filter(tx => tx.userId === user.id).length === 0 ? (
            <div className="bg-slate-800/50 rounded-3xl border border-dashed border-slate-700 p-12 text-center space-y-4">
              <div className="text-4xl opacity-20">📜</div>
              <div>
                <h4 className="text-sm font-bold text-slate-300">No Transactions</h4>
                <p className="text-[10px] text-slate-500">Your transaction history will appear here once you start earning.</p>
              </div>
            </div>
          ) : (
            transactions.filter(tx => tx.userId === user.id).map(tx => (
              <div key={tx.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold">{tx.description}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{tx.type} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black ${tx.type === 'EARNING' || tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'EARNING' || tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toFixed(2)} {tx.currency}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'flagged' && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-10 text-center space-y-6 animate-in fade-in duration-300">
          <div className="text-6xl">❌</div>
          <h2 className="text-2xl font-black uppercase text-red-500">Payout Rejected</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Our system has detected multiple accounts linked to this device. To maintain platform integrity, only one account per device is eligible for rewards.
          </p>
          <button 
            onClick={() => setView('withdraw')}
            className="w-full py-4 rounded-2xl font-black text-sm bg-slate-800 border border-slate-700 text-slate-300"
          >
            CLOSE
          </button>
        </div>
      )}
    </div>
  );
};

export default Wallet;
