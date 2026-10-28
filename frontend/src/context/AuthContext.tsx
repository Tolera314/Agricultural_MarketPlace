'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type AuthUser,
  type AuthState,
  subscribeToAuth,
  restoreSession,
  loginWithCredentials,
  logout as authLogout,
  logoutAll as authLogoutAll,
  refreshSession,
} from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: (identifier: string, pass: string, remember?: boolean) => Promise<{ success: boolean; user?: AuthUser; error?: string; field?: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refresh: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // 1. Subscribe to auth changes
    const unsubscribe = subscribeToAuth((newState) => {
      setAuthState(newState);
    });

    // 2. Perform silent session restoration from HttpOnly cookie
    restoreSession().finally(() => {
      // Done restoring
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (identifier: string, pass: string, remember = false) => {
    return loginWithCredentials(identifier, pass, remember);
  };

  const logout = async () => {
    await authLogout();
  };

  const logoutAll = async () => {
    await authLogoutAll();
  };

  const refresh = async () => {
    return refreshSession();
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        logoutAll,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
