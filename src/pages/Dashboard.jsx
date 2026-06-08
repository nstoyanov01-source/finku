import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'
import AddEntryModal from '../components/AddEntryModal'
import CSVImport from '../components/CSVImport'
import Toast, { useToast } from '../components/Toast'
import EntryDrawer from '../components/EntryDrawer'
import { usePostHog } from '@posthog/react'

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

function calcTax(totalIncome, totalExpenses, legalForm, useAuthorRate = false, monthsElapsed = null) {
  if (legalForm === 'just_tracking') return null
  if (monthsElapsed === null) monthsElapsed = new Date().getMonth() + 1
  const insurancePerMonth = 153.08
  const totalInsurance = insurancePerMonth * monthsElapsed

  if (legalForm === 'ET') {
    const profit = Math.max(0, totalIncome - totalExpenses)
    const insuranceDeduction = Math.min(profit, totalInsurance)
    const taxableBase = Math.max(0, profit - insuranceDeduction)
    const incomeTax = taxableBase * 0.15
    return { taxableBase, incomeTax, insurance: totalInsurance, total: incomeTax + totalInsurance, monthsElapsed, rate: 15, nprRate: 0, profit, insuranceDeduction }
  }

  const nprRate = useAuthorRate ? 0.40 : 0.25
  const npr = totalIncome * nprRate
  const afterNPR = totalIncome - npr
  const insuranceDeduction = Math.min(afterNPR, totalInsurance)
  const taxableBase = Math.max(0, afterNPR - insuranceDeduction)
  const incomeTax = taxableBase * 0.10
  return { taxableBase, incomeTax, insurance: totalInsurance, total: incomeTax + totalInsurance, monthsElapsed, rate: 10, nprRate: nprRate * 100, npr, afterNPR, insuranceDeduction }
}

function nextTaxDeadline() {
  const today = new Date()
  const m = today.getMonth()
  const y = today.getFullYear()
  const isQ4 = m >= 9

  if (isQ4) {
    const annualDecl = new Date(y + 1, 3, 30)
    const days = Math.ceil((annualDecl - today) / 86400000)
    return { date: annualDecl, days, isAnnual: true }
  }

  const quarters = [new Date(y, 3, 30), new Date(y, 6, 31), new Date(y, 9, 31)]
  const next = quarters.find(d => d > today) || new Date(y + 1, 3, 30)
  const days = Math.ceil((next - today) / 86400000)
  return { date: next, days, isAnnual: false }
}

function nextInsuranceDeadline() {
  const today = new Date()
  const day = today.getDate()
  const month = today.getMonth()
  const year = today.getFullYear()
  return day < 25
    ? new Date(year, month, 25)
    : new Date(year, month + 1, 25)
}

function formatDeadlineDate(date, language) {
  return date.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'short' })
}

export default function Dashboard({ session, language, legalForm, authorRate, onLanguageChange }) {
  const lang = t[language]
  const posthog = usePostHog()
  const navigate = useNavigate()
  const userId = session.user.id
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const [income, setIncome] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [drawer, setDrawer] = useState(null)
  const [showAllIncome, setShowAllIncome] = useState(false)
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const { toasts, showToast } = useToast()
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    document.title = 'Dashboard · Finku'
    posthog?.identify(userId, { email: session.user.email })
  }, [])

  useEffect(() => { fetchName() }, [])
  useEffect(() => { fetchData(selectedYear) }, [selectedYear])

  async function fetchName() {
    const { data } = await supabase.from('profiles').select('first_name').eq('id', userId).single()
    if (data?.first_name) setFirstName(data.first_name)
  }

  async function fetchData(year = selectedYear) {
    setLoading(true)
    const [{ data: inc }, { data: exp }] = await Promise.all([
      supabase.from('income').select('*').eq('user_id', userId)
        .gte('date', `${year}-01-01`).lte('date', `${year}-12-31`).order('date', { ascending: false }),
      supabase.from('expenses').select('*').eq('user_id', userId)
        .gte('date', `${year}-01-01`).lte('date', `${year}-12-31`).order('date', { ascending: false }),
    ])
    setIncome(inc || [])
    setExpenses(exp || [])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const totalIncome = income.reduce((s, r) => s + Number(r.amount), 0)
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0)
  const currentMonth = new Date().getMonth() + 1
  const isPastYear = selectedYear < currentYear
  const monthsElapsed = isPastYear ? 12 : currentMonth

  const legalFormEff = legalForm || 'svobodna_profesiya'
  const isTracking = legalFormEff === 'just_tracking'
  const tax = calcTax(totalIncome, totalExpenses, legalFormEff, authorRate ?? false, monthsElapsed)
  const deadline = tax ? nextTaxDeadline() : null
  const quarter = Math.floor(new Date().getMonth() / 3) + 1
  const insDue = nextInsuranceDeadline()
  const insDays = Math.ceil((insDue - new Date()) / 86400000)

  return (
    <>
      <style>{`
        .dash-nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 2rem; height: 60px; position: fixed; top: 0; left: 0; right: 0;
          z-index: 50; background: rgba(14,14,12,0.9); backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px); border-bottom: 0.5px solid rgba(240,237,228,0.08);
        }
        .dash-nav-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: #f0ede4; letter-spacing: -0.3px; }
        .dash-nav-right { display: flex; align-items: center; gap: 8px; }
        .dash-lang-select { font-size: 13px; border: 1px solid rgba(240,237,228,0.12); border-radius: 8px; padding: 5px 10px; background: rgba(240,237,228,0.06); color: rgba(240,237,228,0.7); cursor: pointer; outline: none; font-family: 'DM Sans', sans-serif; color-scheme: dark; }
        .dash-lang-select:hover { border-color: rgba(240,237,228,0.25); }
        .dash-nav-btn { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: color 0.15s, background 0.15s; }
        .dash-nav-btn:hover { color: #f0ede4; background: rgba(240,237,228,0.06); }
        .dash-nav-logout { background: none; border: 1px solid rgba(240,237,228,0.12); color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 6px 14px; border-radius: 8px; transition: color 0.15s, border-color 0.15s, background 0.15s; }
        .dash-nav-logout:hover { color: #f0ede4; border-color: rgba(240,237,228,0.25); background: rgba(240,237,228,0.04); }

        .dash-page { min-height: 100vh; background: #0e0e0c; padding-top: 60px; }
        .dash-content { max-width: 640px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }
        .dash-greeting { font-size: 20px; font-weight: 500; color: #f0ede4; letter-spacing: -0.3px; }
        .dash-subheading { font-size: 13px; color: rgba(240,237,228,0.35); margin-top: 3px; margin-bottom: 1.75rem; }

        .entry-row { display: flex; align-items: center; justify-content: space-between; background: rgba(240,237,228,0.04); border-radius: 9px; padding: 9px 12px; cursor: pointer; transition: background 0.12s; }
        .entry-row:hover { background: rgba(240,237,228,0.07); }
        .entry-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .entry-desc { font-size: 13px; font-weight: 500; color: #f0ede4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .entry-date { font-size: 11px; color: rgba(240,237,228,0.3); margin-top: 1px; }

        @media (max-width: 640px) {
          .dash-nav { padding: 0 1rem; }
          .dash-content { padding: 1.5rem 1rem 4rem; }
        }
      `}</style>

      <div className="dash-page">
        <nav className="dash-nav">
          <div className="dash-nav-logo">Finku</div>
          <div className="dash-nav-right">
            <select
              className="dash-lang-select"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
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
            <button className="dash-nav-btn" onClick={() => navigate('/blog')}>Blog</button>
            <button className="dash-nav-btn" onClick={() => navigate('/profile')}>Profile</button>
            <button className="dash-nav-logout" onClick={handleLogout}>{lang.logout}</button>
          </div>
        </nav>

        {loading ? (
          <div className="dash-content">
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(240,237,228,0.3)' }}>…</div>
          </div>

        ) : income.length === 0 && expenses.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 60px)',
            textAlign: 'center', padding: '2rem 1.5rem',
          }}>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(32px, 5vw, 52px)',
              color: '#f0ede4', letterSpacing: '-0.5px', marginBottom: '1rem', lineHeight: 1.1,
            }}>
              {language === 'bg' ? 'Нека видим колко дължиш' : "Let's see what you owe"}
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(240,237,228,0.5)', marginBottom: '2rem', maxWidth: 400, lineHeight: 1.65 }}>
              {language === 'bg'
                ? 'Добави първия си приход и виж данъчната прогноза мигновено.'
                : 'Add your first income entry and watch your tax estimate appear instantly.'}
            </p>
            <button
              className="btn-primary"
              onClick={() => setModal({ type: 'income' })}
              style={{ width: '100%', maxWidth: 360, justifyContent: 'center', fontSize: 15, padding: '14px 24px', marginBottom: '1.25rem' }}
            >
              + {language === 'bg' ? 'Добави първия си приход' : 'Add your first income'}
            </button>
            <div style={{ fontSize: 14, color: 'rgba(240,237,228,0.35)' }}>
              <CSVImport userId={userId} language={language} onImported={() => fetchData(selectedYear)} />
            </div>
          </div>

        ) : (
          <div className="dash-content">
            {/* Greeting */}
            <div className="dash-greeting">
              {greeting(lang)}{firstName ? `, ${firstName}` : ''}
            </div>
            <div className="dash-subheading">{formatCurrentDate(language)}</div>

            {/* Hero: Income Tax card */}
            {isTracking ? (
              <div style={{
                background: '#161614', border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '18px 20px', marginBottom: 12,
              }}>
                <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.35)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
                  {language === 'bg' ? 'Режим на проследяване' : 'Tracking mode'}
                </div>
                <div style={{ fontSize: 15, color: 'rgba(240,237,228,0.55)', lineHeight: 1.5 }}>
                  {language === 'bg' ? 'Само проследяване — без данъчна прогноза' : 'Tracking only — no tax estimate'}
                </div>
              </div>
            ) : tax && (
              <div style={{
                background: '#c8f03a', borderRadius: 16, padding: '22px 24px', marginBottom: 12,
                position: 'relative',
              }}>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>
                  {language === 'bg' ? `Данък — Q${quarter}` : `Income tax — Q${quarter}`}
                </div>
                <div style={{ fontSize: 52, fontWeight: 600, color: '#0e0e0c', letterSpacing: -1.5, lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
                  ~{fmt(tax.incomeTax)} €
                </div>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 14 }}>
                  {tax.incomeTax === 0
                    ? (language === 'bg' ? 'Приспаданията те покриват този период' : 'Your deductions cover it this quarter')
                    : deadline && (language === 'bg'
                        ? `До ${formatDeadlineDate(deadline.date, language)}`
                        : `Due by ${formatDeadlineDate(deadline.date, language)}`)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {deadline && (
                    <span style={{
                      background: 'rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.65)',
                      fontSize: 12, fontWeight: 500, borderRadius: 20, padding: '4px 10px',
                    }}>
                      {language === 'bg'
                        ? `До ${formatDeadlineDate(deadline.date, language)} · ${deadline.days} дни`
                        : `Due ${formatDeadlineDate(deadline.date, language)} · ${deadline.days} days`}
                    </span>
                  )}
                  <Link
                    to="/how-to-pay"
                    style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', textDecoration: 'none', marginLeft: 'auto' }}
                    onMouseOver={e => { e.currentTarget.style.color = 'rgba(0,0,0,0.75)' }}
                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(0,0,0,0.5)' }}
                  >
                    {language === 'bg' ? 'Как да платиш? →' : 'How to pay? →'}
                  </Link>
                </div>
              </div>
            )}

            {/* Insurance card */}
            {!isTracking && (
              <div style={{
                background: '#161614', border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '18px 20px', marginBottom: 20,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.35)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                    {language === 'bg' ? 'Месечни осигуровки' : 'Monthly insurance'}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: '#f0ede4', letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
                    153 €
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(240,237,228,0.35)', marginTop: 4 }}>
                    {language === 'bg' ? 'Фиксирано всеки месец · Пенсия + здраве' : 'Fixed every month · Pension + health'}
                  </div>
                </div>
                <div style={{
                  background: insDays <= 14 ? 'rgba(255,200,0,0.12)' : 'rgba(200,240,58,0.1)',
                  color: insDays <= 14 ? '#e8a84a' : '#c8f03a',
                  fontSize: 12, fontWeight: 500, borderRadius: 20, padding: '6px 12px',
                  whiteSpace: 'nowrap', flexShrink: 0, textAlign: 'center',
                }}>
                  <div>{language === 'bg' ? 'До' : 'Due'} {formatDeadlineDate(insDue, language)}</div>
                  <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
                    {insDays} {language === 'bg' ? 'дни' : 'days'}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!isPastYear && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                <button
                  onClick={() => setModal({ type: 'income' })}
                  style={{
                    background: '#c8f03a', color: '#0e0e0c', border: 'none',
                    borderRadius: 12, padding: '14px', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
                >
                  + {language === 'bg' ? 'Добави приход' : 'Add income'}
                </button>
                <button
                  onClick={() => setModal({ type: 'expense' })}
                  style={{
                    background: 'none', color: 'rgba(240,237,228,0.7)',
                    border: '1px solid rgba(240,237,228,0.14)', borderRadius: 12, padding: '14px',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.28)'; e.currentTarget.style.color = '#f0ede4' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.14)'; e.currentTarget.style.color = 'rgba(240,237,228,0.7)' }}
                >
                  + {language === 'bg' ? 'Добави разход' : 'Add expense'}
                </button>
              </div>
            )}

            {/* Recent income */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(240,237,228,0.45)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  {lang.recentIncome}
                </span>
                {income.length > 5 && (
                  <button
                    onClick={() => setShowAllIncome(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(240,237,228,0.35)', fontFamily: 'DM Sans, sans-serif', padding: 0 }}
                    onMouseOver={e => e.currentTarget.style.color = 'rgba(240,237,228,0.65)'}
                    onMouseOut={e => e.currentTarget.style.color = 'rgba(240,237,228,0.35)'}
                  >
                    {showAllIncome ? (language === 'bg' ? 'По-малко' : 'Show less') : (language === 'bg' ? 'Всички' : 'View all')}
                  </button>
                )}
              </div>
              {income.length === 0 ? (
                <div style={{ fontSize: 13, color: 'rgba(240,237,228,0.2)', textAlign: 'center', padding: '1.25rem 0' }}>
                  {lang.noIncome}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(showAllIncome ? income : income.slice(0, 5)).map(row => (
                    <div key={row.id} className="entry-row" onClick={() => setDrawer({ entry: row, type: 'income' })}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div className="entry-dot" style={{ background: '#7ec95f' }} />
                        <div style={{ minWidth: 0 }}>
                          <div className="entry-desc">{row.description}</div>
                          <div className="entry-date">{formatDate(row.date, language)}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#7ec95f', flexShrink: 0, marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>
                        +{fmt(row.amount)} {lang.currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!isPastYear && (
                <div style={{ marginTop: 8 }}>
                  <CSVImport userId={userId} language={language} onImported={() => fetchData(selectedYear)} />
                </div>
              )}
            </div>

            {/* Recent expenses */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(240,237,228,0.45)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  {lang.recentExpenses}
                </span>
                {expenses.length > 5 && (
                  <button
                    onClick={() => setShowAllExpenses(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(240,237,228,0.35)', fontFamily: 'DM Sans, sans-serif', padding: 0 }}
                    onMouseOver={e => e.currentTarget.style.color = 'rgba(240,237,228,0.65)'}
                    onMouseOut={e => e.currentTarget.style.color = 'rgba(240,237,228,0.35)'}
                  >
                    {showAllExpenses ? (language === 'bg' ? 'По-малко' : 'Show less') : (language === 'bg' ? 'Всички' : 'View all')}
                  </button>
                )}
              </div>
              {expenses.length === 0 ? (
                <div style={{ fontSize: 13, color: 'rgba(240,237,228,0.2)', textAlign: 'center', padding: '1.25rem 0' }}>
                  {lang.noExpenses}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(showAllExpenses ? expenses : expenses.slice(0, 5)).map(row => (
                    <div key={row.id} className="entry-row" onClick={() => setDrawer({ entry: row, type: 'expense' })}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div className="entry-dot" style={{ background: '#e07070' }} />
                        <div style={{ minWidth: 0 }}>
                          <div className="entry-desc">{row.description}</div>
                          <div className="entry-date">{formatDate(row.date, language)}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#e07070', flexShrink: 0, marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>
                        −{fmt(row.amount)} {lang.currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p style={{ fontSize: 11, color: 'rgba(240,237,228,0.15)', textAlign: 'center', borderTop: '0.5px solid rgba(240,237,228,0.06)', paddingTop: '1rem' }}>
              {lang.disclaimer}
            </p>
          </div>
        )}
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
            fetchData(selectedYear)
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
            fetchData(selectedYear)
            if (modal.entry) showToast('Entry updated ✓', 'success')
            else showToast(modal.type === 'income' ? 'Income added ✓' : 'Expense added ✓', 'success')
          }}
          onDeleted={() => { fetchData(selectedYear); showToast('Entry deleted', 'success') }}
          initialData={modal.entry}
          entryId={modal.entry?.id}
        />
      )}
      <Toast toasts={toasts} />
    </>
  )
}
