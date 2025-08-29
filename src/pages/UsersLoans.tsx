import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "./AdminBooks.css";

type Borrowed = {
  id: number;
  borrow_date: string;
  due_date: string;
  borrower_name: string;
  book_status: string;
  book?: { title: string; author: string };
  user?: { name: string; email: string };
};

export default function UsersLoans() {
  const [borrowedList, setBorrowedList] = useState<Borrowed[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get("/BorrowedBook/get");
      setBorrowedList(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="admin-books">
      <div className="admin-books__container">
        <div className="admin-books__header">
          <div>
            <h2 className="admin-books__title">قائمة الكتب المستعارة</h2>
          </div>
        </div>

        {loading ? (
          <div className="empty">جاري التحميل...</div>
        ) : borrowedList.length === 0 ? (
          <div className="empty">لا يوجد بيانات</div>
        ) : (
          <div className="cards-grid">
            {borrowedList.map((item) => (
              <div key={item.id} className="card">
                <div className="card__inner">
                  <div className="card__header">
                    <div className="card__thumb">
                      {item.user?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="card__title">
                        {item.user?.name || "مستخدم مجهول"}
                      </h3>
                      <p className="card__author">{item.user?.email}</p>
                    </div>
                  </div>

                  <div className="card__desc">
                    <p>
                      <strong>📖 الكتاب:</strong>{" "}
                      {item.book?.title || "غير معروف"} -{" "}
                      {item.book?.author || "غير معروف"}
                    </p>
                    <p>
                      <strong>📅 تاريخ الاستعارة:</strong> {item.borrow_date}
                    </p>
                    <p>
                      <strong>📅 تاريخ الإرجاع:</strong> {item.due_date}
                    </p>
                    <p>
                      <strong>📌 الحالة:</strong> {item.book_status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
