// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

type Admin = { email?: string; id?: number } | null;

type AuthContextType = {
  admin: Admin;
  setAdmin: (a: Admin) => void;
  login: (email: string, password: string) => Promise<Admin>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdminState] = useState<Admin>(null);
  const [loading, setLoading] = useState(true);

  function setAdmin(a: Admin) {
    setAdminState(a);
    if (a) localStorage.setItem('admin', JSON.stringify(a));
    else localStorage.removeItem('admin');
  }

  async function login(email: string, password: string) {
    const res = await api.post('/login', { email, password });
    // Laravel example returns access_token and user
    const token = res.data?.access_token ?? res.data?.token ?? null;
    const user = res.data?.user ?? res.data?.admin ?? null;

    if (!token) throw new Error('بيانات الدخول غير صحيحة');

    // store token under a single key
    localStorage.setItem('access_token', token);
    // set default header for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // store user/admin
    if (user) {
      setAdmin(user);
      return user;
    } else {
      // fallback: create minimal admin object
      const adminData = { email };
      setAdmin(adminData);
      return adminData;
    }
  }

  async function logout() {
    try {
      // call backend logout if exists (sanctum/jwt)
      await api.post('/logout');
    } catch (e) {
      // ignore network errors but continue clearing
      console.warn('logout request failed', e);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('admin');
    delete api.defaults.headers.common['Authorization'];
    setAdmin(null);
  }

  useEffect(() => {
    // on mount, restore admin + token if present
    const token = localStorage.getItem('access_token') ?? localStorage.getItem('token');
    const adminRaw = localStorage.getItem('admin');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    if (adminRaw) {
      try {
        setAdminState(JSON.parse(adminRaw));
      } catch {
        setAdminState(null);
      }
    }
    setLoading(false);
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        جاري التحميل...
      </div>
    );

  return (
    <AuthContext.Provider value={{ admin, setAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
