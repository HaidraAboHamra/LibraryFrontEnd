import React, { useEffect, useState } from 'react'
import api from '../api/axios'

export default function WalletTopUp(){
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(50);
  const [history, setHistory] = useState<any[]>([]);
  const userId = 1; // for demo — عدّل حسب جلسة المستخدم

  async function load(){
    try{
      const r1 = await api.get(`/users/${userId}`);
      setBalance(r1.data.balance || 0);
    }catch(e){}
    try{
      const r2 = await api.get(`/admin/wallet/topups`, { params: { userId } });
      setHistory(r2.data.data || r2.data || []);
    }catch(e){}
  }

  useEffect(()=>{ load() }, [])

  async function topup(){
    await api.post(`/users/${userId}/wallet/topup`, { amount });
    await load();
    alert('تم شحن المحفظة');
  }

  return (
    <div className="p-6 bg-purple-50 min-h-screen">
      <h2 className="text-xl font-bold text-purple-900 mb-4">شحن محفظة المستخدم</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="mb-2">الرصيد الحالي: <strong>{balance} USD</strong></div>
        <div className="flex gap-2 items-center">
          <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} className="p-2 border rounded" />
          <button onClick={topup} className="px-4 py-2 bg-purple-800 text-white rounded">شحن</button>
        </div>
      </div>

      <h3 className="text-lg mb-2">سجل الشحنات</h3>
      <div className="bg-white p-4 rounded shadow">
        {history.length === 0 ? <div>لا يوجد</div> : (
          <ul>
            {history.map((h,i)=> <li key={i} className="py-2 border-b">{h.amount} — {h.created_at}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}
