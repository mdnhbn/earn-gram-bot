
declare global {
  interface Window {
    Telegram: any;
  }
}

const getTg = () => (typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined);

export const TelegramService = {
  init: () => {
    try {
      const tg = getTg();
      tg?.ready();
      tg?.expand();
    } catch (e) {
      console.warn('Telegram WebApp init error:', e);
    }
  },
  
  getUser: () => {
    const tg = getTg();
    return tg?.initDataUnsafe?.user || { id: 0, username: 'Guest' };
  },

  close: () => {
    getTg()?.close();
  },

  showAlert: (message: string) => {
    const tg = getTg();
    if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
      tg.showAlert(message);
    } else {
      window.alert(message);
    }
  },

  showConfirm: (message: string, callback: (ok: boolean) => void) => {
    const tg = getTg();
    if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
      tg.showConfirm(message, callback);
    } else {
      const result = window.confirm(message);
      callback(result);
    }
  },

  showPopup: (params: { title?: string; message: string; buttons?: any[] }) => {
    const tg = getTg();
    if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
      tg.showPopup(params);
    } else {
      window.alert(`${params.title ? params.title + '\n' : ''}${params.message}`);
    }
  },

  openTelegramLink: (url: string) => {
    const tg = getTg();
    if (tg?.openTelegramLink) {
      try {
        tg.openTelegramLink(url);
      } catch (e) {
        console.warn('Native openTelegramLink failed, using window.open');
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  },

  haptic: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    const tg = getTg();
    if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(style);
    }
  },

  MainButton: {
    setParams: (params: any) => {
      getTg()?.MainButton?.setParams(params);
    },
    show: () => {
      getTg()?.MainButton?.show();
    },
    hide: () => {
      getTg()?.MainButton?.hide();
    },
    onClick: (fn: () => void) => {
      getTg()?.MainButton?.onClick(fn);
    },
    offClick: (fn: () => void) => {
      getTg()?.MainButton?.offClick(fn);
    },
    showProgress: (leaveActive: boolean) => {
      getTg()?.MainButton?.showProgress(leaveActive);
    },
    hideProgress: () => {
      getTg()?.MainButton?.hideProgress();
    },
  }
};
