import { useEffect, useState } from 'react';

export function useOnlineStatus(simulateOffline: boolean = false) {
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If user has activated "Simulate Offline Mode" in settings/header, force offline status
  const effectiveOnline = simulateOffline ? false : browserOnline;

  return {
    isOnline: effectiveOnline,
    browserOnline,
    isSimulated: simulateOffline,
  };
}
