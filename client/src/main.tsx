import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

// Automatic PWA Service Worker & Cache Buster so mobile phones always get the latest UI immediately
const APP_BUILD_VERSION = '2026.10.24.v11';
try {
  const savedVersion = localStorage.getItem('cams_build_version');
  if (savedVersion !== APP_BUILD_VERSION) {
    localStorage.setItem('cams_build_version', APP_BUILD_VERSION);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const reg of registrations) {
          reg.update().catch(() => {});
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then(keys => {
        Promise.all(keys.map(k => caches.delete(k))).then(() => {
          if (savedVersion) {
            window.location.reload();
          }
        });
      });
    }
  }
} catch {}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CAMS Application Error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0055FF] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white text-slate-900 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-black text-xl">
              !
            </div>
            <h2 className="text-xl font-black text-slate-900">Application Refresh Required</h2>
            <p className="text-xs text-slate-500">
              The application encountered a state issue or cached session conflict.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-slate-100 rounded-xl text-left text-[11px] text-rose-700 font-mono overflow-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 rounded-full bg-[#0055FF] hover:bg-[#0044CC] text-white text-xs font-bold shadow-lg transition-all"
              >
                Clear Cache & Reload App
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </AuthProvider>
    </RootErrorBoundary>
  </React.StrictMode>,
);
