import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser } from '../lib/api.ts';
import type { User } from '../types/index.ts';

interface PasswordValidation {
  length: boolean;
  upper: boolean;
  lower: boolean;
  special: boolean;
  isValid: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  checkPasswordRules: (password: string) => PasswordValidation;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function checkPasswordRules(password: string): PasswordValidation {
  const length = (password || '').length >= 8;
  const upper = /[A-Z]/.test(password || '');
  const lower = /[a-z]/.test(password || '');
  const special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password || '');

  return {
    length,
    upper,
    lower,
    special,
    isValid: length && upper && lower && special,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aerowings_auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    setUser(res.user);
    try {
      localStorage.setItem('aerowings_auth_user', JSON.stringify(res.user));
    } catch {
      // ignore
    }
    return res.user;
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await registerUser(name, email, password);
    setUser(res.user);
    try {
      localStorage.setItem('aerowings_auth_user', JSON.stringify(res.user));
    } catch {
      // ignore
    }
    return res.user;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('aerowings_auth_user');
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        checkPasswordRules,
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
