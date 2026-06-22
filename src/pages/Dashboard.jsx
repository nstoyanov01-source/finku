import { useEffect, useState } from 'react'
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

const INSURANCE_BY_YEAR = { 2024: 140, 2025: 147, 2026: 153.08 }

function calcTax(totalIncome, totalExpenses, legalForm, useAuthorRate = false, monthsElapsed = null, insuranceRate = 153.08) {
  if (legalForm === 'just_tracking') return null
  if (monthsElapsed === null) monthsElapsed = new Date().getMonth() + 1
  const insurancePerMonth = insuranceRate
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

export default function Dashboard({ session, legalForm, authorRate, onLanguageChange }) {
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
  const insuranceRate = INSURANCE_BY_YEAR[selectedYear] || 153.08
  const tax = calcTax(totalIncome, totalExpenses, legalFormEff, authorRate ?? false, monthsElapsed, insuranceRate)
  const deadline = tax ? nextTaxDeadline() : null
  const quarter = Math.floor(new Date().getMonth() / 3) + 1
  const insDue = nextInsuranceDeadline()
  const insDays = Math.ceil((insDue - new Date()) / 86400000)

  const tooltips = {
    incomeTax: language === 'bg'
      ? 'Това е авансовият данък върху дохода ти за тримесечието. Формула: (приход × 75% - осигуровки) × 10%. Плаща се 3 пъти годишно.'
      : 'This is your advance income tax payment for the quarter. Formula: (income × 75% − insurance) × 10%. Paid 3 times a year.',
    insurance: language === 'bg'
      ? 'Фиксирана месечна вноска за пенсионно и здравно осигуряване. Минимум 153 €/месец независимо от дохода. Плаща се до 25-о всеки месец.'
      : 'Fixed monthly contribution to pension and health insurance. Minimum 153 €/month regardless of income. Paid by the 25th of each month.',
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
                  ~{fmt(tax.incomeTax)} €
                </div>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginBottom: 16 }}>
                  {tax.incomeTax === 0
                    ? lang.deductionsCover
                    : (language === 'bg'
                        ? `Основа: ~${fmt(tax.taxableBase)} € × ${tax.rate}%`
                        : `Base: ~${fmt(tax.taxableBase)} € × ${tax.rate}%`)}
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
            ) : !isTracking && (
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
                    {Math.round(insuranceRate)} €
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
                      +{fmt(row.amount)} {lang.currency}
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
                      −{fmt(row.amount)} {lang.currency}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ANNUAL TAX RETURN CARD — shown in Q4 or within 60 days of April 30 */}
            {!loading && !isTracking && (() => {
              const today = new Date()
              const isQ4 = today.getMonth() >= 9
              const apr30 = new Date(today.getFullYear() + (today.getMonth() >= 4 ? 1 : 0), 3, 30)
              const daysToApr = Math.ceil((apr30 - today) / 86400000)
              if (!isQ4 && daysToApr > 60) return null
              return (
                <div style={{ background: '#161614', border: '1px solid rgba(200,240,58,0.15)', borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'rgba(200,240,58,0.5)', marginBottom: 8 }}>
                    {language === 'bg' ? 'Годишна данъчна декларация' : 'Annual tax return'}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(240,237,228,0.65)', lineHeight: 1.6, marginBottom: 10 }}>
                    {language === 'bg'
                      ? `До 30 април трябва да подадеш годишна данъчна декларация (чл. 50 ЗДДФЛ). Срокът е ${daysToApr} дни.`
                      : `By April 30 you must file your annual tax return (Art. 50 ZDFL). That's ${daysToApr} days away.`}
                  </div>
                  <a href="/how-to-pay" style={{ fontSize: 13, color: '#c8f03a', textDecoration: 'none' }}>
                    {language === 'bg' ? 'Как да платиш →' : 'How to pay →'}
                  </a>
                </div>
              )
            })()}

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
