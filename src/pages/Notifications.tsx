import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "./AdminBooks.css";

type Notification = {
  id: number;
  title: string;
  message: string;
  created_at: string;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      const res = await api.get("/notification/get");
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  async function deleteNotification(id: number) {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="admin-books">
      <div className="admin-books__container">
        <div className="admin-books__header">
          <div>
            <h2 className="admin-books__title">الإشعارات</h2>
            <p className="admin-books__subtitle">
              عرض جميع الإشعارات للمستخدم الحالي
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty">جاري التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="empty">لا توجد إشعارات</div>
        ) : (
          <div className="cards-grid">
            {notifications.map((notif) => (
              <div key={notif.id} className="card">
                <div className="card__inner">
                  <div className="card__header">
                    <div className="card__thumb">🔔</div>
                    <div>
                      <h3 className="card__title">{notif.title || "إشعار"}</h3>
                      <p className="card__author">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="card__desc">{notif.message}</div>
                  <div className="card__footer">
                    <button
                      className="btn btn--danger"
                      onClick={() => deleteNotification(notif.id)}
                    >
                      حذف
                    </button>
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
