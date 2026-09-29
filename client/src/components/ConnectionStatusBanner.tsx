import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../api';

export const ConnectionStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncCount, setSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Check queue length
  const checkQueue = () => {
    try {
      const q = JSON.parse(localStorage.getItem('CAMS_OFFLINE_ATTENDANCE_QUEUE') || '[]');
      setSyncCount(q.length);
    } catch {
      setSyncCount(0);
    }
  };

  const handleSync = async () => {
    if (!navigator.onLine) return;
    try {
      const rawQueue = localStorage.getItem('CAMS_OFFLINE_ATTENDANCE_QUEUE');
      if (!rawQueue) return;
      const queue = JSON.parse(rawQueue);
      if (queue.length === 0) return;

      setIsSyncing(true);
      const res = await apiRequest('/attendance/sync', {
        method: 'POST',
        body: JSON.stringify({ batch: queue })
      });

      // Clear synced queue
      localStorage.removeItem('CAMS_OFFLINE_ATTENDANCE_QUEUE');
      setSyncCount(0);
      setSyncToast(`Attendance synchronized successfully (${res.synced || queue.length} records)`);
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err: any) {
      console.error('Offline sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    checkQueue();

    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', checkQueue);

    // Periodic check for local queue items
    const interval = setInterval(checkQueue, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', checkQueue);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Toast Notification for Sync Completion */}
      {syncToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl shadow-emerald-600/30 flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 size={16} className="text-white shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="shrink-0" />
            <span>Offline mode – attendance will sync when connection returns.</span>
          </div>
          {syncCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-mono">
              {syncCount} Queued
            </span>
          )}
        </div>
      )}

      {/* Online indicator chip when queue is pending */}
      {isOnline && syncCount > 0 && (
        <div className="fixed top-16 right-4 z-40 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs shadow-lg flex items-center gap-2">
          <RefreshCw size={13} className={isSyncing ? 'animate-spin text-brand-400' : 'text-slate-400'} />
          <span>{syncCount} offline records</span>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="px-2 py-0.5 rounded bg-brand-600 hover:bg-brand-500 text-[10px] font-bold"
          >
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      )}
    </>
  );
};
