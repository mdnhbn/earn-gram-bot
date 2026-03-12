
import React, { useState } from 'react';
import { Send, MessageSquare, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { TelegramService } from '../services/telegram';
import { motion, AnimatePresence } from 'motion/react';

interface AdminBroadcastProps {
  onAction: (id: string, type: 'submission' | 'withdrawal', status: any) => Promise<void>;
}

export const AdminBroadcast: React.FC<AdminBroadcastProps> = ({ onAction }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    
    setIsSending(true);
    setStatus('idle');
    try {
      await onAction('broadcast', 'submission', message);
      setMessage('');
      setStatus('success');
      TelegramService.haptic('medium');
      TelegramService.showAlert('Broadcast message sent successfully!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      console.error('Broadcast failed:', e);
      setStatus('error');
      TelegramService.haptic('heavy');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
          <MessageSquare size={12} className="text-neon-blue" /> Global Broadcast
        </h3>
        
        <div className="glass-card p-6 space-y-6">
          <div className="bg-neon-blue/5 border border-neon-blue/10 p-4 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-neon-blue/10 rounded-lg shrink-0">
              <Sparkles className="text-neon-blue" size={16} />
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              This message will be transmitted to <span className="text-neon-blue font-bold">ALL</span> registered users via the Telegram Bot. Use this for critical updates, system maintenance, or high-value mission announcements.
            </p>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black px-1 tracking-tighter">Transmission Content</label>
              <div className="relative">
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Enter your announcement here..."
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-neon-blue/50 transition-all resize-none placeholder:text-slate-700 text-white"
                />
                <div className="absolute bottom-3 right-3">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${message.length > 0 ? 'text-neon-blue' : 'text-slate-700'}`}>
                    {message.length} Chars
                  </span>
                </div>
              </div>
            </div>

            <button 
              disabled={isSending || !message}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl ${
                status === 'success' 
                ? 'bg-emerald-green text-midnight emerald-green-glow' 
                : 'glass-button neon-blue-glow disabled:opacity-50'
              }`}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : status === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSending ? 'TRANSMITTING...' : status === 'success' ? 'TRANSMISSION COMPLETE' : 'INITIATE BROADCAST'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
