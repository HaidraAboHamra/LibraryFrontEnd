import React, { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Coupons(){
  const [code,setCode] = useState('');
  const [discount,setDiscount] = useState(10);
  const [coupons, setCoupons] = useState<any[]>([]);

  async function load(){
    try{
      const r = await api.get('/admin/coupons');
      setCoupons(r.data.data || r.data || []);
    }catch(e){}
  }
  useEffect(()=>{ load() }, [])

  async function add(){
    try{
      await api.post('/admin/coupons', { code, discount });
      setCode(''); setDiscount(10);
      load();
    }catch(e){ console.error(e) }
  }

  return (
    <div className="p-6 bg-purple-50 min-h-screen">
      <h2 className="text-xl font-bold text-purple-900 mb-4">الخصومات (Coupons)</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex gap-2">
          <input value={code} placeholder="الكود" onChange={e=>setCode(e.target.value)} className="p-2 border rounded" />
          <input type="number" value={discount} onChange={e=>setDiscount(Number(e.target.value))} className="p-2 border rounded w-32" />
          <button onClick={add} className="px-3 py-2 bg-purple-800 text-white rounded">إضافة</button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        {coupons.length === 0 ? <div>لا يوجد</div> : (
          <ul>
            {coupons.map((c:any)=> <li key={c.id} className="py-2 border-b">{c.code} — {c.discount}%</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}
