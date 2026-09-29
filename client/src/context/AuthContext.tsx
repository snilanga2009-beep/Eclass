import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiRequest, setAuthToken, clearAuthToken, getAuthToken } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  parentLogin: (phone: string) => Promise<{ user: User; children: any[] }>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest<User>('/auth/me');
      setUser(data);
    } catch (err) {
      setUser(null);
      clearAuthToken();
    } finally {
      setLoading(false);
    }
  };

  const parentLogin = async (phone: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User; children: any[] }>('/auth/parent-login', {
        method: 'POST',
        body: JSON.stringify({ phone })
      });
      setAuthToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check if URL contains direct parent login parameters (from SMS link)
    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('parentPhone') || urlParams.get('phone');

    if (phoneParam) {
      parentLogin(phoneParam)
        .then(() => {
          // Remove query params from browser address bar smoothly
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        })
        .catch(err => {
          console.warn('Auto-login from parent phone link failed:', err);
          // Fall back to stored token
          const token = getAuthToken();
          if (token) fetchProfile();
          else setLoading(false);
        });
      return;
    }

    // 2. Otherwise load existing persistent 365-day token
    const token = getAuthToken();
    if (token) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);

      fetchProfile().finally(() => clearTimeout(timer));
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('cams:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('cams:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, password = 'password123') => {
    setLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setAuthToken(data.token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User }>('/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ targetRole })
      });
      setAuthToken(data.token);
      setUser(data.user);
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, parentLogin, switchRole, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
