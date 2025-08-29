// src/pages/AdminLogin.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login } = useAuth();

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message ?? err?.message ?? 'خطأ في تسجيل الدخول';
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page" dir="rtl">
      <form className="login-card" onSubmit={submit}>
        <h2 className="login-title">تسجيل دخول المشرف</h2>
        <p className="login-sub">أدخل بيانات المشرف للمتابعة</p>

        <label className="field">
          <span>البريد الإلكتروني</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>

        <label className="field">
          <span>كلمة المرور</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>

        <div className="actions">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </div>
      </form>
    </div>
  );
}
