import React, { useEffect, useRef, useState } from 'react'
import api from '../api/axios'
import './AdminBooks.css'

// -------------------- Types --------------------
type Book = {
  id: number
  book_title: string
  author: string
  description?: string
  price?: number
  category_id?: number
  discount?: number
  created_at?: string

  // حقول للملفات (قد تأتي بأي شكل من الباك)
  image?: string
  pdf?: string
  image_url?: string
  pdf_url?: string
}

type Meta = {
  total?: number
  page?: number
  per_page?: number
  total_pages?: number
}

// -------------------- Helpers --------------------
// يعيد رابطًا صالحًا للتحميل/العرض من نفس الدومين
// ضع هذا بعد imports (يستخدم `api` الموجودة عندك)
function fileUrl(path?: string | null): string {
  if (!path) return ''
  const p = String(path).trim()
  if (/^https?:\/\//i.test(p)) return p // رابط كامل
  // نظّف بدايات شائعة: "./", "public/", "/"...
  const cleaned = p.replace(/^(\.\/|\/+|public\/)/i, '')
  // إذا بدأ بـ storage/ اتركه، وإلا ضيف storage/
  const rel = cleaned.startsWith('storage/') ? `/${cleaned}` : `/storage/${cleaned.replace(/^\/+/, '')}`

  // حاول استخدام baseURL من axios إن كانت معرفة (مفيد عندما تكون الـ API على دومين آخر)
  try {
    const base = api?.defaults?.baseURL
      ? new URL(api.defaults.baseURL, window.location.origin).origin
      : window.location.origin
    return `${base}${rel}`
  } catch {
    return `${window.location.origin}${rel}`
  }
}


// بعض الاستجابات تأتي بشكل غير ثابت؛ نطبع الـ Book ونضمن وجود روابط جاهزة إن توفرت
function normalizeBook(raw: any): Book {
  const b: Book = {
    id: Number(raw?.id ?? 0),
    book_title: String(raw?.book_title ?? raw?.title ?? ''),
    author: String(raw?.author ?? ''),
    description: raw?.description ?? '',
    price: raw?.price != null ? Number(raw.price) : undefined,
    category_id: raw?.category_id != null ? Number(raw.category_id) : undefined,
    discount: raw?.discount != null ? Number(raw.discount) : undefined,
    created_at: raw?.created_at ?? undefined,
    image: raw?.image ?? raw?.cover ?? undefined,
    pdf: raw?.pdf ?? raw?.file ?? undefined,
    image_url: raw?.image_url ?? raw?.cover_url ?? undefined,
    pdf_url: raw?.pdf_url ?? raw?.file_url ?? undefined,
  }

  // جهّز روابط العرض (تُستخدم مباشرة في الواجهة)
  ;(b as any).__imageDisplay = b.image_url ? fileUrl(b.image_url) : fileUrl(b.image)
  ;(b as any).__pdfDisplay = b.pdf_url ? fileUrl(b.pdf_url) : fileUrl(b.pdf)

  return b
}

// -------------------- Page --------------------
export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState('created_at_desc')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [meta, setMeta] = useState<Meta>({})

  const debounceRef = useRef<number | null>(null)
  const requestId = useRef(0)

  async function load(p = page, s = search, so = sort) {
    setLoading(true)
    const currentRequest = ++requestId.current
    try {
      const res = await api.get('/Book/get', {
        params: { search: s, sort: so, page: p, per_page: perPage },
      })

      const payload = res.data
      let itemsRaw: any[] = []
      let metaRes: Meta = {}

      if (Array.isArray(payload)) itemsRaw = payload
      else if (payload?.data) {
        if (Array.isArray(payload.data)) itemsRaw = payload.data
        else if (Array.isArray(payload.data?.data)) itemsRaw = payload.data.data
        else if (Array.isArray(payload.data?.items)) itemsRaw = payload.data.items
        metaRes = payload.meta || payload.data.meta || {}
      } else if (Array.isArray(payload?.items)) {
        itemsRaw = payload.items
        metaRes = payload.meta || {}
      }

      const items = itemsRaw.map(normalizeBook)

      if (currentRequest === requestId.current) {
        setBooks(items)
        const total = metaRes.total ?? items.length
        const pages = metaRes.total_pages ?? Math.max(1, Math.ceil(total / perPage))
        setMeta({
          total,
          page: metaRes.page ?? p,
          per_page: metaRes.per_page ?? perPage,
          total_pages: pages,
        })
      }
    } catch (err) {
      console.error('Failed loading books', err)
      alert('حدث خطأ أثناء جلب الكتب، تحقق من اتصالك أو الكونسول.')
    } finally {
      setLoading(false)
    }
  }

  // احمل البيانات عند تغيير الصفحة/الفرز/عدد العناصر
  useEffect(() => {
    load(page, search, sort)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sort])

  // ابحث مع debounce
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      setPage(1)
      load(1, search, sort)
    }, 350) as unknown as number
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // عند تغيير عدد العناصر بالصفحة الأفضل نرجّع للصفحة الأولى
  useEffect(() => {
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage])

  async function removeBook(id: number) {
    if (!confirm('متأكد من حذف الكتاب؟')) return
    const snapshot = books
    setBooks((b) => b.filter((x) => x.id !== id))

    try {
      await api.post(`/Book/delete/${id}`)
    } catch (err) {
      setBooks(snapshot)
      console.error(err)
      alert('فشل الحذف. تحقق من الكونسول.')
    }
  }

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(b: Book) {
    setEditing(b)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    // إعادة التحميل لضمان تزامن البيانات بعد الإضافة/التعديل
    load(1, search, sort)
    setPage(1)
  }

  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  )

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/Category/get')
        const data = Array.isArray(res?.data?.data) ? res.data.data : (res?.data ?? [])
        setCategories(data)
      } catch (err) {
        console.error('Failed loading categories', err)
        alert('فشل جلب الأصناف من السيرفر.')
      }
    }
    loadCategories()
  }, [])

  return (
    <div className="admin-books">
      <div className="admin-books__container">
        <header className="admin-books__header">
          <div>
            <h1 className="admin-books__title">إدارة الكتب</h1>
          </div>
          <div>
            <button
              onClick={openCreate}
              className="btn btn--primary"
              aria-label="إضافة كتاب"
            >
              إضافة كتاب
            </button>
          </div>
        </header>

        <div className="admin-books__controls">
          <input
            placeholder="بحث عن كتاب أو مؤلف"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input--search"
          />

          <div className="admin-books__filters">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input input--select"
            >
              <option value="created_at_desc">الأحدث</option>
              <option value="created_at_asc">الأقدم</option>
              <option value="author_asc">اسم الكاتب (A-Z)</option>
              <option value="author_desc">اسم الكاتب (Z-A)</option>
              <option value="book_title_asc">العنوان (A-Z)</option>
              <option value="book_title_desc">العنوان (Z-A)</option>
            </select>

            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="input input--select"
            >
              <option value={5}>5/صفحة</option>
              <option value={10}>10/صفحة</option>
              <option value={25}>25/صفحة</option>
              <option value={50}>50/صفحة</option>
            </select>
          </div>
        </div>

        <section className="admin-books__grid-wrap">
          {loading ? (
            <div className="cards-grid">
              {Array.from({ length: perPage }).map((_, i) => (
                <div key={i} className="card card--skeleton">
                  <div className="skeleton cover" />
                  <div className="skeleton line short" />
                  <div className="skeleton line" />
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="empty">لا يوجد كتب</div>
          ) : (
            <div className="cards-grid">
              {books.map((b) => {
                const img = (b as any).__imageDisplay as string | undefined
                const pdf = (b as any).__pdfDisplay as string | undefined
                return (
                  <article key={b.id} className="card">
                    <div className="card__inner">
                      <div className="card__header">
                        <div className="card__thumb">
                          {img ? (
                            <img style={{width: '100%', height: '100%'}}
                              src={img}
                              alt={b.book_title}
                              className="book-image"
                              onError={(e) => ((e.currentTarget.style.display = 'none'))}
                            />
                          ) : (
                            <span>{b.book_title?.[0] ?? 'B'}</span>
                          )}
                        </div>
                        <div className="card__meta">
                          <h3 className="card__title">{b.book_title}</h3>
                          <p className="card__author">{b.author}</p>
                        </div>
                      </div>

                      <p className="card__desc">
                        {b.description ?? 'لا وصف متاح'}
                      </p>

                      <div className="card__footer">
                        <div className="card__price">
                          <span className="muted">السعر</span>
                          <strong>{b.price ? b.price + ' ر.س' : '—'}</strong>
                        </div>

                        <div className="card__actions">
                          {pdf && (
                            <a
                              href={pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn--muted"
                            >
                              عرض/تحميل PDF
                            </a>
                          )}
                          <button
                            onClick={() => openEdit(b)}
                            className="btn btn--ghost"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => removeBook(b.id)}
                            className="btn btn--danger"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <footer className="admin-books__pager">
          <div className="muted">إجمالي: {meta.total ?? books.length} عناصر</div>
          <div className="pager-controls">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn btn--page"
            >
              السابق
            </button>
            <div className="pager-info">
              صفحة {meta.page ?? page} / {meta.total_pages ?? 1}
            </div>
            <button
              disabled={
                meta.total_pages ? page >= (meta.total_pages as number) : books.length < perPage
              }
              onClick={() => setPage((p) => p + 1)}
              className="btn btn--page"
            >
              التالي
            </button>
          </div>
        </footer>
      </div>

      {showForm && (
        <BookForm
          initial={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

// -------------------- BookForm --------------------
function BookForm({
  initial,
  onClose,
  onSaved,
  categories,
}: {
  initial?: Book | null
  onClose: () => void
  onSaved: (book?: Book) => void
  categories: { id: number; name: string }[]
}) {
  const [title, setTitle] = useState(initial?.book_title ?? '')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price ?? 0)
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? 1)
  const [discount, setDiscount] = useState(initial?.discount ?? 0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string | null>(null)

  // روابط موجودة مسبقًا (في وضع التعديل)
  const existingImageUrl =
    (initial?.image_url && fileUrl(initial.image_url)) ||
    (initial?.image && fileUrl(initial.image)) ||
    ''
  const existingPdfUrl =
    (initial?.pdf_url && fileUrl(initial.pdf_url)) ||
    (initial?.pdf && fileUrl(initial.pdf)) ||
    ''

  // معاينة الصورة الجديدة قبل الرفع
  const [imagePreview, setImagePreview] = useState<string>('')

  useEffect(() => {
    setTitle(initial?.book_title ?? '')
    setAuthor(initial?.author ?? '')
    setDescription(initial?.description ?? '')
    setPrice(initial?.price ?? 0)
    setCategoryId(initial?.category_id ?? 1)
    setDiscount(initial?.discount ?? 0)
  }, [initial])

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setImagePreview('')
    }
  }, [imageFile])

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setErrors(null)

    if (!title.trim() || !author.trim()) {
      setErrors('العنوان والمؤلف مطلوبان.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('book_title', title.trim())
      formData.append('author', author.trim())
      formData.append('description', description)
      formData.append('price', String(price))
      formData.append('category_id', String(categoryId))
      formData.append('discount', String(discount))

      if (imageFile) formData.append('image', imageFile)
      if (pdfFile) formData.append('file', pdfFile)

      let res
      if (initial && initial.id) {
        res = await api.post(`/Book/update/${initial.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        res = await api.post('/Book/create', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      onSaved(res?.data)
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors ||
        'فشل الحفظ. تحقق من الكونسول.'
      setErrors(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal">
      <div className="modal__backdrop" onClick={onClose} />
      <form className="modal__dialog" onSubmit={submit}>
        <h2 className="modal__title">{initial ? 'تعديل كتاب' : 'إضافة كتاب'}</h2>

        {errors && <div className="form__error">{errors}</div>}

        <label className="form__label">العنوان</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="form__label">المؤلف</label>
        <input
          className="input"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />

        <label className="form__label">الوصف</label>
        <textarea
          className="input input--textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="form__row">
          <div>
            <label className="form__label">السعر</label>
            <input
              type="number"
              className="input"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="form__label">الخصم (%)</label>
            <input
              type="number"
              className="input"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
        </div>

        <label className="form__label">الصنف</label>
        <select
          className="input"
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* معاينة المرفقات الحالية (وضع التعديل) */}
        {initial && (existingImageUrl || existingPdfUrl) && (
          <div className="form__preview">
            {existingImageUrl && (
              <div className="form__preview-item">
                <div className="muted">الصورة الحالية</div>
                <img src={existingImageUrl} alt="current" className="book-image" width={100} height={100} />
              </div>
            )}
            {existingPdfUrl && (
              <div className="form__preview-item">
                <div className="muted">ملف PDF الحالي</div>
                <a
                  href={existingPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--muted"
                >
                  عرض/تحميل PDF
                </a>
              </div>
            )}
          </div>
        )}

        <label className="form__label">صورة الكتاب</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
        {imagePreview && (
          <div className="form__preview">
            <div className="muted">معاينة الصورة المختارة</div>
            <img src={imagePreview} alt="preview" className="book-image" />
          </div>
        )}

        <label className="form__label">ملف PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
        />
        {pdfFile && (
          <div className="muted" style={{ marginTop: 6 }}>
            الملف المختار: {pdfFile.name}
          </div>
        )}

        <div className="modal__actions">
          <button type="button" onClick={onClose} className="btn btn--muted">
            إلغاء
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'جارٍ الحفظ...' : initial ? 'حفظ التعديلات' : 'إضافة'}
          </button>
        </div>
      </form>
    </div>
  )
}
