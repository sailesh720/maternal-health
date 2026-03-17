import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';
import type { User } from '../types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          const me = await authApi.me();
          setUser(me);
        }
      } catch {
        await SecureStore.deleteItemAsync('auth_token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    await SecureStore.setItemAsync('auth_token', data.access_token);
    const me = await authApi.me();
    setUser(me);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
