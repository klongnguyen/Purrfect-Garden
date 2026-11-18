import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { useAppStore } from './stores/useAppStore';

export default function App() {
  const initializeApp = useAppStore((s) => s.initializeApp);

  useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  return <AppShell />;
}

