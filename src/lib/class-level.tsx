'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ClassLevel } from './types';
import { useAuth } from './auth';

export const CLASSES: { id: ClassLevel; label: string; available: boolean }[] = [
  { id: '9', label: 'Class 9', available: true },
  { id: '10', label: 'Class 10', available: true },
  { id: '11', label: 'Class 11', available: false },
  { id: '12', label: 'Class 12', available: false },
];

const KEY = 'novix.class';
const Ctx = createContext<{ cls: ClassLevel; setCls: (c: ClassLevel) => void }>({ cls: '9', setCls: () => undefined });

export function ClassLevelProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cls, setClsState] = useState<ClassLevel>('9');

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as ClassLevel | null;
    if (saved && CLASSES.some((c) => c.id === saved)) setClsState(saved);
  }, []);
  useEffect(() => {
    if (user && !window.localStorage.getItem(KEY) && CLASSES.some((c) => c.id === user.classLevel && c.available)) setClsState(user.classLevel as ClassLevel);
  }, [user]);

  const setCls = (c: ClassLevel) => { setClsState(c); window.localStorage.setItem(KEY, c); };
  return <Ctx.Provider value={{ cls, setCls }}>{children}</Ctx.Provider>;
}

export const useClassLevel = () => useContext(Ctx);
