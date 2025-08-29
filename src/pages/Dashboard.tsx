import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css' 

export default function Dashboard() {
  const nav = useNavigate()

  const cards = [
    { title: 'إدارة الكتب', subtitle: 'إضافة / تعديل / حذف الكتب', path: '/books', emoji: '📚' },
    { title: 'الإحصاءات', subtitle: 'تفاصيل المبيعات والإيرادات', path: '/statistics', emoji: '📈' },
    { title: 'قروض المستخدمين', subtitle: 'قائمة الكتب المستعارة', path: '/users', emoji: '🧾' },
    { title: 'الاشعارات', subtitle: 'الاشعارات المرسلة', path: '/notifications', emoji: '🔔' },

  ]

  return (
    <div className="dashboard" dir="rtl">
      <div className="dashboard__container">
        <header className="dashboard__header">
          <div>
            <h1 className="dashboard__title">لوحة التحكم</h1>
          </div>
        </header>

        <main>
          <div className="dashboard__grid">
            {cards.map((c) => (
              <button
                key={c.path}
                onClick={() => nav(c.path)}
                className="dash-card"
                aria-label={c.title}
              >
                <div className="dash-card__left">
                  <div className="dash-card__icon" aria-hidden>
                    <span className="dash-card__emoji">{c.emoji}</span>
                  </div>
                </div>

                <div className="dash-card__body">
                  <div className="dash-card__title">{c.title}</div>
                  <div className="dash-card__subtitle">{c.subtitle}</div>
                </div>

                <div className="dash-card__chev" aria-hidden>›</div>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
