import React, { createContext, useContext, useState } from 'react';
import { Routine } from '@/types';

interface ActiveRoutineContextValue {
  activeRoutine: Routine | null;
  startRoutine: (routine: Routine) => void;
  clearRoutine: () => void;
}

const ActiveRoutineContext = createContext<ActiveRoutineContextValue | undefined>(undefined);

export function ActiveRoutineProvider({ children }: { children: React.ReactNode }) {
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

  const value: ActiveRoutineContextValue = {
    activeRoutine,
    startRoutine: setActiveRoutine,
    clearRoutine: () => setActiveRoutine(null),
  };

  return <ActiveRoutineContext.Provider value={value}>{children}</ActiveRoutineContext.Provider>;
}

export function useActiveRoutine(): ActiveRoutineContextValue {
  const ctx = useContext(ActiveRoutineContext);
  if (!ctx) throw new Error('useActiveRoutine must be used within ActiveRoutineProvider');
  return ctx;
}
