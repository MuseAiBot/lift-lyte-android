import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { getOfflineQueue } from '../utils/storage';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSimulated?: boolean;
  onSyncQueue?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  isSimulated = false,
  onSyncQueue,
}) => {
  const [queueCount, setQueueCount] = useState(0);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const updateQueue = () => {
      setQueueCount(getOfflineQueue().length);
    };
    updateQueue();
    const interval = setInterval(updateQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline && queueCount > 0) {
      setJustReconnected(true);
      if (onSyncQueue) onSyncQueue();
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queueCount, onSyncQueue]);

  if (isOnline && !justReconnected) {
    return null;
  }

  if (justReconnected) {
    return (
      <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-xl bg-emerald-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-black shadow-lg border border-emerald-400 animate-in fade-in slide-in-from-bottom-2">
        <CheckCircle2 className="w-4 h-4 animate-bounce" />
        <span>Reconnected! Synced offline workout data.</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2.5 rounded-xl bg-zinc-900/95 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-amber-400 shadow-xl border border-amber-500/30 animate-in fade-in slide-in-from-bottom-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      </span>
      <div className="flex items-center gap-1.5">
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span>
          Offline Mode {isSimulated ? '(Simulated)' : 'Active'} — All reps & sets saved locally
        </span>
      </div>
      {queueCount > 0 && (
        <span className="ml-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
          {queueCount} pending sync
        </span>
      )}
    </div>
  );
};
