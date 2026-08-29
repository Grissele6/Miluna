import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAllSettings, setSetting } from '../db/repositories';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState({});

  const reload = useCallback(async () => {
    const s = await getAllSettings();
    setSettings(s);
    setReady(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(
    async (key, value) => {
      await setSetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const value = useMemo(
    () => ({
      ready,
      settings,
      stage: settings.stage || 'adulta',
      age: settings.age ? parseInt(settings.age, 10) : null,
      onboarded: settings.onboarded === '1',
      update,
      reload,
    }),
    [ready, settings, update, reload]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}
