
declare global {
  interface Window {
    Telegram: any;
  }
}

const tg = window.Telegram?.WebApp;

export const TelegramService = {
  init: () => {
    try {
      tg?.ready();
      tg?.expand();
    } catch (e) {
      console.error('Telegram WebApp init error:', e);
    }
  },
  
  getUser: () => {
    return tg?.initDataUnsafe?.user || { id: 12345678, username: 'Guest' };
  },

  close: () => {
    tg?.close();
  },

  showAlert: (message: string) => {
    if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
      tg.showAlert(message);
    } else {
      window.alert(message);
    }
  },

  showConfirm: (message: string, callback: (ok: boolean) => void) => {
    if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
      tg.showConfirm(message, callback);
    } else {
      const result = window.confirm(message);
      callback(result);
    }
  },

  showPopup: (params: { title?: string; message: string; buttons?: any[] }) => {
    if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
      tg.showPopup(params);
    } else {
      window.alert(`${params.title ? params.title + '\n' : ''}${params.message}`);
    }
  },

  openTelegramLink: (url: string) => {
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  },

  haptic: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    if (tg?.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(style);
    }
  },

  MainButton: {
    setParams: (params: any) => {
      if (tg?.MainButton) tg.MainButton.setParams(params);
    },
    show: () => {
      if (tg?.MainButton) tg.MainButton.show();
    },
    hide: () => {
      if (tg?.MainButton) tg.MainButton.hide();
    },
    onClick: (fn: () => void) => {
      if (tg?.MainButton) tg.MainButton.onClick(fn);
    },
    offClick: (fn: () => void) => {
      if (tg?.MainButton) tg.MainButton.offClick(fn);
    },
    showProgress: (leaveActive: boolean) => {
      if (tg?.MainButton) tg.MainButton.showProgress(leaveActive);
    },
    hideProgress: () => {
      if (tg?.MainButton) tg.MainButton.hideProgress();
    },
  }
};
