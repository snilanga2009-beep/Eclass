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
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
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
