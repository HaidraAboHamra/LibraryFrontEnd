import React, { useState } from 'react'
import api from '../api/axios'

export default function BookForm({ onClose }: { onClose: ()=>void }){
  const [title,setTitle] = useState('');
  const [author,setAuthor] = useState('');
  const [loading,setLoading] = useState(false);

  async function submit(e:any){
    e.preventDefault();
    setLoading(true);
    try{
      await api.post('/admin/books', { title, author });
      onClose();
    }catch(err){ console.error(err) }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-6 rounded w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">إضافة كتاب</h3>
        <label className="block mb-3">العنوان
          <input value={title} onChange={e=>setTitle(e.target.value)} className="block w-full border p-2 rounded mt-1" />
        </label>
        <label className="block mb-4">المؤلف
          <input value={author} onChange={e=>setAuthor(e.target.value)} className="block w-full border p-2 rounded mt-1" />
        </label>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">إلغاء</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-800 text-white rounded">{loading ? '...' : 'حفظ'}</button>
        </div>
      </form>
    </div>
  )
}
