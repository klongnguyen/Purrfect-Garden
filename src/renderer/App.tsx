import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { useAppStore } from './stores/useAppStore';
import { useTimerStore } from './stores/useTimerStore';

export default function App() {
  const initializeApp = useAppStore((s) => s.initializeApp);
  const initializeTimer = useTimerStore((s) => s.initializeTimer);

  useEffect(() => {
    void initializeApp();
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void initializeTimer().then((unsub) => {
      if (cancelled) {
        unsub();
      } else {
        cleanup = unsub;
      }
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [initializeApp, initializeTimer]);

  return <AppShell />;
}
