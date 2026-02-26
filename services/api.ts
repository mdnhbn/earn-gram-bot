export const fetchWithTimeout = async (url: string, options: any = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response;
    } else {
      const text = await response.text();
      const errorMsg = `API Error: Expected JSON from ${url} but received ${contentType}. Content: ${text.slice(0, 100)}...`;
      console.error(errorMsg);
      
      // Return a fake response object that won't crash the app
      return {
        ok: false,
        status: response.status,
        json: async () => ({ error: 'Invalid response format', isHtml: contentType?.includes('text/html') })
      } as any;
    }
  } catch (error) {
    clearTimeout(id);
    console.warn(`Fetch to ${url} failed (network error or timeout):`, error);
    return {
      ok: false,
      json: async () => ({ error: 'Network error' })
    } as any;
  }
};
