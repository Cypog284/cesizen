import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { User, RegisterData } from '../types';
import { authApi } from '../api/services';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';

const TOKEN_KEY = 'cesizen_token';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    loadStoredToken();
  }, []);

  async function loadStoredToken() {
    try {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        setAuthToken(stored);
        setToken(stored);
        const me = await authApi.getMe();
        setUser(me);
      }
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { token: t, user: u } = await authApi.login(email, password);
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    setAuthToken(t);
    setToken(t);
    setUser(u);
  }

  async function register(data: RegisterData) {
    const { token: t, user: u } = await authApi.register(data);
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    setAuthToken(t);
    setToken(t);
    setUser(u);
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
    router.replace('/(auth)/login');
  }

  async function refreshUser() {
    const me = await authApi.getMe();
    setUser(me);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
