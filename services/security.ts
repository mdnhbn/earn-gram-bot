
export const SecurityService = {
  generateFingerprint: async (): Promise<string> => {
    const components = [
      navigator.userAgent,
      screen.width,
      screen.height,
      screen.colorDepth,
      navigator.language,
      new Date().getTimezoneOffset(),
      (navigator as any).deviceMemory || 0,
      (navigator as any).hardwareConcurrency || 0,
    ];
    
    const fingerprintString = components.join('|');
    
    // Simple hash function to create a shorter ID
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    
    return 'dev-' + Math.abs(hash).toString(16);
  },

  getIpAddress: async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (e) {
      return 'unknown';
    }
  }
};
