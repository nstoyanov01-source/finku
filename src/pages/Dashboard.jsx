import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../lib/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'
import AddEntryModal from '../components/AddEntryModal'
import CSVImport from '../components/CSVImport'
import Toast, { useToast } from '../components/Toast'
import EntryDrawer from '../components/EntryDrawer'
import { usePostHog } from '@posthog/react'
import { getCountry } from '../countries/index.js'

function greeting(lang) {
  const h = new Date().getHours()
  if (h < 12) return lang.goodMorning
  if (h < 18) return lang.goodAfternoon
  return lang.goodEvening
}

function fmt(n) {
  return Math.round(n).toLocaleString('en-US')
}

function fmtCurrency(n, currency) {
  const s = fmt(n)
  return currency.length === 1 ? `${currency}${s}` : `${s} ${currency}`
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

function nextTaxDeadline(quarterlyDeadlines) {
  const today = new Date()
  const y = today.getFullYear()
  const deadlines = quarterlyDeadlines || []
  const next = deadlines.find(d => d > today)
  if (next) {
    const days = Math.ceil((next - today) / 86400000)
    return { date: next, days, isAnnual: false }
  }
  // After last quarterly deadline: next is annual declaration (Apr 30 of next year)
  const annualDecl = new Date(y + 1, 3, 30)
  const days = Math.ceil((annualDecl - today) / 86400000)
  return { date: annualDecl, days, isAnnual: true }
}

function nextInsuranceDeadline(dueDay = 25) {
  const today = new Date()
  const day = today.getDate()
  const month = today.getMonth()
  const year = today.getFullYear()
  return day < dueDay
    ? new Date(year, month, dueDay)
    : new Date(year, month + 1, dueDay)
}

function formatDeadlineDate(date, language) {
  return date.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'short' })
}

function Skeleton({ height, radius = 16, style = {} }) {
  return <div className="skel" style={{ height, borderRadius: radius, ...style }} />
}

function Tooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 5 }}>
      <button
        type="button"
        className="btn-icon"
        style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '1px solid rgba(240,237,228,0.2)',
          background: 'none', cursor: 'help',
          fontSize: 11, color: 'rgba(240,237,228,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, fontFamily: 'DM Sans, sans-serif', lineHeight: 1,
          flexShrink: 0,
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        aria-label="More info"
      >?</button>
      {show && (
        <div className="tooltip-popup">
          {text}
        </div>
      )}
    </span>
  )
}

export default function Dashboard({ session, countryId = 'bg', legalForm, authorRate, onLanguageChange }) {
  const { language } = useLanguage()
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
  const { toasts, showToast } = useToast()
  const [firstName, setFirstName] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [setAside, setSetAside] = useState(() => Number(localStorage.getItem('finku_set_aside') || 0))
  const [editingSetAside, setEditingSetAside] = useState(false)
  const [setAsideInput, setSetAsideInput] = useState('')
  const [paidMap, setPaidMap] = useState(() => {
    const map = {}
    const y = new Date().getFullYear()
    ;['q1','q2','q3'].forEach(q => { map[`${q}_${y}`] = localStorage.getItem(`finku_paid_${q}_${y}`) === 'true' })
    const now = new Date()
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const k = `ins_${d.getFullYear()}_${String(d.getMonth()+1).padStart(2,'0')}`
      map[k] = localStorage.getItem(`finku_paid_${k}`) === 'true'
    }
    return map
  })
  const [showNapRef, setShowNapRef] = useState(false)

  useEffect(() => {
    document.title = 'Dashboard · Finku'
    posthog?.identify(userId, { email: session.user.email })
  }, [])

  useEffect(() => { fetchName() }, [])
  useEffect(() => { fetchData(selectedYear) }, [selectedYear])

  // These must be defined before the milestone useEffect that reads them
  const totalIncome = income.reduce((s, r) => s + Number(r.amount), 0)
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0)

  const prevTotalRef = useRef(0)
  useEffect(() => {
    if (loading || totalIncome <= 0) return
    const milestones = [1000, 5000, 10000, 25000, 50000, 100000]
    const hit = milestones.find(m => prevTotalRef.current < m && totalIncome >= m)
    if (hit) {
      const isBg = language === 'bg'
      const cur = getCountry(countryId).currency || '€'
      const m = (n) => cur.length === 1 ? `${cur}${n}` : `${n} ${cur}`
      const msgs = {
        1000: isBg ? `${m('1,000')} спечелени! Добро начало. 🌱` : `${m('1,000')} earned! Strong start. 🌱`,
        5000: isBg ? `${m('5,000')}! Вечеря навън? 🍽` : `${m('5,000')}! Treat yourself tonight. 🍽`,
        10000: isBg ? `${m('10,000')}! Вече истински фрийлансър. 🎉` : `${m('10,000')}! You're officially freelancing. 🎉`,
        25000: isBg ? `${m('25,000')}! Данъчните те обичат. 💚` : `${m('25,000')}! Tax authority loves you now. 💚`,
        50000: isBg ? `${m('50,000')}! Може би е момент за счетоводител. 😅` : `${m('50,000')}! Maybe time for an accountant. 😅`,
        100000: isBg ? `${m('100K')}! Легенда. 🏆` : `${m('100K')}! Absolute legend. 🏆`,
      }
      setTimeout(() => showToast(msgs[hit] || `${m(hit.toLocaleString())} milestone! 🎉`), 300)
    }
    prevTotalRef.current = totalIncome
  }, [totalIncome, loading])

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

  function saveSetAside() {
    const val = Math.max(0, parseFloat(setAsideInput) || 0)
    setSetAside(val)
    localStorage.setItem('finku_set_aside', String(val))
    setEditingSetAside(false)
  }

  function markPaid(key) {
    setPaidMap(prev => ({ ...prev, [key]: true }))
    localStorage.setItem(`finku_paid_${key}`, 'true')
    const q = key.match(/^(q\d)/)
    if (q) {
      const ta = getCountry(countryId).taxAuthority?.name || 'Tax authority'
      const msgs = {
        q1: language === 'bg' ? `Q1 платен! ${ta} е доволен. 💸` : `Q1 paid! ${ta} is satisfied. 💸`,
        q2: language === 'bg' ? 'Q2 платен! Заслужена почивка. 🏖' : 'Q2 paid! You earned that break. 🏖',
        q3: language === 'bg' ? 'Q3 платен! Само годишната остава. 🎯' : 'Q3 paid! Just the annual left. 🎯',
      }
      showToast(msgs[q[1]] || lang.markedPaid)
    } else {
      showToast(language === 'bg' ? 'Осигуровки платени. Бъдещото ти аз ти благодари. 🧓' : 'Insurance paid. Your future self thanks you. 🧓')
    }
  }

  // Country config — drives all tax calculations, currency, deadlines
  const countryConfig = getCountry(countryId)
  const currency = countryConfig.currency || '€'

  const currentMonth = new Date().getMonth() + 1
  const isPastYear = selectedYear < currentYear
  const monthsElapsed = isPastYear ? 12 : currentMonth

  const legalFormEff = legalForm || (countryConfig.legalForms?.[0]?.value || 'just_tracking')
  const isTracking = legalFormEff === 'just_tracking' || !countryConfig.supportsFullTax
  const insuranceRate = countryConfig.getInsuranceRate?.(selectedYear) || null

  const tax = !isTracking && countryConfig.calcTax
    ? countryConfig.calcTax(totalIncome, totalExpenses, legalFormEff, {
        authorRate: authorRate ?? false,
        monthsElapsed,
        year: selectedYear,
      })
    : null

  const quarterlyDates = countryConfig.getQuarterlyDeadlines?.(selectedYear) || []
  const quarterlyDateObjects = quarterlyDates.map(q => q.date)
  const deadline = tax ? nextTaxDeadline(quarterlyDateObjects) : null
  const quarter = Math.floor(new Date().getMonth() / 3) + 1
  const insDueDay = countryConfig.getInsuranceDueDay?.() || 25
  const insDue = nextInsuranceDeadline(insDueDay)
  const insDays = Math.ceil((insDue - new Date()) / 86400000)

  const projection = !isPastYear && totalIncome > 0 && monthsElapsed > 0
    ? Math.round((totalIncome / monthsElapsed) * 12)
    : null

  const totalOwedEst = tax?.total || 0
  const coverageStatus = totalOwedEst <= 0 ? 'none'
    : setAside >= totalOwedEst ? 'covered'
    : setAside >= totalOwedEst * 0.75 ? 'almost'
    : 'short'

  const insNow = new Date()
  const insMonthKey = `ins_${insNow.getFullYear()}_${String(insNow.getMonth()+1).padStart(2,'0')}`

  const qData = quarterlyDates.map((q, i) => ({
    key: `q${i+1}_${selectedYear}`,
    label: q.quarter,
    due: q.date,
  }))

  const todayMD = `${insNow.getMonth()}-${insNow.getDate()}`
  const isDeadlineToday = qData.some(q => {
    const d = q.due
    return d.getMonth() === insNow.getMonth() && d.getDate() === insNow.getDate()
  })

  const tooltips = {
    incomeTax: language === 'bg'
      ? 'Това е авансовият данък върху дохода ти за тримесечието. Формула: (приход × 75% - осигуровки) × 10%. Плаща се 3 пъти годишно.'
      : `This is your advance income tax estimate. Based on ${countryConfig.name} tax rules for your legal form. Paid quarterly.`,
    insurance: language === 'bg'
      ? `Фиксирана месечна вноска за пенсионно и здравно осигуряване. Плаща се до ${insDueDay}-о всеки месец.`
      : `Monthly social insurance contribution. Paid by the ${insDueDay}th of each month.`,
    recentIncome: language === 'bg'
      ? 'Приходи от фактури или плащания от клиенти. Добавяй всяко плащане което получаваш.'
      : 'Income from invoices or client payments. Add each payment you receive.',
  }

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
        .dash-year-select { font-size: 13px; border: 1px solid rgba(240,237,228,0.12); border-radius: 8px; padding: 5px 10px; background: rgba(240,237,228,0.06); color: rgba(240,237,228,0.7); cursor: pointer; outline: none; font-family: 'DM Sans', sans-serif; color-scheme: dark; }
        .dash-year-select:hover { border-color: rgba(240,237,228,0.25); }
        .dash-nav-btn { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: color 0.15s, background 0.15s; }
        .dash-nav-btn:hover { color: #f0ede4; background: rgba(240,237,228,0.06); }
        .dash-nav-logout { background: none; border: 1px solid rgba(240,237,228,0.12); color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 6px 14px; border-radius: 8px; transition: color 0.15s, border-color 0.15s, background 0.15s; }
        .dash-nav-logout:hover { color: #f0ede4; border-color: rgba(240,237,228,0.25); background: rgba(240,237,228,0.04); }

        .dash-page { min-height: 100vh; background: #0e0e0c; padding-top: 60px; }
        .dash-content { max-width: 640px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }
        .dash-greeting { font-size: 20px; font-weight: 500; color: #f0ede4; letter-spacing: -0.3px; }
        .dash-subheading { font-size: 13px; color: rgba(240,237,228,0.35); margin-top: 3px; margin-bottom: 1.75rem; }

        .entry-row { display: flex; align-items: center; justify-content: space-between; background: #161614; border-radius: 8px; padding: 10px 14px; margin-bottom: 6px; cursor: pointer; transition: background 0.12s; }
        .entry-row:hover { background: #1c1c1a; }
        .entry-desc { font-size: 13px; font-weight: 500; color: #f0ede4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .entry-date { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 2px; }

        .section-label { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.7px; }
        .view-all-link { font-size: 12px; color: rgba(240,237,228,0.3); text-decoration: none; transition: color 0.15s; }
        .view-all-link:hover { color: rgba(240,237,228,0.65); }

        .tooltip-popup {
          position: absolute; bottom: calc(100% + 6px); left: 50%;
          transform: translateX(-50%);
          background: #1e1e1c; border: 1px solid rgba(240,237,228,0.1);
          border-radius: 8px; padding: 10px 14px; font-size: 12px;
          width: 260px; z-index: 100; color: rgba(240,237,228,0.7);
          line-height: 1.55; white-space: normal; pointer-events: none;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .dash-mobile-menu-btn {
          display: none; background: none; border: 1px solid rgba(240,237,228,0.12);
          color: rgba(240,237,228,0.6); border-radius: 8px; padding: 5px 7px;
          cursor: pointer; align-items: center; justify-content: center;
        }
        .dash-mobile-menu {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: #1e1e1c; border: 1px solid rgba(240,237,228,0.1);
          border-radius: 12px; padding: 6px; min-width: 160px; z-index: 200;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .dash-mobile-menu button {
          display: block; width: 100%; text-align: left; background: none;
          border: none; color: rgba(240,237,228,0.7); font-family: 'DM Sans', sans-serif;
          font-size: 14px; padding: 9px 12px; border-radius: 8px; cursor: pointer;
          transition: background 0.12s; min-height: unset;
        }
        .dash-mobile-menu button:hover { background: rgba(240,237,228,0.06); }
        .dash-mobile-menu-logout { color: rgba(220,90,90,0.85) !important; }

        @keyframes pulse-red { 0%,100% { opacity:1 } 50% { opacity:0.6 } }
        .urgent-pay { animation: pulse-red 1.4s ease-in-out infinite; }
        @keyframes shimmer {
          0%   { background-position: -800px 0 }
          100% { background-position: 800px 0 }
        }
        .skel {
          background: linear-gradient(90deg, rgba(240,237,228,0.04) 25%, rgba(240,237,228,0.08) 50%, rgba(240,237,228,0.04) 75%);
          background-size: 1600px 100%;
          animation: shimmer 1.5s infinite linear;
        }

        @media (max-width: 768px) {
          .dash-nav { padding: 0 1rem; }
          .dash-content { padding: 1.5rem 1rem 5rem; }
          .dash-nav-btn { display: none; }
          .dash-hide-mobile { display: none !important; }
          .dash-mobile-menu-btn { display: inline-flex; }
          .tooltip-popup { left: 0; transform: none; width: min(260px, calc(100vw - 2rem)); }
        }
        @media (max-width: 390px) {
          .dash-nav-logout { display: none; }
        }
      `}</style>

      <div className="dash-page">
        <nav className="dash-nav">
          <div className="dash-nav-logo">Finku</div>
          <div className="dash-nav-right">
            <select
              className="dash-year-select"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => navigate('/invoice/new')}
              className="dash-hide-mobile"
              style={{
                background: 'rgba(200,240,58,0.1)', border: '1px solid rgba(200,240,58,0.2)',
                color: '#c8f03a', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              + {lang.navNewInvoice}
            </button>
            <button className="dash-nav-btn" onClick={() => navigate('/blog')}>
              {lang.footerBlog}
            </button>
            <button className="dash-nav-btn" onClick={() => navigate('/profile')}>
              {lang.navProfile}
            </button>
            <LanguageToggle />
            <button className="dash-nav-logout" onClick={handleLogout}>{lang.logout}</button>
            <div style={{ position: 'relative' }}>
              <button
                className="dash-mobile-menu-btn btn-icon"
                onClick={e => { e.stopPropagation(); setMobileMenuOpen(o => !o) }}
                aria-label="Menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              {mobileMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setMobileMenuOpen(false)} />
                  <div className="dash-mobile-menu">
                    <button onClick={() => { navigate('/profile'); setMobileMenuOpen(false) }}>{lang.navProfile}</button>
                    <button onClick={() => { navigate('/blog'); setMobileMenuOpen(false) }}>{lang.footerBlog}</button>
                    <button onClick={() => { navigate('/invoice/new'); setMobileMenuOpen(false) }}>+ {lang.navNewInvoice}</button>
                    <button onClick={() => { navigate('/invoices'); setMobileMenuOpen(false) }}>{language === 'bg' ? 'Фактури' : 'Invoices'}</button>
                    <button className="dash-mobile-menu-logout" onClick={handleLogout}>{lang.logout}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Empty state — no entries at all */}
        {!loading && income.length === 0 && expenses.length === 0 ? (
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
              {lang.emptyStateTitle}
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(240,237,228,0.5)', marginBottom: '2rem', maxWidth: 400, lineHeight: 1.65 }}>
              {lang.emptyStateDesc}
            </p>
            <button
              className="btn-primary"
              onClick={() => setModal({ type: 'income' })}
              style={{ width: '100%', maxWidth: 360, justifyContent: 'center', fontSize: 15, padding: '14px 24px', marginBottom: '1.25rem' }}
            >
              + {lang.addFirstIncome}
            </button>
            <div style={{ fontSize: 14, color: 'rgba(240,237,228,0.35)' }}>
              <CSVImport userId={userId} language={language} onImported={() => fetchData(selectedYear)} />
            </div>
          </div>

        ) : (
          <div className="dash-content">

            {/* 1. GREETING */}
            <div className="dash-greeting">
              {loading
                ? <Skeleton height={24} radius={6} style={{ width: 200 }} />
                : <>{greeting(lang)}{firstName ? `, ${firstName}` : ''}</>
              }
            </div>
            <div className="dash-subheading">
              {loading ? <Skeleton height={14} radius={4} style={{ width: 180, marginTop: 6 }} /> : formatCurrentDate(language)}
            </div>

            {/* Deadline today banner */}
            {isDeadlineToday && !loading && (
              <div style={{ background: 'rgba(224,112,112,0.1)', border: '1px solid rgba(224,112,112,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem', fontSize: 13, color: '#e07070', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚡</span>
                <span>{language === 'bg' ? 'Данъчен срок е ДНЕС. Не бъди онзи човек.' : "Tax deadline is TODAY. Don't be that person."}</span>
              </div>
            )}

            {/* Income projection */}
            {projection && !loading && (
              <div style={{ fontSize: 12, color: 'rgba(200,240,58,0.55)', marginBottom: '1.5rem', letterSpacing: '0.2px' }}>
                {language === 'bg'
                  ? `На път за ~${fmtCurrency(projection, currency)} тази година · ${monthsElapsed} ${monthsElapsed === 1 ? 'месец' : 'месеца'} досега`
                  : `On track for ~${fmtCurrency(projection, currency)} this year · ${monthsElapsed} month${monthsElapsed !== 1 ? 's' : ''} in`}
              </div>
            )}

            {/* 2. HERO CARD — Income tax */}
            {loading ? (
              <Skeleton height={140} style={{ marginBottom: 12 }} />
            ) : isTracking ? (
              <div style={{
                background: '#161614', border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '22px 24px', marginBottom: 12,
              }}>
                <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.35)', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 500, marginBottom: 8 }}>
                  {lang.trackingModeLabel}
                </div>
                <div style={{ fontSize: 16, color: 'rgba(240,237,228,0.5)', lineHeight: 1.5 }}>
                  {lang.noTaxEstimate}
                </div>
              </div>
            ) : tax && (
              <div style={{
                background: '#c8f03a', borderRadius: 16, padding: '22px 24px', marginBottom: 12,
                position: 'relative',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 500 }}>
                    {language === 'bg' ? `Данък върху дохода — Q${quarter}` : `Income tax — Q${quarter}`}
                  </span>
                  <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}>
                    <Tooltip text={tooltips.incomeTax} />
                  </span>
                </div>
                <div style={{ fontSize: 'clamp(28px, 7vw, 52px)', fontWeight: 600, color: '#0e0e0c', letterSpacing: -1.5, lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
                  ~{fmtCurrency(tax.incomeTax, currency)}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginBottom: 16 }}>
                  {tax.incomeTax === 0
                    ? lang.deductionsCover
                    : (language === 'bg'
                        ? `Основа: ~${fmtCurrency(tax.taxableBase, currency)} × ${tax.rate}%`
                        : `Base: ~${fmtCurrency(tax.taxableBase, currency)} × ${tax.rate}%`)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {deadline && (
                    <span style={{
                      background: 'rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.6)',
                      fontSize: 12, borderRadius: 20, padding: '4px 12px',
                    }}>
                      {language === 'bg'
                        ? `До ${formatDeadlineDate(deadline.date, language)} · ${deadline.days} дни`
                        : `Due ${formatDeadlineDate(deadline.date, language)} · ${deadline.days} days`}
                    </span>
                  )}
                  <Link
                    to="/how-to-pay"
                    style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', textDecoration: 'none', marginLeft: 'auto', transition: 'color 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.color = 'rgba(0,0,0,0.75)' }}
                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(0,0,0,0.5)' }}
                  >
                    {lang.howToPayLink}
                  </Link>
                </div>
              </div>
            )}

            {/* 3. INSURANCE CARD */}
            {loading ? (
              <Skeleton height={88} style={{ marginBottom: 20 }} />
            ) : !isTracking && insuranceRate !== null && (
              <div style={{
                background: '#161614', border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '18px 20px', marginBottom: 20,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 500 }}>
                      {lang.monthlyInsurance}
                    </span>
                    <Tooltip text={tooltips.insurance} />
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 500, color: '#f0ede4', letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtCurrency(insuranceRate, currency)}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    {lang.insuranceFixedDesc}
                  </div>
                </div>
                <div style={{
                  background: insDays <= 14 ? 'rgba(255,180,0,0.12)' : 'rgba(200,240,58,0.1)',
                  color: insDays <= 14 ? '#ffb400' : '#c8f03a',
                  border: `1px solid ${insDays <= 14 ? 'rgba(255,180,0,0.3)' : 'rgba(200,240,58,0.3)'}`,
                  fontSize: 12, fontWeight: 500, borderRadius: 20, padding: '6px 12px',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {language === 'bg'
                    ? `До ${formatDeadlineDate(insDue, language)} · ${insDays} дни`
                    : `Due ${formatDeadlineDate(insDue, language)} · ${insDays} days`}
                </div>
              </div>
            )}

            {/* 3b. ARE YOU COVERED? */}
            {!loading && !isTracking && tax && totalOwedEst > 0 && (
              <div style={{
                background: '#161614',
                border: `1px solid ${coverageStatus === 'covered' ? 'rgba(200,240,58,0.2)' : coverageStatus === 'almost' ? 'rgba(255,180,0,0.2)' : 'rgba(224,112,112,0.15)'}`,
                borderRadius: 16, padding: '18px 20px', marginBottom: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'rgba(240,237,228,0.3)', fontWeight: 500 }}>
                    {language === 'bg' ? 'Покрито ли е?' : 'Are you covered?'}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 500, borderRadius: 20, padding: '3px 10px',
                    background: coverageStatus === 'covered' ? 'rgba(200,240,58,0.12)' : coverageStatus === 'almost' ? 'rgba(255,180,0,0.12)' : 'rgba(224,112,112,0.12)',
                    color: coverageStatus === 'covered' ? '#c8f03a' : coverageStatus === 'almost' ? '#ffb400' : '#e07070',
                    border: `1px solid ${coverageStatus === 'covered' ? 'rgba(200,240,58,0.3)' : coverageStatus === 'almost' ? 'rgba(255,180,0,0.3)' : 'rgba(224,112,112,0.25)'}`,
                  }}>
                    {coverageStatus === 'covered'
                      ? (language === 'bg' ? '✓ Покрито' : '✓ Covered')
                      : coverageStatus === 'almost'
                        ? (language === 'bg' ? '⚠ Почти' : '⚠ Almost there')
                        : (language === 'bg' ? '✗ Непокрито' : '✗ Not covered')}
                  </span>
                </div>

                <div style={{ height: 6, background: 'rgba(240,237,228,0.06)', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(totalOwedEst > 0 ? (setAside / totalOwedEst) * 100 : 0, 100)}%`,
                    background: coverageStatus === 'covered' ? '#c8f03a' : coverageStatus === 'almost' ? '#ffb400' : '#e07070',
                    borderRadius: 6, transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(240,237,228,0.4)', marginBottom: 12 }}>
                  <span>{language === 'bg' ? 'Заделено' : 'Set aside'}: <strong style={{ color: '#f0ede4' }}>{fmtCurrency(setAside, currency)}</strong></span>
                  <span>{language === 'bg' ? 'Нужно ~' : 'Need ~'}<strong style={{ color: '#f0ede4' }}>{fmtCurrency(totalOwedEst, currency)}</strong></span>
                </div>

                {editingSetAside ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number" min="0" placeholder="0"
                      value={setAsideInput}
                      onChange={e => setSetAsideInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveSetAside()}
                      autoFocus
                      style={{ flex: 1, background: 'rgba(240,237,228,0.06)', border: '1px solid rgba(240,237,228,0.15)', borderRadius: 8, padding: '7px 12px', fontSize: 14, color: '#f0ede4', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
                    />
                    <button onClick={saveSetAside} style={{ background: '#c8f03a', color: '#0e0e0c', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      {language === 'bg' ? 'Запази' : 'Save'}
                    </button>
                    <button onClick={() => setEditingSetAside(false)} style={{ background: 'none', border: '1px solid rgba(240,237,228,0.12)', color: 'rgba(240,237,228,0.4)', borderRadius: 8, padding: '7px 10px', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setSetAsideInput(String(setAside || '')); setEditingSetAside(true) }}
                    style={{ background: 'none', border: '1px solid rgba(240,237,228,0.1)', color: 'rgba(240,237,228,0.4)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.15s, border-color 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#f0ede4'; e.currentTarget.style.borderColor = 'rgba(240,237,228,0.25)' }}
                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(240,237,228,0.4)'; e.currentTarget.style.borderColor = 'rgba(240,237,228,0.1)' }}
                  >
                    ✎ {language === 'bg' ? 'Обнови заделеното' : 'Update set aside'}
                  </button>
                )}
              </div>
            )}

            {/* 3c. PAYMENT CHECKLIST */}
            {!loading && !isTracking && !isPastYear && (
              <div style={{ background: '#161614', border: '0.5px solid rgba(240,237,228,0.07)', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'rgba(240,237,228,0.25)', fontWeight: 500 }}>
                    {lang.upcomingPayments}
                  </div>
                </div>

                {/* Client withholding caveat */}
                {countryConfig.clientWithholdingNote && (
                  <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.3)', lineHeight: 1.55, marginBottom: 12, padding: '8px 10px', background: 'rgba(240,237,228,0.03)', borderRadius: 8 }}>
                    {countryConfig.clientWithholdingNote[language] || countryConfig.clientWithholdingNote.en}
                  </div>
                )}

                {qData.map(q => {
                  const isPaid = paidMap[q.key]
                  const today = new Date()
                  const daysLeft = Math.ceil((q.due - today) / 86400000)
                  const isPast = q.due < today
                  const isUrgent = !isPaid && daysLeft >= 0 && daysLeft <= 14
                  return (
                    <div key={q.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '0.5px solid rgba(240,237,228,0.05)' }}>
                      <div>
                        <div style={{ fontSize: 13, color: isPaid ? 'rgba(240,237,228,0.35)' : '#f0ede4', textDecoration: isPaid ? 'line-through' : 'none' }}>
                          {language === 'bg' ? `${q.label} — декларирай и плати` : `${q.label} — declare & pay`}
                        </div>
                        <div style={{ fontSize: 11, color: isUrgent && !isPaid ? '#ffb400' : 'rgba(240,237,228,0.25)', marginTop: 2 }}>
                          {(countryConfig.declarationLaw?.[language] || countryConfig.declarationLaw?.en || '')}
                          {countryConfig.declarationLaw ? ' · ' : ''}
                          {q.due.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'long' })}
                          {!isPaid && !isPast && ` · ${daysLeft} ${lang.daysAway}`}
                          {!isPaid && isPast && ` · ${language === 'bg' ? '⚠ просрочено' : '⚠ overdue'}`}
                        </div>
                      </div>
                      {isPaid ? (
                        <span style={{ fontSize: 12, color: '#c8f03a' }}>✓ {lang.markedPaid}</span>
                      ) : (
                        <button
                          onClick={() => markPaid(q.key)}
                          className={isUrgent ? 'urgent-pay' : ''}
                          style={{
                            fontSize: 12, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', borderRadius: 8, padding: '5px 12px',
                            background: isPast ? 'rgba(255,150,0,0.1)' : isUrgent ? 'rgba(224,112,112,0.1)' : 'rgba(240,237,228,0.05)',
                            border: `1px solid ${isPast ? 'rgba(255,150,0,0.3)' : isUrgent ? 'rgba(224,112,112,0.3)' : 'rgba(240,237,228,0.12)'}`,
                            color: isPast ? '#ffa500' : isUrgent ? '#e07070' : 'rgba(240,237,228,0.5)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {language === 'bg' ? 'Отбележи' : 'Mark paid'}
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Insurance — current month */}
                {(() => {
                  const isPaid = paidMap[insMonthKey]
                  const daysLeft = Math.ceil((insDue - new Date()) / 86400000)
                  const isUrgent = !isPaid && daysLeft <= 5
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0' }}>
                      <div>
                        <div style={{ fontSize: 13, color: isPaid ? 'rgba(240,237,228,0.35)' : '#f0ede4', textDecoration: isPaid ? 'line-through' : 'none' }}>
                          {language === 'bg'
                            ? `Осигуровки · ${insDue.toLocaleDateString('bg-BG', { month: 'long' })}`
                            : `Insurance · ${insDue.toLocaleDateString('en-GB', { month: 'long' })}`}
                        </div>
                        <div style={{ fontSize: 11, color: isUrgent && !isPaid ? '#ffb400' : 'rgba(240,237,228,0.25)', marginTop: 2 }}>
                          {insDue.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'long' })}
                          {!isPaid && ` · ${daysLeft} ${lang.daysAway}`}
                        </div>
                      </div>
                      {isPaid ? (
                        <span style={{ fontSize: 12, color: '#c8f03a' }}>✓ {lang.markedPaid}</span>
                      ) : (
                        <button
                          onClick={() => markPaid(insMonthKey)}
                          className={isUrgent ? 'urgent-pay' : ''}
                          style={{
                            fontSize: 12, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', borderRadius: 8, padding: '5px 12px',
                            background: isUrgent ? 'rgba(224,112,112,0.1)' : 'rgba(240,237,228,0.05)',
                            border: `1px solid ${isUrgent ? 'rgba(224,112,112,0.3)' : 'rgba(240,237,228,0.12)'}`,
                            color: isUrgent ? '#e07070' : 'rgba(240,237,228,0.5)',
                          }}
                        >
                          {language === 'bg' ? 'Отбележи' : 'Mark paid'}
                        </button>
                      )}
                    </div>
                  )
                })()}

                {/* Penalty callout */}
                {countryConfig.penaltyText && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(224,112,112,0.05)', borderRadius: 8, borderLeft: '2px solid rgba(224,112,112,0.25)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(224,112,112,0.6)', lineHeight: 1.55 }}>
                      {countryConfig.penaltyText[language] || countryConfig.penaltyText.en}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(240,237,228,0.2)', lineHeight: 1.5 }}>
                  {lang.paymentDisclaimer}
                </div>
              </div>
            )}

            {/* 4. ACTION BUTTONS */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                <Skeleton height={48} radius={10} />
                <Skeleton height={48} radius={10} />
              </div>
            ) : !isPastYear && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                <button
                  onClick={() => setModal({ type: 'income' })}
                  style={{
                    background: '#c8f03a', color: '#0e0e0c', border: 'none',
                    borderRadius: 10, padding: '14px', fontFamily: 'DM Sans, sans-serif',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s',
                    minHeight: 44,
                  }}
                  onMouseOver={e => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
                >
                  {lang.addIncome}
                </button>
                <button
                  onClick={() => setModal({ type: 'expense' })}
                  style={{
                    background: 'rgba(255,255,255,0.05)', color: '#f0ede4',
                    border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                    minHeight: 44,
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                >
                  {lang.addExpense}
                </button>
              </div>
            )}

            {/* 5. RECENT INCOME */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="section-label">{lang.recentIncome}</span>
                  {!loading && <Tooltip text={tooltips.recentIncome} />}
                </span>
                {!loading && income.length > 0 && (
                  <Link to="/income" className="view-all-link">{lang.viewAll}</Link>
                )}
              </div>

              {loading ? (
                <>
                  <Skeleton height={48} radius={8} style={{ marginBottom: 6 }} />
                  <Skeleton height={48} radius={8} style={{ marginBottom: 6 }} />
                  <Skeleton height={48} radius={8} style={{ marginBottom: 6 }} />
                </>
              ) : income.length === 0 ? (
                <div style={{ fontSize: 13, color: 'rgba(240,237,228,0.2)', textAlign: 'center', padding: '1.25rem 0' }}>
                  {language === 'bg'
                    ? 'Все още няма приходи — добави първия си приход по-горе'
                    : 'No income yet — add your first entry above'}
                </div>
              ) : (
                income.slice(0, 5).map(row => (
                  <div key={row.id} className="entry-row" onClick={() => setDrawer({ entry: row, type: 'income' })}>
                    <div style={{ minWidth: 0 }}>
                      <div className="entry-desc">{row.description}</div>
                      <div className="entry-date">{formatDate(row.date, language)}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#c8f03a', flexShrink: 0, marginLeft: 12, fontVariantNumeric: 'tabular-nums' }}>
                      +{fmtCurrency(row.amount, currency)}
                    </div>
                  </div>
                ))
              )}

              {!loading && !isPastYear && (
                <div style={{ marginTop: 8 }}>
                  <CSVImport userId={userId} language={language} onImported={() => fetchData(selectedYear)} />
                </div>
              )}
            </div>

            {/* 6. RECENT EXPENSES */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="section-label">{lang.recentExpenses}</span>
                {!loading && expenses.length > 0 && (
                  <Link to="/expenses" className="view-all-link">{lang.viewAll}</Link>
                )}
              </div>

              {loading ? (
                <>
                  <Skeleton height={48} radius={8} style={{ marginBottom: 6 }} />
                  <Skeleton height={48} radius={8} style={{ marginBottom: 6 }} />
                  <Skeleton height={48} radius={8} style={{ marginBottom: 6 }} />
                </>
              ) : expenses.length === 0 ? (
                <div style={{ fontSize: 13, color: 'rgba(240,237,228,0.2)', textAlign: 'center', padding: '1.25rem 0' }}>
                  {language === 'bg'
                    ? 'Все още няма разходи — добави първия си разход по-горе'
                    : 'No expenses yet — add your first entry above'}
                </div>
              ) : (
                expenses.slice(0, 5).map(row => (
                  <div key={row.id} className="entry-row" onClick={() => setDrawer({ entry: row, type: 'expense' })}>
                    <div style={{ minWidth: 0 }}>
                      <div className="entry-desc">{row.description}</div>
                      <div className="entry-date">{formatDate(row.date, language)}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#e07070', flexShrink: 0, marginLeft: 12, fontVariantNumeric: 'tabular-nums' }}>
                      −{fmtCurrency(row.amount, currency)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ANNUAL TAX RETURN CARD — shown in Q4 or within 60 days of the country's annual deadline */}
            {!loading && !isTracking && countryConfig.getAnnualDeadline && (() => {
              const today = new Date()
              const thisYear = today.getFullYear()
              const annualDue = countryConfig.getAnnualDeadline(thisYear)
              const nextAnnualDue = annualDue < today ? countryConfig.getAnnualDeadline(thisYear + 1) : annualDue
              const daysToAnnual = Math.ceil((nextAnnualDue - today) / 86400000)
              const isQ4 = today.getMonth() >= 9
              if (!isQ4 && daysToAnnual > 60) return null
              const annualLaw = countryConfig.annualDeclarationLaw?.[language] || countryConfig.annualDeclarationLaw?.en || ''
              const dueDateStr = nextAnnualDue.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'long' })
              const portalHref = countryConfig.taxAuthority?.portalUrl || '/how-to-pay'
              return (
                <div style={{ background: '#161614', border: '1px solid rgba(200,240,58,0.15)', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'rgba(200,240,58,0.5)', marginBottom: 8 }}>
                    {language === 'bg' ? 'Годишна данъчна декларация' : 'Annual tax return'}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(240,237,228,0.65)', lineHeight: 1.6, marginBottom: 10 }}>
                    {language === 'bg'
                      ? `До ${dueDateStr} трябва да подадеш годишна данъчна декларация${annualLaw ? ` (${annualLaw})` : ''}. Срокът е ${daysToAnnual} дни.`
                      : `By ${dueDateStr} you must file your annual tax return${annualLaw ? ` (${annualLaw})` : ''}. That's ${daysToAnnual} days away.`}
                  </div>
                  <a href={portalHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#c8f03a', textDecoration: 'none' }}>
                    {language === 'bg' ? 'Как да платиш →' : 'How to file →'}
                  </a>
                </div>
              )
            })()}

            {/* TAX AUTHORITY FILING REFERENCE — collapsible */}
            {!loading && !isTracking && countryConfig.taxPortalHelp && countryConfig.taxAuthority && (
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => setShowNapRef(r => !r)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'none', border: '0.5px solid rgba(240,237,228,0.08)', borderRadius: showNapRef ? '12px 12px 0 0' : 12,
                    padding: '12px 16px', cursor: 'pointer', color: 'rgba(240,237,228,0.4)',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 12, transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.18)'; e.currentTarget.style.color = 'rgba(240,237,228,0.65)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.08)'; e.currentTarget.style.color = 'rgba(240,237,228,0.4)' }}
                >
                  <span>
                    {language === 'bg'
                      ? `${countryConfig.taxAuthority.name} — Как да платя?`
                      : `${countryConfig.taxAuthority.name} — How to file?`}
                  </span>
                  <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: showNapRef ? 'rotate(180deg)' : 'none' }}>▼</span>
                </button>
                {showNapRef && (
                  <div style={{ background: '#161614', border: '0.5px solid rgba(240,237,228,0.08)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '16px' }}>
                    <div style={{ fontSize: 12, color: 'rgba(240,237,228,0.5)', lineHeight: 1.65, marginBottom: 14 }}>
                      {countryConfig.taxPortalHelp.desc?.[language] || countryConfig.taxPortalHelp.desc?.en}
                    </div>
                    {countryConfig.taxPortalHelp.items?.map(item => (
                      <div key={item.label.en || item.label.bg} style={{ padding: '8px 0', borderBottom: '0.5px solid rgba(240,237,228,0.05)' }}>
                        <div style={{ fontSize: 13, color: 'rgba(240,237,228,0.7)', marginBottom: 2 }}>
                          {item.label[language] || item.label.en}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.3)' }}>
                          {item.sub[language] || item.sub.en}
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <a
                        href={countryConfig.taxAuthority.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#c8f03a', textDecoration: 'none', background: 'rgba(200,240,58,0.08)', border: '1px solid rgba(200,240,58,0.2)', borderRadius: 8, padding: '6px 12px', transition: 'background 0.15s' }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(200,240,58,0.14)' }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(200,240,58,0.08)' }}
                      >
                        {language === 'bg' ? `Портал ${countryConfig.taxAuthority.name} →` : `${countryConfig.taxAuthority.name} portal →`}
                      </a>
                      <a
                        href={countryConfig.taxAuthority.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: 'rgba(240,237,228,0.4)', textDecoration: 'none', background: 'rgba(240,237,228,0.04)', border: '1px solid rgba(240,237,228,0.1)', borderRadius: 8, padding: '6px 12px', transition: 'background 0.15s' }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(240,237,228,0.08)' }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(240,237,228,0.04)' }}
                      >
                        {countryConfig.taxAuthority.name.toLowerCase()}.{countryConfig.taxAuthority.url.split('.').pop()} →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && (
              <p style={{ fontSize: 11, color: 'rgba(240,237,228,0.15)', textAlign: 'center', borderTop: '0.5px solid rgba(240,237,228,0.06)', paddingTop: '1rem' }}>
                {lang.disclaimer}
              </p>
            )}
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
            const { entry, type } = drawer
            setDrawer(null)
            if (type === 'income') setIncome(prev => prev.filter(e => e.id !== entry.id))
            else setExpenses(prev => prev.filter(e => e.id !== entry.id))
            showToast(lang.entryDeleted, 'success')
          }}
        />
      )}

      {modal && (
        <AddEntryModal
          type={modal.type}
          userId={userId}
          language={language}
          onClose={() => setModal(null)}
          onSaved={(savedEntry) => {
            if (modal.entry) {
              if (modal.type === 'income') {
                setIncome(prev => prev.map(e => e.id === savedEntry.id ? savedEntry : e))
              } else {
                setExpenses(prev => prev.map(e => e.id === savedEntry.id ? savedEntry : e))
              }
              showToast(lang.entryUpdated, 'success')
            } else {
              if (modal.type === 'income') {
                setIncome(prev => [savedEntry, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)))
              } else {
                setExpenses(prev => [savedEntry, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)))
              }
              showToast(modal.type === 'income' ? lang.incomeAdded : lang.expenseAdded, 'success')
            }
          }}
          onDeleted={() => {
            const id = modal.entry?.id
            const type = modal.type
            if (type === 'income') setIncome(prev => prev.filter(e => e.id !== id))
            else setExpenses(prev => prev.filter(e => e.id !== id))
            showToast(lang.entryDeleted, 'success')
          }}
          initialData={modal.entry}
          entryId={modal.entry?.id}
        />
      )}
      <Toast toasts={toasts} />
    </>
  )
}
