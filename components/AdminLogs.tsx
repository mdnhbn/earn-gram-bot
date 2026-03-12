
import React from 'react';
import { ScrollText, History, Info, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminLogs: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest flex items-center gap-2">
          <Terminal size={12} className="text-neon-blue" /> System Diagnostics
        </h3>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 flex flex-col items-center justify-center space-y-6"
        >
          <div className="relative">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center relative z-10">
              <History className="w-10 h-10 text-slate-700 opacity-20" />
            </div>
            <div className="absolute inset-0 bg-neon-blue/5 blur-2xl rounded-full" />
          </div>

          <div className="text-center space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Anomalies</h4>
            <p className="text-[10px] text-slate-600 font-medium">System core is operating within normal parameters.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start gap-4 max-w-sm">
            <div className="p-2 bg-neon-blue/10 rounded-lg shrink-0">
              <Info className="text-neon-blue" size={16} />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Real-time transaction streams and security event logs are currently being indexed. A high-fidelity log visualizer is scheduled for deployment in the next system cycle.
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
