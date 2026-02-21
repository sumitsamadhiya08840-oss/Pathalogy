'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContextType, AuthState, LoginCredentials, User } from '@/types/auth';
import { authService } from '@/services/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [loading, setLoading] = useState(true);

  // Load auth state on mount
  useEffect(() => {
    const loadAuth = async () => {
      const savedState = authService.loadAuthState();
      if (savedState && savedState.token) {
        const isValid = await authService.verifyToken(savedState.token);
        if (isValid) {
          setState(savedState);
        } else {
          authService.clearAuthState();
        }
      }
      setLoading(false);
    };

    loadAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { user, token } = await authService.login(credentials);
      const newState: AuthState = {
        isAuthenticated: true,
        user,
        token,
      };
      setState(newState);
      authService.saveAuthState(newState);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
    authService.clearAuthState();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
