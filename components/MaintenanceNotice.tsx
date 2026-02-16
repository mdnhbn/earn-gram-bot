
import React from 'react';

interface MaintenanceNoticeProps {
  title: string;
  message?: string;
}

const MaintenanceNotice: React.FC<MaintenanceNoticeProps> = ({ 
  title, 
  message = "This service is temporarily unavailable for technical updates. Please check back later." 
}) => {
  return (
    <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500 min-h-[50vh]">
      <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-4xl border border-amber-500/20">
        🛠️
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h2>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
          {message}
        </p>
      </div>
      <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl">
        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Under Maintenance</p>
      </div>
    </div>
  );
};

export default MaintenanceNotice;
