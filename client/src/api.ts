// API Client Helper for CAMS
const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('cams_token') : null;
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  try {
    if (typeof window !== 'undefined') localStorage.setItem('cams_token', token);
  } catch {}
};

export const clearAuthToken = (): void => {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem('cams_token');
  } catch {}
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  // Cache busting for GET requests to guarantee fresh data on refresh
  const method = (options.method || 'GET').toUpperCase();
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}_t=${Date.now()}`;
  }

  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers
  });

  if (response.status === 401) {
    // Unauthorized
    clearAuthToken();
    window.dispatchEvent(new CustomEvent('cams:unauthorized'));
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `HTTP Error ${response.status}`);
  }

  return data as T;
}

export async function clearAppCache(): Promise<{ success: boolean; message: string }> {
  try {
    // Call server to reload DB and drop in-memory cache
    const res = await apiRequest('/clear-cache', { method: 'POST' }).catch(() => null);

    // Clear browser CacheStorage (PWA / Service Worker caches)
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }

    // Unregister any active service worker registrations so fresh code runs
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        reg.update().catch(() => {});
      }
    }

    return {
      success: true,
      message: res?.message || 'Cache cleared and system synchronized successfully!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to clear cache completely.'
    };
  }
}

// Currency Formatter Helper (LKR / Rs.)
export const formatLKR = (amount: number): string => {
  return 'Rs. ' + Math.round(amount || 0).toLocaleString('en-LK');
};

// Date Formatter Helper
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};
