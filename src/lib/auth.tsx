'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, tokenStore } from './api';
import { useActivityHeartbeat } from './activity';
import type { User } from './types';

interface AuthCtx {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setUser: (u: User) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (!tokenStore.get()) { setReady(true); return; }
    api<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    const onUnauth = (e: Event) => {
      if (!tokenStore.get()) return;
      const msg = (e as CustomEvent<string>).detail;
      if (msg) toast.error(msg);
      logout();
    };
    window.addEventListener('novix:unauthorized', onUnauth);
    return () => window.removeEventListener('novix:unauthorized', onUnauth);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>('/auth/login', { json: { email, password } });
    tokenStore.set(r.token);
    qc.clear();
    setUser(r.user);
    return r.user;
  }, [qc]);

  useActivityHeartbeat(user?.role === 'student' ? user.id : null);

  const value = useMemo(() => ({ user, ready, login, logout, setUser }), [user, ready, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
