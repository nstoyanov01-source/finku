import { useEffect, useState } from 'react'
import { useLanguage } from '../lib/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'
import EntryDrawer from '../components/EntryDrawer'
import AddEntryModal from '../components/AddEntryModal'
import Toast, { useToast } from '../components/Toast'

function fmt(n) {
  return Math.round(n).toLocaleString('en-US')
}

function formatDate(dateStr, language) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtMonth(ym, language) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', { month: 'long', year: 'numeric' })
}

export default function IncomeList({ session }) {
  const { language } = useLanguage()
  const lang = t[language]
  const navigate = useNavigate()
  const userId = session.user.id

  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [drawer, setDrawer] = useState(null)
  const [modal, setModal] = useState(null)
  const { toasts, showToast } = useToast()

  useEffect(() => {
    document.title = 'Income · Finku'
    fetchIncome()
  }, [])

  async function fetchIncome() {
    setLoading(true)
    const { data } = await supabase
      .from('income').select('*').eq('user_id', userId).order('date', { ascending: false })
    setIncome(data || [])
    setLoading(false)
  }

  const months = [...new Set(income.map(e => e.date.slice(0, 7)))].sort().reverse()

  const filtered = income
    .filter(e => {
      const q = search.toLowerCase()
      if (q && !e.description.toLowerCase().includes(q) && !(e.client || '').toLowerCase().includes(q)) return false
      if (monthFilter && !e.date.startsWith(monthFilter)) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.date) - new Date(a.date)
      if (sort === 'oldest') return new Date(a.date) - new Date(b.date)
      if (sort === 'highest') return Number(b.amount) - Number(a.amount)
      if (sort === 'lowest') return Number(a.amount) - Number(b.amount)
      return 0
    })

  const total = income.reduce((s, e) => s + Number(e.amount), 0)

  const sel = { fontSize: 13, border: '1px solid rgba(240,237,228,0.12)', borderRadius: 8, padding: '8px 12px', background: 'rgba(240,237,228,0.06)', color: 'rgba(240,237,228,0.7)', outline: 'none', fontFamily: 'DM Sans, sans-serif', colorScheme: 'dark', cursor: 'pointer' }

  return (
    <>
      <style>{`
        .list-page { min-height: 100vh; background: #0e0e0c; padding-top: 60px; font-family: 'DM Sans', sans-serif; }
        .list-nav { display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; height: 60px; position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(14,14,12,0.9); backdrop-filter: blur(12px); border-bottom: 0.5px solid rgba(240,237,228,0.08); }
        .list-back { background: none; border: none; color: rgba(240,237,228,0.5); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: color 0.15s, background 0.15s; }
        .list-back:hover { color: #f0ede4; background: rgba(240,237,228,0.06); }
        .list-content { max-width: 700px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }
        .list-entry-row { display: flex; align-items: center; justify-content: space-between; background: #161614; border-radius: 8px; padding: 12px 16px; margin-bottom: 6px; cursor: pointer; transition: background 0.12s; }
        .list-entry-row:hover { background: #1c1c1a; }
        .list-entry-desc { font-size: 13px; font-weight: 500; color: #f0ede4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .list-entry-sub { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 2px; }
        .list-search { width: 100%; background: rgba(240,237,228,0.05); border: 1px solid rgba(240,237,228,0.1); border-radius: 10px; padding: 10px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #f0ede4; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .list-search:focus { border-color: rgba(200,240,58,0.35); }
        .list-search::placeholder { color: rgba(240,237,228,0.25); }
        @media (max-width: 640px) {
          .list-nav { padding: 0 1rem; }
          .list-content { padding: 1.5rem 1rem 4rem; }
        }
      `}</style>

      <div className="list-page">
        <nav className="list-nav">
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#f0ede4', letterSpacing: '-0.3px' }}>Finku</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LanguageToggle />
            <button className="list-back" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          </div>
        </nav>

        <div className="list-content">
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: '#f0ede4', letterSpacing: '-0.5px', marginBottom: '0.35rem' }}>
            {language === 'bg' ? 'Всички приходи' : 'All Income'}
          </h1>
          {!loading && (
            <div style={{ fontSize: 28, fontWeight: 600, color: '#c8f03a', letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', marginBottom: '1.75rem' }}>
              +{fmt(total)} {lang.currency}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input
              className="list-search"
              style={{ flex: 1, minWidth: 160 }}
              placeholder={language === 'bg' ? 'Търси...' : 'Search...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={sel} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
              <option value="">{language === 'bg' ? 'Всички месеци' : 'All months'}</option>
              {months.map(m => (
                <option key={m} value={m}>{fmtMonth(m, language)}</option>
              ))}
            </select>
            <select style={sel} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">{language === 'bg' ? 'Най-нови' : 'Newest'}</option>
              <option value="oldest">{language === 'bg' ? 'Най-стари' : 'Oldest'}</option>
              <option value="highest">{language === 'bg' ? 'Най-висок' : 'Highest'}</option>
              <option value="lowest">{language === 'bg' ? 'Най-нисък' : 'Lowest'}</option>
            </select>
          </div>

          {/* Entry list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(240,237,228,0.3)', fontSize: 13 }}>…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', fontSize: 13, color: 'rgba(240,237,228,0.2)' }}>
              {search || monthFilter
                ? (language === 'bg' ? 'Няма резултати' : 'No results found')
                : (language === 'bg' ? 'Все още няма приходи' : 'No income yet')}
            </div>
          ) : (
            filtered.map(row => (
              <div key={row.id} className="list-entry-row" onClick={() => setDrawer({ entry: row, type: 'income' })}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="list-entry-desc">{row.description}</div>
                  <div className="list-entry-sub">
                    {row.client ? `${row.client} · ` : ''}{formatDate(row.date, language)}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#c8f03a', flexShrink: 0, marginLeft: 16, fontVariantNumeric: 'tabular-nums' }}>
                  +{fmt(row.amount)} {lang.currency}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {drawer && (
        <EntryDrawer
          entry={drawer.entry}
          type="income"
          language={language}
          onClose={() => setDrawer(null)}
          onEdit={() => {
            const { entry } = drawer
            setDrawer(null)
            setModal({ type: 'income', entry })
          }}
          onDeleted={() => {
            const { entry } = drawer
            setDrawer(null)
            setIncome(prev => prev.filter(e => e.id !== entry.id))
            showToast('Entry deleted', 'success')
          }}
        />
      )}

      {modal && (
        <AddEntryModal
          type="income"
          userId={userId}
          language={language}
          onClose={() => setModal(null)}
          onSaved={(savedEntry) => {
            if (modal.entry) {
              setIncome(prev => prev.map(e => e.id === savedEntry.id ? savedEntry : e))
              showToast('Entry updated ✓', 'success')
            } else {
              setIncome(prev => [savedEntry, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)))
              showToast('Income added ✓', 'success')
            }
          }}
          onDeleted={() => {
            const id = modal.entry?.id
            setIncome(prev => prev.filter(e => e.id !== id))
            showToast('Entry deleted', 'success')
          }}
          initialData={modal.entry}
          entryId={modal.entry?.id}
        />
      )}
      <Toast toasts={toasts} />
    </>
  )
}
