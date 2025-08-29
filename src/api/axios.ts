// src/api/axios.ts
import axios from 'axios';

// اقرأ القاعدة بأمان: دعم Vite (import.meta.env) أولًا، ثم CRA (process.env) إن وُجد، وإلا استخدم القيمة الافتراضية.
const baseURL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) ||
  (typeof process !== 'undefined' && (process as any).env?.REACT_APP_API_BASE) ||
  'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
});

// attach token if present (we check both keys for compatibility)
const token =
  (typeof window !== 'undefined' && (localStorage.getItem('access_token') || localStorage.getItem('token'))) ||
  null;

if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api;
