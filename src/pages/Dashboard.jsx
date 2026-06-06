import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

function calcTax(totalIncome, totalExpenses, legalForm, useAuthorRate = false) {
  if (legalForm === 'just_tracking') return null
  const monthsElapsed = new Date().getMonth() + 1
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
  const m = today.getMonth() // 0-indexed
  const y = today.getFullYear()
  const isQ4 = m >= 9 // October (9) through December (11)

  if (isQ4) {
    // No advance payment in Q4 — next event is annual declaration April 30
    const annualDecl = new Date(y + 1, 3, 30)
    const days = Math.ceil((annualDecl - today) / 86400000)
    return { date: annualDecl, days, isAnnual: true }
  }

  const quarters = [
    new Date(y, 3, 30),  // Apr 30
    new Date(y, 6, 31),  // Jul 31
    new Date(y, 9, 31),  // Oct 31
  ]
  const next = quarters.find(d => d > today) || new Date(y + 1, 3, 30)
  const days = Math.ceil((next - today) / 86400000)
  return { date: next, days, isAnnual: false }
}

function formatDeadlineLabel(date, language) {
  const d = date.getDate()
  const en = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const bg = ['яну','фев','мар','апр','май','юни','юли','авг','сеп','окт','ное','дек']
  return `${d} ${language === 'bg' ? bg[date.getMonth()] : en[date.getMonth()]}`
}

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  const hasAnimated = useRef(false)
  const raf = useRef(null)
  useEffect(() => {
    if (!target) { setValue(0); return }
    if (hasAnimated.current) { setValue(target); return }
    hasAnimated.current = true
    const t0 = performance.now()
    function step(now) {
      const p = Math.min((now - t0) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target])
  return value
}

function BreakdownRow({ label, value, isTotal }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: isTotal ? '8px 0 4px' : '4px 0',
      fontSize: 12,
      color: isTotal ? '#f0ede4' : 'rgba(240,237,228,0.5)',
      fontWeight: isTotal ? 500 : 400,
      borderTop: isTotal ? '0.5px solid rgba(240,237,228,0.1)' : 'none',
      marginTop: isTotal ? 4 : 0,
    }}>
      <span>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

function daysUntil(date) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  return Math.ceil((d - today) / 86400000)
}

function urgencyStyle(days) {
  if (days > 30) return { color: '#c8f03a', bg: 'rgba(200,240,58,0.1)' }
  if (days > 7) return { color: '#e8a84a', bg: 'rgba(255,200,0,0.08)' }
  return { color: '#e07070', bg: 'rgba(224,112,112,0.1)' }
}

function generatePayments(tax, language) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const payments = []
  const monthNames = language === 'bg'
    ? ['Януари','Февруари','Март','Април','Май','Юни','Юли','Август','Септември','Октомври','Ноември','Декември']
    : ['January','February','March','April','May','June','July','August','September','October','November','December']
  const insLabel = language === 'bg' ? 'Осигуровки' : 'Insurance'
  const annLabel = language === 'bg' ? 'Годишна декларация' : 'Annual declaration'

  for (let m = 0; m < 12; m++) {
    const due = new Date(year, m, 25); due.setHours(0, 0, 0, 0)
    if (due >= today) {
      payments.push({ key: `${year}-${String(m+1).padStart(2,'0')}-25`, name: `${insLabel} — ${monthNames[m]}`, date: due, amount: 153 })
    }
  }

  const qAmt = tax && tax.monthsElapsed > 0 ? Math.round(tax.incomeTax / tax.monthsElapsed * 3) : 0
  const qDates = [new Date(year,3,30), new Date(year,6,31), new Date(year,9,31)]
  const qLabels = language === 'bg'
    ? ['Q1 данъчно плащане','Q2 данъчно плащане','Q3 данъчно плащане']
    : ['Q1 tax payment','Q2 tax payment','Q3 tax payment']
  qDates.forEach((d, i) => {
    if (d > today) {
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      payments.push({ key: ds, name: qLabels[i], date: d, amount: qAmt })
    }
  })

  payments.push({ key: `${year+1}-04-30`, name: annLabel, date: new Date(year+1,3,30), amount: tax ? Math.round(tax.total) : 0 })
  payments.sort((a, b) => a.date - b.date)
  return payments.slice(0, 4)
}

export default function Dashboard({ session, language, legalForm, authorRate, onLanguageChange }) {
  const lang = t[language]
  const posthog = usePostHog()
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
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [paidKeys, setPaidKeys] = useState(() => {
    const keys = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('finku_paid_')) keys[k.replace('finku_paid_', '')] = true
    }
    return keys
  })
  const [setAside, setSetAside] = useState(() => localStorage.getItem('finku_set_aside') || '')
  const [taxPulse, setTaxPulse] = useState(false)
  const prevTaxRef = useRef(null)
  const { toasts, showToast } = useToast()
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    document.title = 'Dashboard · Finku'
    posthog?.identify(userId, { email: session.user.email })
  }, [])

  useEffect(() => {
    if (setAside) localStorage.setItem('finku_set_aside', setAside)
    else localStorage.removeItem('finku_set_aside')
  }, [setAside])

  function togglePaid(dateKey, paymentName) {
    const lsKey = `finku_paid_${dateKey}`
    setPaidKeys(prev => {
      if (prev[dateKey]) {
        localStorage.removeItem(lsKey)
        const next = { ...prev }
        delete next[dateKey]
        return next
      }
      localStorage.setItem(lsKey, '1')
      posthog?.capture('payment_marked_paid', { payment_type: paymentName })
      return { ...prev, [dateKey]: true }
    })
  }

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
  const tax = calcTax(totalIncome, totalExpenses, legalFormEff, authorRate ?? false)
  const projectedAnnual = (totalIncome / currentMonth) * 12

  useEffect(() => {
    if (tax?.total != null) {
      if (prevTaxRef.current !== null && prevTaxRef.current !== tax.total) {
        setTaxPulse(true)
        const timer = setTimeout(() => setTaxPulse(false), 400)
        return () => clearTimeout(timer)
      }
      prevTaxRef.current = tax.total
    }
  }, [tax?.total])

  const taxTotalDisplay = useCountUp(tax?.total ?? 0)
  const deadline = tax ? nextTaxDeadline() : null
  const setAsideNum = parseFloat(setAside) || 0

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
        .dash-nav-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: #f0ede4; letter-spacing: -0.3px; }
        .dash-nav-right { display: flex; align-items: center; gap: 8px; }
        .dash-lang-select { font-size: 13px; border: 1px solid rgba(240,237,228,0.12); border-radius: 8px; padding: 5px 10px; background: rgba(240,237,228,0.06); color: rgba(240,237,228,0.7); cursor: pointer; outline: none; font-family: 'DM Sans', sans-serif; color-scheme: dark; }
        .dash-lang-select:hover { border-color: rgba(240,237,228,0.25); }
        .dash-nav-btn { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: color 0.15s, background 0.15s; }
        .dash-nav-btn:hover { color: #f0ede4; background: rgba(240,237,228,0.06); }
        .dash-nav-logout { background: none; border: 1px solid rgba(240,237,228,0.12); color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 6px 14px; border-radius: 8px; transition: color 0.15s, border-color 0.15s, background 0.15s; }
        .dash-nav-logout:hover { color: #f0ede4; border-color: rgba(240,237,228,0.25); background: rgba(240,237,228,0.04); }

        .dash-page { min-height: 100vh; background: #0e0e0c; padding-top: 60px; }
        .dash-content { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .dash-header { margin-bottom: 1.75rem; }
        .dash-greeting { font-size: 20px; font-weight: 500; color: #f0ede4; letter-spacing: -0.3px; }
        .dash-subheading { font-size: 13px; color: rgba(240,237,228,0.35); margin-top: 3px; }

        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 1.25rem; }
        .kpi-card { background: #161614; border: 1px solid rgba(240,237,228,0.08); border-radius: 12px; padding: 1rem; }
        .kpi-label { font-size: 11px; color: rgba(240,237,228,0.35); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-value { font-size: 20px; font-weight: 500; font-variant-numeric: tabular-nums; }
        .kpi-sub { font-size: 11px; color: rgba(240,237,228,0.25); margin-top: 3px; }

        @keyframes taxPulse {
          0% { transform: scale(1); color: #c8f03a; }
          40% { transform: scale(1.08); color: #ffffff; }
          100% { transform: scale(1); color: #c8f03a; }
        }
        .tax-amount {
          font-size: 42px;
          font-weight: 600;
          color: #c8f03a;
          letter-spacing: -1px;
          margin-bottom: 0.3rem;
          font-variant-numeric: tabular-nums;
          display: inline-block;
        }
        .tax-amount.pulsing { animation: taxPulse 400ms ease-out forwards; }

        .set-aside-input {
          width: 80px;
          background: rgba(240,237,228,0.06);
          border: 1px solid rgba(240,237,228,0.12);
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 13px;
          color: #f0ede4;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .set-aside-input:focus { border-color: rgba(200,240,58,0.35); }

        .breakdown-section { border-top: 0.5px solid rgba(240,237,228,0.06); padding-top: 0.5rem; margin-top: 0.25rem; margin-bottom: 0.5rem; }
        .payment-row { background: #161614; border: 0.5px solid rgba(240,237,228,0.06); border-radius: 8px; padding: 0.75rem 1rem; display: flex; align-items: center; gap: 12px; transition: border-color 0.15s; }
        .payment-row:hover { border-color: rgba(240,237,228,0.12); }
        .payment-checkbox { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer; transition: all 0.15s; }
        .entry-row { display: flex; align-items: center; justify-content: space-between; background: rgba(240,237,228,0.04); border-radius: 9px; padding: 8px 10px; position: relative; cursor: pointer; }
        .entry-row:hover { background: rgba(240,237,228,0.07); }
        .entry-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .entry-desc { font-size: 13px; font-weight: 500; color: #f0ede4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
        .entry-date { font-size: 11px; color: rgba(240,237,228,0.3); }
        .chart-legend-dot { width: 7px; height: 7px; border-radius: 50%; }
        .entries-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }

        @media (max-width: 640px) {
          .entries-grid { grid-template-columns: 1fr; }
          .dash-nav { padding: 0 1rem; }
          .dash-content { padding: 1.5rem 1rem 3rem; }
          .tax-amount { font-size: 34px; }
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
            <button className="dash-nav-btn" onClick={() => navigate('/blog')}>
              Blog
            </button>
            <button className="dash-nav-btn" onClick={() => navigate('/profile')}>
              Profile
            </button>
            <button className="dash-nav-logout" onClick={handleLogout}>
              {lang.logout}
            </button>
          </div>
        </nav>

        {/* Loading */}
        {loading ? (
          <div className="dash-content">
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(240,237,228,0.3)' }}>…</div>
          </div>

        /* First-time empty state */
        ) : income.length === 0 && expenses.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 60px)',
            textAlign: 'center', padding: '2rem 1.5rem',
          }}>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(32px, 5vw, 52px)',
              color: '#f0ede4', letterSpacing: '-0.5px',
              marginBottom: '1rem', lineHeight: 1.1,
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
              <CSVImport userId={userId} language={language} onImported={fetchData} />
            </div>
          </div>

        /* Normal dashboard */
        ) : (
          <div className="dash-content">
            <div className="dash-header">
              <div className="dash-greeting">
                {greeting(lang)}{firstName ? `, ${firstName}` : ''}
              </div>
              <div className="dash-subheading">{formatCurrentDate(language)}</div>
            </div>

            {/* Tax Section — Layer 1 + Layer 2 */}
            {tax && (
              <>
                {/* Layer 1: Tax Card */}
                <div style={{
                  background: 'rgba(200,240,58,0.04)',
                  border: '0.5px solid rgba(200,240,58,0.2)',
                  borderRadius: 12,
                  padding: '1.25rem 1.5rem',
                  marginBottom: '0.75rem',
                }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.4)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      {lang.taxEstimate} · {lang.taxAuthority}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {(() => {
                        const pill = setAsideNum >= tax.total
                          ? { bg: 'rgba(200,240,58,0.1)', color: '#c8f03a', label: lang.covered }
                          : (setAsideNum > 0 && setAsideNum >= tax.total * 0.7)
                          ? { bg: 'rgba(255,200,0,0.08)', color: '#e8a84a', label: lang.almostThere }
                          : { bg: 'rgba(224,112,112,0.1)', color: '#e07070', label: lang.notCovered }
                        return (
                          <span style={{ background: pill.bg, color: pill.color, fontSize: 11, borderRadius: 20, padding: '3px 9px', fontWeight: 500 }}>
                            {pill.label}
                          </span>
                        )
                      })()}
                      {deadline && (() => {
                        const s = urgencyStyle(deadline.days)
                        return (
                          <span style={{ background: s.bg, color: s.color, fontSize: 11, borderRadius: 20, padding: '3px 9px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {deadline.isAnnual
                              ? `${lang.annualDeclaration}: ${formatDeadlineLabel(deadline.date, language)} · ${deadline.days} ${lang.daysAway}`
                              : `${formatDeadlineLabel(deadline.date, language)} · ${deadline.days} ${lang.daysAway}`}
                          </span>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Large total with count-up */}
                  <div className={`tax-amount${taxPulse ? ' pulsing' : ''}`}>
                    ~{fmt(taxTotalDisplay)} {lang.currency}
                  </div>

                  {/* Subtitle */}
                  <div style={{ fontSize: 12, color: 'rgba(240,237,228,0.38)', marginBottom: '0.75rem' }}>
                    153 {lang.currency}/{language === 'bg' ? 'мес. осигуровки' : 'month insurance'}
                    {' · '}{fmt(tax.incomeTax)} {lang.currency} {language === 'bg' ? 'данък' : 'income tax'}
                    {' · '}{tax.monthsElapsed} {language === 'bg' ? 'месеца' : 'months elapsed'}
                  </div>

                  {/* Set aside row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'rgba(240,237,228,0.4)' }}>{lang.setAside}:</span>
                    <input
                      className="set-aside-input"
                      type="number"
                      min="0"
                      value={setAside}
                      onChange={e => setSetAside(e.target.value)}
                      placeholder="0"
                    />
                    <span style={{ fontSize: 12, color: 'rgba(240,237,228,0.4)' }}>€</span>
                    {setAsideNum > 0 && (() => {
                      const pill = setAsideNum >= tax.total
                        ? { bg: 'rgba(200,240,58,0.1)', color: '#c8f03a', label: lang.covered }
                        : setAsideNum >= tax.total * 0.7
                        ? { bg: 'rgba(255,200,0,0.08)', color: '#e8a84a', label: lang.almostThere }
                        : { bg: 'rgba(224,112,112,0.1)', color: '#e07070', label: lang.notCovered }
                      return (
                        <span style={{ background: pill.bg, color: pill.color, fontSize: 12, borderRadius: 20, padding: '3px 10px', fontWeight: 500 }}>
                          {pill.label}
                        </span>
                      )
                    })()}
                  </div>

                  {/* Breakdown toggle */}
                  <button
                    onClick={() => {
                      setShowBreakdown(v => {
                        if (!v) posthog?.capture('tax_breakdown_viewed', { legal_form: legalFormEff })
                        return !v
                      })
                    }}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      fontSize: 12, color: 'rgba(240,237,228,0.35)',
                      cursor: 'pointer', textDecoration: 'underline',
                      fontFamily: 'DM Sans, sans-serif',
                      marginBottom: showBreakdown ? '0.25rem' : '0.5rem',
                      display: 'block',
                    }}
                  >
                    {showBreakdown ? lang.hideCalculation : `${lang.howCalculated} ↓`}
                  </button>

                  {/* Breakdown rows */}
                  {showBreakdown && (
                    <div className="breakdown-section">
                      {legalFormEff === 'ET' ? (
                        <>
                          <BreakdownRow label={language === 'bg' ? 'Брутен доход' : 'Gross income'} value={`${fmt(totalIncome)} €`} />
                          <BreakdownRow label={language === 'bg' ? 'Общи разходи' : 'Total expenses'} value={`− ${fmt(totalExpenses)} €`} />
                          <BreakdownRow label={language === 'bg' ? 'Печалба' : 'Profit'} value={`${fmt(tax.profit)} €`} />
                          <BreakdownRow label={language === 'bg' ? `Осигуровки (${tax.monthsElapsed} × 153 €)` : `Insurance (${tax.monthsElapsed} × 153 €)`} value={`− ${fmt(tax.insuranceDeduction)} €`} />
                          <BreakdownRow label={language === 'bg' ? 'Данъчна основа' : 'Taxable base'} value={tax.taxableBase === 0 ? (language === 'bg' ? '0 — приспаданията надвишават дохода' : '0 — deductions exceed income') : `${fmt(tax.taxableBase)} €`} />
                          <BreakdownRow label={language === 'bg' ? 'Данък 15%' : 'Income tax 15%'} value={`${fmt(tax.incomeTax)} €`} />
                          <BreakdownRow label={language === 'bg' ? '+ Осигуровки' : '+ Insurance'} value={`${fmt(tax.insurance)} €`} />
                          <BreakdownRow label={language === 'bg' ? 'Общо' : 'Total'} value={`${fmt(tax.total)} €`} isTotal />
                        </>
                      ) : (
                        <>
                          <BreakdownRow label={language === 'bg' ? 'Брутен доход' : 'Gross income'} value={`${fmt(totalIncome)} €`} />
                          <BreakdownRow label={language === 'bg' ? `НПР приспадане (${tax.nprRate}%)` : `НПР deduction (${tax.nprRate}%)`} value={`− ${fmt(tax.npr)} €`} />
                          <BreakdownRow label={language === 'bg' ? 'След НПР' : 'After НПР'} value={`${fmt(tax.afterNPR)} €`} />
                          <BreakdownRow label={language === 'bg' ? `Осигуровки (${tax.monthsElapsed} × 153 €)` : `Insurance (${tax.monthsElapsed} × 153 €)`} value={`− ${fmt(tax.insuranceDeduction)} €`} />
                          <BreakdownRow label={language === 'bg' ? 'Данъчна основа' : 'Taxable base'} value={tax.taxableBase === 0 ? (language === 'bg' ? '0 — приспаданията надвишават дохода' : '0 — deductions exceed income') : `${fmt(tax.taxableBase)} €`} />
                          <BreakdownRow label={language === 'bg' ? 'Данък 10%' : 'Income tax 10%'} value={`${fmt(tax.incomeTax)} €`} />
                          <BreakdownRow label={language === 'bg' ? '+ Осигуровки' : '+ Insurance'} value={`${fmt(tax.insurance)} €`} />
                          <BreakdownRow label={language === 'bg' ? 'Общо' : 'Total'} value={`${fmt(tax.total)} €`} isTotal />
                        </>
                      )}
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.2)' }}>
                    {lang.estimateDisclaimer}
                  </div>
                </div>

                {/* Layer 2: Payment Timeline */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.4)', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: '1rem', marginBottom: '0.6rem' }}>
                    {lang.upcomingPayments}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {generatePayments(tax, language).map(payment => {
                      const days = daysUntil(payment.date)
                      const isPaid = !!paidKeys[payment.key]
                      const s = urgencyStyle(days)
                      const dateLabel = payment.date.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'long' })
                      return (
                        <div key={payment.key} className="payment-row" style={{ opacity: isPaid ? 0.45 : 1 }}>
                          <div
                            className="payment-checkbox"
                            style={{
                              border: isPaid ? '1.5px solid #c8f03a' : '1.5px solid rgba(240,237,228,0.2)',
                              background: isPaid ? 'rgba(200,240,58,0.1)' : 'none',
                              color: '#c8f03a',
                            }}
                            onClick={() => togglePaid(payment.key, payment.name)}
                          >
                            {isPaid ? '✓' : ''}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: '#f0ede4', fontWeight: 500 }}>{payment.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.35)', marginTop: 2 }}>{dateLabel}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {payment.amount > 0 && (
                              <div style={{ fontSize: 14, fontWeight: 500, color: '#f0ede4', fontVariantNumeric: 'tabular-nums' }}>
                                {fmt(payment.amount)} €
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: isPaid ? 'rgba(240,237,228,0.35)' : s.color, marginTop: 2 }}>
                              {isPaid ? lang.markedPaid : `${days} ${lang.daysAway}`}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(240,237,228,0.15)', marginTop: '0.5rem' }}>
                    {lang.paymentDisclaimer}
                  </div>
                </div>
              </>
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

            {/* Projected Annual */}
            {currentMonth >= 2 && totalIncome > 0 && (
              <div style={{
                background: '#161614', border: '1px solid rgba(240,237,228,0.06)',
                borderRadius: 12, padding: '0.9rem 1.25rem', marginBottom: '1.25rem',
                fontSize: 13, color: 'rgba(240,237,228,0.5)',
              }}>
                {language === 'bg' ? (
                  <>При текущото темпо ще спечелите <span style={{ color: '#c8f03a', fontWeight: 500 }}>{fmt(projectedAnnual)} {lang.currency}</span> тази година</>
                ) : (
                  <>At your current rate you're on track to earn <span style={{ color: '#c8f03a', fontWeight: 500 }}>{fmt(projectedAnnual)} {lang.currency}</span> this year</>
                )}
              </div>
            )}

            {/* Income + Expenses columns */}
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
