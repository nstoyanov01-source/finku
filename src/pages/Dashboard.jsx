import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'
import AddEntryModal from '../components/AddEntryModal'
import CSVImport from '../components/CSVImport'
import Toast, { useToast } from '../components/Toast'
import EntryDrawer from '../components/EntryDrawer'

function greeting(lang) {
  const h = new Date().getHours()
  if (h < 12) return lang.goodMorning
  if (h < 18) return lang.goodAfternoon
  return lang.goodEvening
}

function fmt(n) {
  return Math.round(n).toLocaleString('en-US')
}

function formatDate(dateStr, language) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatCurrentDate(language) {
  return new Date().toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function calcTax(totalIncome, totalExpenses, legalForm) {
  const monthsElapsed = new Date().getMonth() + 1
  const insurance = 153 * monthsElapsed
  if (legalForm === 'just_tracking') return null
  let taxableIncome, incomeTax
  if (legalForm === 'ET') {
    taxableIncome = Math.max(0, totalIncome - totalExpenses)
    incomeTax = taxableIncome * 0.15
  } else {
    taxableIncome = totalIncome * 0.75
    incomeTax = taxableIncome * 0.15
  }
  const total = incomeTax + insurance
  return { taxableIncome, incomeTax, insurance, total, monthsElapsed }
}

export default function Dashboard({ session, language, legalForm, onLanguageChange }) {
  const lang = t[language]
  const navigate = useNavigate()
  const userId = session.user.id
  const currentYear = new Date().getFullYear()

  const [income, setIncome] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [drawer, setDrawer] = useState(null)
  const [showAllIncome, setShowAllIncome] = useState(false)
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const [showTaxTooltip, setShowTaxTooltip] = useState(false)
  const { toasts, showToast } = useToast()

  useEffect(() => { document.title = 'Dashboard · Finku' }, [])
  const [firstName, setFirstName] = useState('')

  useEffect(() => { fetchData(); fetchName() }, [])

  async function fetchName() {
    const { data } = await supabase.from('profiles').select('first_name').eq('id', userId).single()
    if (data?.first_name) setFirstName(data.first_name)
  }

  async function fetchData() {
    setLoading(true)
    const [{ data: inc }, { data: exp }] = await Promise.all([
      supabase.from('income').select('*').eq('user_id', userId)
        .gte('date', `${currentYear}-01-01`).order('date', { ascending: false }),
      supabase.from('expenses').select('*').eq('user_id', userId)
        .gte('date', `${currentYear}-01-01`).order('date', { ascending: false }),
    ])
    setIncome(inc || [])
    setExpenses(exp || [])
    setLoading(false)
  }

  const totalIncome = income.reduce((s, r) => s + Number(r.amount), 0)
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0)
  const netIncome = totalIncome - totalExpenses
  const currentMonth = new Date().getMonth() + 1
  const avgMonthly = currentMonth > 0 ? totalIncome / currentMonth : 0

  const legalFormEff = legalForm || 'svobodna_profesiya'
  const tax = calcTax(totalIncome, totalExpenses, legalFormEff)
  const projectedAnnual = (totalIncome / currentMonth) * 12

  const monthlyData = Array.from({ length: currentMonth }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    const inc = income.filter(r => r.date.startsWith(`${currentYear}-${m}`)).reduce((s, r) => s + Number(r.amount), 0)
    const exp = expenses.filter(r => r.date.startsWith(`${currentYear}-${m}`)).reduce((s, r) => s + Number(r.amount), 0)
    return { inc, exp }
  })

  const maxBar = Math.max(...monthlyData.map(d => Math.max(d.inc, d.exp)), 1)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <style>{`
        .dash-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2rem;
          height: 60px;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          background: rgba(14,14,12,0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 0.5px solid rgba(240,237,228,0.08);
        }

        .dash-nav-logo {
          font-family: 'Instrument Serif', serif;
          font-size: 20px;
          color: #f0ede4;
          letter-spacing: -0.3px;
        }

        .dash-nav-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dash-lang-select {
          font-size: 13px;
          border: 1px solid rgba(240,237,228,0.12);
          border-radius: 8px;
          padding: 5px 10px;
          background: rgba(240,237,228,0.06);
          color: rgba(240,237,228,0.7);
          cursor: pointer;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          color-scheme: dark;
        }
        .dash-lang-select:hover { border-color: rgba(240,237,228,0.25); }

        .dash-nav-btn {
          background: none;
          border: none;
          color: rgba(240,237,228,0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: color 0.15s, background 0.15s;
        }
        .dash-nav-btn:hover { color: #f0ede4; background: rgba(240,237,228,0.06); }

        .dash-nav-logout {
          background: none;
          border: 1px solid rgba(240,237,228,0.12);
          color: rgba(240,237,228,0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          padding: 6px 14px;
          border-radius: 8px;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .dash-nav-logout:hover { color: #f0ede4; border-color: rgba(240,237,228,0.25); background: rgba(240,237,228,0.04); }

        .dash-page {
          min-height: 100vh;
          background: #0e0e0c;
          padding-top: 60px;
        }

        .dash-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
        }

        .dash-header {
          margin-bottom: 1.75rem;
        }

        .dash-greeting {
          font-size: 20px;
          font-weight: 500;
          color: #f0ede4;
          letter-spacing: -0.3px;
        }

        .dash-subheading {
          font-size: 13px;
          color: rgba(240,237,228,0.35);
          margin-top: 3px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 1.25rem;
        }

        .kpi-card {
          background: #161614;
          border: 1px solid rgba(240,237,228,0.08);
          border-radius: 12px;
          padding: 1rem;
        }

        .kpi-label {
          font-size: 11px;
          color: rgba(240,237,228,0.35);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .kpi-value {
          font-size: 20px;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .kpi-sub {
          font-size: 11px;
          color: rgba(240,237,228,0.25);
          margin-top: 3px;
        }

        .tax-banner {
          background: rgba(200,240,58,0.06);
          border: 1px solid rgba(200,240,58,0.14);
          border-radius: 14px;
          padding: 1.25rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .tax-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(200,240,58,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tax-title {
          font-weight: 500;
          font-size: 14px;
          color: #f0ede4;
        }

        .tax-desc {
          font-size: 12px;
          color: rgba(240,237,228,0.4);
          margin-top: 2px;
          max-width: 340px;
        }

        .tax-figures {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          align-items: center;
        }

        .tax-fig-label {
          font-size: 11px;
          color: rgba(240,237,228,0.35);
        }

        .tax-fig-value {
          font-size: 15px;
          font-weight: 500;
          color: #f0ede4;
          margin-top: 2px;
        }

        .tax-total-value {
          font-size: 18px;
          font-weight: 600;
          color: #c8f03a;
          margin-top: 2px;
        }

        .entry-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(240,237,228,0.04);
          border-radius: 9px;
          padding: 8px 10px;
          position: relative;
        }

        .entry-row { cursor: pointer; }
        .entry-row:hover { background: rgba(240,237,228,0.07); }

        .entry-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .entry-desc {
          font-size: 13px;
          font-weight: 500;
          color: #f0ede4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }

        .entry-date {
          font-size: 11px;
          color: rgba(240,237,228,0.3);
        }

        .chart-legend-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .entries-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .welcome-card {
          background: #161614;
          border: 1px solid rgba(240,237,228,0.08);
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          margin-bottom: 1.25rem;
        }

        @media (max-width: 640px) {
          .entries-grid { grid-template-columns: 1fr; }
          .dash-nav { padding: 0 1rem; }
          .dash-content { padding: 1.5rem 1rem 3rem; }
        }
      `}</style>

      <div className="dash-page">
        <nav className="dash-nav">
          <div className="dash-nav-logo">Finku</div>
          <div className="dash-nav-right">
            <select
              className="dash-lang-select"
              value={language}
              onChange={async e => {
                const l = e.target.value
                await supabase.from('profiles').update({ language: l }).eq('id', userId)
                onLanguageChange(l)
              }}
            >
              <option value="en">EN</option>
              <option value="bg">БГ</option>
            </select>
            <button
              onClick={() => navigate('/invoice/new')}
              style={{
                background: 'rgba(200,240,58,0.1)', border: '1px solid rgba(200,240,58,0.2)',
                color: '#c8f03a', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              + {language === 'bg' ? 'Нова фактура' : 'New invoice'}
            </button>
            <button className="dash-nav-btn" onClick={() => navigate('/profile')}>
              Profile
            </button>
            <button className="dash-nav-logout" onClick={handleLogout}>
              {lang.logout}
            </button>
          </div>
        </nav>

        <div className="dash-content">
          <div className="dash-header">
            <div className="dash-greeting">
              {greeting(lang)}{firstName ? `, ${firstName}` : ''}
            </div>
            <div className="dash-subheading">{formatCurrentDate(language)}</div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(240,237,228,0.3)' }}>…</div>
          ) : (
            <>
              {/* Tax Banner */}
              {tax && (
                <div style={{
                  background: 'rgba(200,240,58,0.06)',
                  border: '0.5px solid rgba(200,240,58,0.15)',
                  borderRadius: 12,
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.25rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.4)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      {lang.taxEstimate} · {lang.taxAuthority}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        onMouseEnter={() => setShowTaxTooltip(true)}
                        onMouseLeave={() => setShowTaxTooltip(false)}
                        onClick={() => setShowTaxTooltip(v => !v)}
                        style={{
                          width: 18, height: 18, border: '1px solid rgba(240,237,228,0.2)',
                          borderRadius: '50%', background: 'none', fontSize: 11,
                          color: 'rgba(240,237,228,0.4)', cursor: 'help',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0, fontFamily: 'DM Sans, sans-serif', lineHeight: 1,
                        }}
                      >?</button>
                      {showTaxTooltip && (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                          background: '#1e1e1c', border: '1px solid rgba(240,237,228,0.1)',
                          borderRadius: 8, padding: '10px 14px', fontSize: 12,
                          width: 280, zIndex: 50, color: 'rgba(240,237,228,0.7)',
                          lineHeight: 1.6, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          whiteSpace: 'normal',
                        }}>
                          {legalFormEff === 'ET'
                            ? (language === 'bg'
                              ? 'Печалба (приходи − разходи) × 15% = данък. Плюс 153 € месечни осигуровки.'
                              : 'Profit (income − expenses) × 15% = income tax. Plus 153 € fixed monthly insurance contributions.')
                            : (language === 'bg'
                              ? 'Брутен доход × 75% = облагаем доход. Облагаем доход × 15% = данък. Плюс 153 € месечни осигуровки.'
                              : 'Gross income × 75% = taxable income. Taxable income × 15% = income tax. Plus 153 € fixed monthly insurance contributions.')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 600, color: '#c8f03a', marginBottom: '0.4rem', letterSpacing: '-0.5px' }}>
                    ~{fmt(tax.total)} {lang.currency}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(240,237,228,0.4)' }}>
                    {language === 'bg' ? 'Данък' : 'Income tax'} {fmt(tax.incomeTax)} {lang.currency}
                    {' · '}
                    {lang.insurance} ~{fmt(tax.insurance)} {lang.currency}
                    {' · '}
                    {lang.totalOwed}
                  </div>
                </div>
              )}

              {/* KPI Cards */}
              <div className="kpi-grid">
                {[
                  { label: lang.totalIncome, value: `${fmt(totalIncome)} ${lang.currency}`, color: '#7ec95f' },
                  { label: lang.totalExpenses, value: `${fmt(totalExpenses)} ${lang.currency}`, color: '#e07070' },
                  { label: lang.netIncome, value: `${fmt(netIncome)} ${lang.currency}`, color: '#f0ede4' },
                  { label: lang.avgMonthly, value: `${fmt(avgMonthly)} ${lang.currency}`, color: '#e8a84a' },
                ].map((k, i) => (
                  <div key={i} className="kpi-card">
                    <div className="kpi-label">{k.label}</div>
                    <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
                    <div className="kpi-sub">{lang.soFar} {currentYear}</div>
                  </div>
                ))}
              </div>

              {/* Projected Annual Banner */}
              {currentMonth >= 2 && totalIncome > 0 && (
                <div style={{
                  background: '#161614',
                  border: '1px solid rgba(240,237,228,0.06)',
                  borderRadius: 12,
                  padding: '0.9rem 1.25rem',
                  marginBottom: '1.25rem',
                  fontSize: 13,
                  color: 'rgba(240,237,228,0.5)',
                }}>
                  {language === 'bg' ? (
                    <>При текущото темпо ще спечелите <span style={{ color: '#c8f03a', fontWeight: 500 }}>{fmt(projectedAnnual)} {lang.currency}</span> тази година</>
                  ) : (
                    <>At your current rate you're on track to earn <span style={{ color: '#c8f03a', fontWeight: 500 }}>{fmt(projectedAnnual)} {lang.currency}</span> this year</>
                  )}
                </div>
              )}

              {/* Income + Expenses columns */}
              {income.length === 0 && expenses.length === 0 ? (
                <div className="welcome-card">
                  <div style={{ fontSize: 32, marginBottom: '0.75rem' }}>👋</div>
                  <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: '#f0ede4', letterSpacing: '-0.3px', marginBottom: '0.75rem' }}>
                    Welcome to Finku
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(240,237,228,0.45)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 1.75rem' }}>
                    Start by adding your first income entry or uploading a Revolut CSV. Your tax estimate will update automatically.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-primary"
                      onClick={() => setModal({ type: 'income' })}
                      style={{ padding: '10px 20px' }}
                    >
                      + {lang.addIncome}
                    </button>
                    <CSVImport userId={userId} language={language} onImported={fetchData} />
                  </div>
                </div>
              ) : (
              <div className="entries-grid">
                {[
                  { type: 'income', label: lang.recentIncome, data: showAllIncome ? income : income.slice(0, 5), total: income.length, showAll: showAllIncome, toggleShowAll: () => setShowAllIncome(v => !v), addLabel: lang.addIncome, emptyMsg: lang.noIncome, color: '#7ec95f', dot: '#7ec95f' },
                  { type: 'expense', label: lang.recentExpenses, data: showAllExpenses ? expenses : expenses.slice(0, 5), total: expenses.length, showAll: showAllExpenses, toggleShowAll: () => setShowAllExpenses(v => !v), addLabel: lang.addExpense, emptyMsg: lang.noExpenses, color: '#e07070', dot: '#e07070' },
                ].map(col => (
                  <div key={col.type} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 500, fontSize: 14, color: '#f0ede4' }}>{col.label}</span>
                        {col.total > 5 && (
                          <button
                            onClick={col.toggleShowAll}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(240,237,228,0.35)', fontFamily: 'DM Sans, sans-serif', padding: 0, transition: 'color 0.15s' }}
                            onMouseOver={e => e.currentTarget.style.color = 'rgba(240,237,228,0.7)'}
                            onMouseOut={e => e.currentTarget.style.color = 'rgba(240,237,228,0.35)'}
                          >
                            {col.showAll ? 'Show less' : 'View all'}
                          </button>
                        )}
                      </div>
                      <button
                        className="btn-primary"
                        onClick={() => setModal({ type: col.type })}
                        style={{ padding: '5px 12px', fontSize: 12 }}
                      >
                        + {col.addLabel}
                      </button>
                    </div>

                    {col.data.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'rgba(240,237,228,0.25)', textAlign: 'center', padding: '1.5rem 0' }}>{col.emptyMsg}</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {col.data.map(row => (
                          <div
                            key={row.id}
                            className="entry-row"
                            onClick={() => setDrawer({ entry: row, type: col.type })}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <div className="entry-dot" style={{ background: col.dot }} />
                              <div style={{ minWidth: 0 }}>
                                <div className="entry-desc">{row.description}</div>
                                <div className="entry-date">{formatDate(row.date, language)}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: col.color, flexShrink: 0, marginLeft: 8 }}>
                              {col.type === 'income' ? '+' : '−'}{fmt(row.amount)} {lang.currency}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <CSVImport userId={userId} language={language} onImported={fetchData} />
                  </div>
                ))}
              </div>
              )}

              {/* Bar Chart */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#f0ede4' }}>{lang.chartTitle}</span>
                  <div style={{ display: 'flex', gap: 14 }}>
                    {[{ color: '#7ec95f', label: lang.incomeLabel }, { color: '#e07070', label: lang.expensesLabel }].map(l => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(240,237,228,0.4)' }}>
                        <div className="chart-legend-dot" style={{ background: l.color }} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                  {monthlyData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%' }}>
                      <div style={{ flex: 1, background: '#7ec95f', borderRadius: '3px 3px 0 0', height: `${(d.inc / maxBar) * 100}%`, minHeight: d.inc > 0 ? 3 : 0, opacity: 0.8 }} />
                      <div style={{ flex: 1, background: '#e07070', borderRadius: '3px 3px 0 0', height: `${(d.exp / maxBar) * 100}%`, minHeight: d.exp > 0 ? 3 : 0, opacity: 0.8 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {monthlyData.map((_, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'rgba(240,237,228,0.25)' }}>
                      {lang.months[i]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <p style={{ fontSize: 11, color: 'rgba(240,237,228,0.2)', textAlign: 'center', borderTop: '0.5px solid rgba(240,237,228,0.06)', paddingTop: '1rem' }}>
                {lang.disclaimer}
              </p>
            </>
          )}
        </div>
      </div>

      {drawer && (
        <EntryDrawer
          entry={drawer.entry}
          type={drawer.type}
          language={language}
          onClose={() => setDrawer(null)}
          onEdit={() => {
            const { entry, type } = drawer
            setDrawer(null)
            setModal({ type, entry })
          }}
          onDeleted={() => {
            setDrawer(null)
            fetchData()
            showToast('Entry deleted', 'success')
          }}
        />
      )}

      {modal && (
        <AddEntryModal
          type={modal.type}
          userId={userId}
          language={language}
          onClose={() => setModal(null)}
          onSaved={() => {
            fetchData()
            if (modal.entry) showToast('Entry updated ✓', 'success')
            else showToast(modal.type === 'income' ? 'Income added ✓' : 'Expense added ✓', 'success')
          }}
          onDeleted={() => { fetchData(); showToast('Entry deleted', 'success') }}
          initialData={modal.entry}
          entryId={modal.entry?.id}
        />
      )}
      <Toast toasts={toasts} />
    </>
  )
}
