import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import './Statistics.css'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

type Purchase = {
  id?: number
  book_id?: number
  book_title?: string
  amount?: number
  quantity?: number
  created_at?: string
}

export default function Statistics() {
  const [from, setFrom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [error, setError] = useState<string | null>(null)

  const { totalIncome, totalSales, avgPrice, topBooks, dailySeries } = useMemo(() => {
    const start = new Date(from)
    start.setHours(0, 0, 0, 0)
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)

    const filtered = purchases.filter((p) => {
      if (!p.created_at) return false
      const d = new Date(p.created_at)
      return d >= start && d <= end
    })

    let income = 0
    let salesCount = 0
    const bookMap: Record<string, { title: string; qty: number; revenue: number }> = {}

    filtered.forEach((p) => {
      const amt = Number(p.amount ?? 0)
      const qty = Number(p.quantity ?? 1)
      income += amt
      salesCount += qty

      const bookId = String(p.book_id ?? p.id ?? Math.random().toString())
      const title = p.book_title ?? `كتاب ${bookId}`
      if (!bookMap[bookId]) bookMap[bookId] = { title, qty: 0, revenue: 0 }
      bookMap[bookId].qty += qty
      bookMap[bookId].revenue += amt
    })

    const top = Object.entries(bookMap)
      .map(([id, v]) => ({ id, title: v.title, qty: v.qty, revenue: v.revenue }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)

    const days: string[] = []
    const seriesMap: Record<string, number> = {}
    const dt = new Date(start)
    while (dt <= end) {
      const key = dt.toISOString().slice(0, 10)
      days.push(key)
      seriesMap[key] = 0
      dt.setDate(dt.getDate() + 1)
    }
    filtered.forEach((p) => {
      if (!p.created_at) return
      const key = new Date(p.created_at).toISOString().slice(0, 10)
      seriesMap[key] = (seriesMap[key] || 0) + Number(p.amount ?? 0)
    })
    const series = days.map((d) => ({ date: d, value: seriesMap[d] || 0 }))

    return {
      totalIncome: income,
      totalSales: salesCount,
      avgPrice: salesCount ? income / salesCount : 0,
      topBooks: top,
      dailySeries: series,
    }
  }, [purchases, from, to])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get('/Purchase/get', { params: { from, to, per_page: 1000 } })
    
        console.log('Purchase GET raw response:', res)
    
        const rawPayload = res.data?.data ?? res.data ?? res.data?.items ?? []
    
        const list = Array.isArray(rawPayload)
          ? rawPayload
          : Array.isArray(rawPayload?.data)
          ? rawPayload.data
          : []
    
        const parseDate = (s: any) => {
          if (!s) return null
          if (s instanceof Date) return s
          try {
            const attempts = [String(s), String(s).replace(' ', 'T'), String(s).replace(' ', 'T') + 'Z']
            for (const a of attempts) {
              const d = new Date(a)
              if (!isNaN(d.getTime())) return d.toISOString() 
            }
          } catch {}
          return null
        }
    
        const normalized = list.map((it: any) => {
          const qty = Number(it.quantity ?? it.qty ?? it.count ?? 1)
          const rawTotal = it.amount ?? it.total_price ?? it.total ?? null
          const unit = it.unit_price ?? it.unitPrice ?? it.price ?? null
          const amount = Number(rawTotal ?? (unit != null ? Number(unit) * qty : 0)) || 0
    
          const dateStr = it.created_at ?? it.purchase_date ?? it.createdAt ?? it.date ?? null
          const created_at = parseDate(dateStr) ?? null
    
          const bookTitle =
            it.book_title ??
            it.book?.book_title ??
            it.book?.title ??
            it.title ??
            (it.book_id ? `كتاب ${it.book_id}` : null)
    
          return {
            id: it.id ?? undefined,
            book_id: it.borrower_name ?? it.book?.id ?? undefined,
            book_title: bookTitle,
            amount,
            quantity: qty,
            created_at, 
            _raw: it, 
          }
        })
    
        console.log('normalized purchases sample (first 5):', normalized.slice(0, 5))
        setPurchases(normalized.map((p: any) => ({
          ...p,
          // حافظ على created_at كـ string لتعمل الشيفرة الموجودة لاحقًا
          created_at: p.created_at ? p.created_at : null
        })))
      } catch (err) {
        console.error('Failed loading purchases, fallback to BorrowedBook/get', err)
        // fallback كما عندك
        try {
          const res2 = await api.get('/BorrowedBook/get', { params: { from, to, per_page: 1000 } })
          const payload2 = res2.data?.data ?? res2.data ?? []
          setPurchases(Array.isArray(payload2) ? payload2 : [])
        } catch (err2) {
          console.error('Fallback failed', err2)
          setError('فشل جلب البيانات من الخادم.')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [from, to])

  // بيانات الرسم الخطي (revenue over days)
  const lineData = {
    labels: dailySeries.map((s) => s.date),
    datasets: [
      {
        label: 'الإيراد (USD)',
        data: dailySeries.map((s) => Math.round(s.value * 100) / 100),
        fill: true,
        tension: 0.2,
        borderColor: '#6A36F1',
        backgroundColor: 'rgba(106,54,241,0.12)',
        pointRadius: 3,
      },
    ],
  }

  const barData = {
    labels: topBooks.map((b) => b.title),
    datasets: [
      {
        label: 'الكمية المباعة',
        data: topBooks.map((b) => b.qty),
        backgroundColor: topBooks.map((_, i) => `rgba(132,82,230, ${0.85 - i * 0.08})`),
      },
    ],
  }

  function setPreset(range: 'today' | 'month' | 'year' | 'week') {
    const now = new Date()
    if (range === 'today') {
      const d = now.toISOString().slice(0, 10)
      setFrom(d)
      setTo(d)
    } else if (range === 'week') {
      const s = new Date()
      s.setDate(now.getDate() - 7)
      setFrom(s.toISOString().slice(0, 10))
      setTo(now.toISOString().slice(0, 10))
    } else if (range === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      setFrom(s.toISOString().slice(0, 10))
      setTo(now.toISOString().slice(0, 10))
    } else {
      const s = new Date(now.getFullYear(), 0, 1)
      setFrom(s.toISOString().slice(0, 10))
      setTo(now.toISOString().slice(0, 10))
    }
  }

  return (
    <div className="stats-page">
      <div className="stats-page__container">
        <header className="stats-header">
          <h2>لوحة الإحصاءات</h2>
        </header>

        <section className="stats-controls">
          <div className="date-controls">
            <label>
              من
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label>
              إلى
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>

          <div className="presets">
            <button onClick={() => setPreset('today')} className="btn-small">اليوم</button>
            <button onClick={() => setPreset('week')} className="btn-small">آخر 7 أيام</button>
            <button onClick={() => setPreset('month')} className="btn-small">هذا الشهر</button>
            <button onClick={() => setPreset('year')} className="btn-small">هذه السنة</button>
            <button onClick={() => {setFrom((f) => f); setTo((t) => t) }} className="btn-small btn-refresh">تحديث</button>
          </div>
        </section>

        {error && <div className="alert">{error}</div>}

        <section className="kpis">
          <div className="kpi-card">
            <div className="kpi-title">الإيراد الكلي</div>
            <div className="kpi-value">{totalIncome.toLocaleString()} USD</div>
            <div className="kpi-sub muted">{totalSales} عملية</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">إجمالي المبيعات</div>
            <div className="kpi-value">{totalSales}</div>
            <div className="kpi-sub muted">متوسط سعر: {avgPrice ? Math.round(avgPrice * 100) / 100 : 0}USD</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">عدد الكتب الفعّالة</div>
            <div className="kpi-value">{topBooks.length}</div>
            <div className="kpi-sub muted">أعلى الكتب مبيعاً</div>
          </div>
        </section>

        <section className="charts">
          <div className="chart-left">
            <h3>الإيراد اليومي</h3>
            <div className="chart-wrap">
              <Line data={lineData} />
            </div>
          </div>

          <div className="chart-right">
            <h3>الأكثر مبيعاً (Top)</h3>
            <div className="chart-wrap">
              <Bar data={barData} />
            </div>

            <div className="top-list">
              {topBooks.length === 0 ? (
                <div className="muted">لا توجد بيانات</div>
              ) : (
                <ol>
                  {topBooks.slice(0, 5).map((b, idx) => (
                    <li key={b.id}>
                      <strong>{b.title}</strong>
                      <span className="muted"> — {b.qty} نسخة — {Math.round(b.revenue * 100) / 100} USD</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>

        <section className="detail-table">
          <h3>قائمة العمليات ({purchases.length})</h3>
          {loading ? (
            <div className="muted">جارِ التحميل...</div>
          ) : purchases.length === 0 ? (
            <div className="muted">لا توجد عمليات ضمن الفترة المحددة.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الكتاب</th>
                    <th>المبلغ (USD)</th>
                    <th>الكمية</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => (
                    <tr key={p.id ?? i}>
                      <td>{i + 1}</td>
                      <td>{p.book_title ?? `ID ${p.book_id ?? '-'}`}</td>
                      <td>{Number(p.amount ?? 0)}</td>
                      <td>{Number(p.quantity ?? 1)}</td>
                      <td>{p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
