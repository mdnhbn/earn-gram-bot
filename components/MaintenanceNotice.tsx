
import React from 'react';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';

interface MaintenanceNoticeProps {
  title: string;
  message?: string;
}

const MaintenanceNotice: React.FC<MaintenanceNoticeProps> = ({ 
  title, 
  message = "This service is temporarily unavailable for technical updates. Please check back later." 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 flex flex-col items-center justify-center text-center space-y-8 min-h-[50vh]"
    >
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
        >
          <Settings size={40} className="text-amber-500" />
        </motion.div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full border-4 border-[#0f172a] flex items-center justify-center"
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </motion.div>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{title}</h2>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto font-medium">
          {message}
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-6 py-2 glass-card border-amber-500/20 rounded-2xl"
      >
        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">System Optimization</p>
      </motion.div>
    </motion.div>
  );
};

export default MaintenanceNotice;
