// pages/AdminWallet.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Point {
  id: number;
  user_id: number;
  points: number;
  created_at: string;
}

export default function AdminWallet() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | "">("");
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Point[]>([]);

  // جلب قائمة المستخدمين
  useEffect(() => {
    axios.get("http://localhost:8000/api/UserBook/get").then((res) => {
      setUsers(res.data);
    });
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    axios.get("http://localhost:8000/api/Point/get").then((res) => {
      setHistory(res.data);
    });
  };

  const handleRecharge = async () => {
    if (!selectedUser || points <= 0) {
      alert("يرجى اختيار مستخدم وإدخال عدد نقاط صحيح");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:8000/api/Point/create", {
        user_id: selectedUser,
        points: points,
        date: new Date().toISOString(),
      });
      alert("تم شحن المحفظة بنجاح ✅");
      setPoints(0);
      fetchHistory();
    } catch (err) {
      alert("فشل في الشحن ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">شحن محفظة المستخدم</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* اختيار المستخدم */}
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(Number(e.target.value))}
          className="p-2 border rounded-lg"
        >
          <option value="">اختر مستخدم</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>

        {/* إدخال النقاط */}
        <input
          type="number"
          placeholder="عدد النقاط"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="p-2 border rounded-lg"
        />

        {/* زر الشحن */}
        <button
          onClick={handleRecharge}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "جاري الشحن..." : "شحن"}
        </button>
      </div>

      {/* سجل الشحنات */}
      <h3 className="text-lg font-semibold mb-2">سجل عمليات الشحن</h3>
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm max-h-64 overflow-y-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b">
              <th className="p-2">المستخدم</th>
              <th className="p-2">النقاط</th>
              <th className="p-2">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b">
                <td className="p-2">{users.find((u) => u.id === h.user_id)?.name}</td>
                <td className="p-2">{h.points}</td>
                <td className="p-2">{new Date(h.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
