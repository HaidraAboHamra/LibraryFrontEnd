import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Header(){
  const { logout } = useAuth();
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <div className="text-purple-900 font-bold">Library Admin</div>
      <nav className="flex gap-2">
        <Link to="/" className="text-sm">الكتب</Link>
        <Link to="/statistics" className="text-sm">الإحصائيات</Link>
        <Link to="/wallet" className="text-sm">المحفظة</Link>
        <Link to="/coupons" className="text-sm">الخصومات</Link>
        <Link to="/users" className="text-sm">المستخدمين</Link>
        <button onClick={logout} className="text-sm">خروج</button>
      </nav>
    </header>
  )
}
