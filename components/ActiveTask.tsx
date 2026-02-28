
import React, { useState, useEffect, useRef } from 'react';
import { Task, AdTask } from '../types';
import { TelegramService } from '../services/telegram';

interface ActiveTaskProps {
  task: Task | AdTask;
  onClaim: () => void;
  onCancel: () => void;
  isPaused: boolean;
  onFocusSignal: (isLost: boolean) => void;
}

const ActiveTask: React.FC<ActiveTaskProps> = ({ task, onClaim, onCancel, isPaused, onFocusSignal }) => {
  // Path corrected to root-relative for standard deployment
  const PLAYER_PATH = "player.html";
  const [isConfirmingExit, setIsConfirmingExit] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const isConfirmingRef = useRef(false);

  const isVideoTask = 'platform' in task;
  const duration = isVideoTask ? (task as Task).timerSeconds : (task as AdTask).durationSeconds;

  useEffect(() => {
    // Listen for messages from the player.html iframe
    const handleMessage = (event: MessageEvent) => {
      const { type } = event.data;
      
      if (type === 'FOCUS_LOST') {
        if (!isConfirmingRef.current) {
          onFocusSignal(true);
        }
      } else if (type === 'FOCUS_GAINED') {
        onFocusSignal(false);
      } else if (type === 'CLAIM_TASK') {
        onClaim();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClaim, onFocusSignal]);

  const getPlayerUrl = () => {
    if (!task.url) return "";
    const params = new URLSearchParams();
    params.append('url', task.url);
    params.append('time', duration.toString());
    
    // Pass ad scripts from maintenance settings
    const settings = localStorage.getItem('earngram_maintenance_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.headerAdScript) params.append('headerAd', parsed.headerAdScript);
      if (parsed.footerAdScript) params.append('footerAd', parsed.footerAdScript);
    }

    if (isVideoTask) {
      params.append('platform', (task as Task).platform);
    }
    return `${PLAYER_PATH}?${params.toString()}`;
  };

  const handleBackClick = () => {
    setIsConfirmingExit(true);
    isConfirmingRef.current = true;
    
    TelegramService.showConfirm('⚠️ Warning: Leaving now will cancel your current task progress. Do you want to exit?', (ok) => {
      if (ok) {
        onCancel();
      } else {
        setIsConfirmingExit(false);
        isConfirmingRef.current = false;
        onFocusSignal(false);
      }
    });
  };

  const playerUrl = getPlayerUrl();
  const showFallback = hasLoadError || !playerUrl;

  return (
    <div className="fixed inset-0 bg-slate-900 z-[60] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
      {/* Container Header */}
      <header className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <button 
          onClick={handleBackClick}
          className="text-slate-400 text-xs font-bold uppercase tracking-wider px-2 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Focused Task Mode</p>
          <p className="text-[9px] text-blue-400 font-bold truncate max-w-[150px]">{task.title}</p>
        </div>
        <div className="w-10" />
      </header>

      {/* External Content Shell */}
      <main className="flex-1 bg-black relative">
        {showFallback ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 bg-slate-900">
             <div className="text-5xl mb-4">📺</div>
             <h3 className="text-lg font-bold text-white mb-2">Video Player is ready.</h3>
             <p className="text-slate-400 text-sm">It will load when the app is live on GitHub or the provided URL is valid.</p>
             {!task.url && <p className="text-amber-500 text-[10px] mt-4 uppercase font-black">Error: Task URL is missing</p>}
          </div>
        ) : (
          <>
            {(isPaused || isConfirmingExit) && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center text-center p-8">
                <div className="animate-in zoom-in duration-300">
                  <div className="text-4xl mb-4">{isConfirmingExit ? '🛑' : '⚠️'}</div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
                    {isConfirmingExit ? 'Cancel Task?' : 'Timer Paused'}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {isConfirmingExit 
                      ? 'Please confirm if you want to abort this session.' 
                      : 'You left the secure viewer. Return to continue earning.'}
                  </p>
                </div>
              </div>
            )}
            
            <iframe 
              src={playerUrl}
              className="w-full h-full border-none"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope"
              title="Secure Player"
              id="task-frame"
              onError={() => setHasLoadError(true)}
            />
          </>
        )}
      </main>

      {/* Security Footer */}
      <footer className="p-3 bg-slate-900 border-t border-slate-800 text-center">
        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          Secure Tracking Provided by EarnGram Protocol v6.0
        </p>
      </footer>
    </div>
  );
};

export default ActiveTask;
