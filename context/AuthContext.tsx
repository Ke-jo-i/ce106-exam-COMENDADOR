/* eslint-disable @typescript-eslint/no-unused-vars -- Setters and imports are reserved for exam TODOs. */
import * as SecureStore from 'expo-secure-store';
import { createContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/api';

export type User = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  authLoading: boolean;
  login: (accessToken: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const TOKEN_KEY = 'auth_token';

// Safe platform storage helper
async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  } catch (error) {
    console.error('Error reading token:', error);
    return null;
  }
}

async function setStoredToken(token: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error saving token:', error);
  }
}

async function removeStoredToken(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error deleting token:', error);
  }
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const login = async (accessToken: string, userData: User) => {
    try {
      await setStoredToken(accessToken);
      setToken(accessToken);
      setUser(userData);
    } catch (error) {
      console.error('Login storage error:', error);
    }
  };

  const logout = async () => {
    try {
      await removeStoredToken();
    } catch (error) {
      console.error('Logout storage error:', error);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const restoreSession = async () => {
    setAuthLoading(true);
    try {
      const savedToken = await getStoredToken();
      
      if (!savedToken) {
        setToken(null);
        setUser(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (response.ok) {
        const userData: User = await response.json();
        setToken(savedToken);
        setUser(userData);
      } else {
        await removeStoredToken();
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
      await removeStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, authLoading, login, logout, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}