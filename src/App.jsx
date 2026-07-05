import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useLanguage } from './lib/LanguageContext'
import posthog from 'posthog-js'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import LanguageSelect from './pages/LanguageSelect'
import CountrySelect from './pages/CountrySelect'
import LegalFormSelect from './pages/LegalFormSelect'
import Dashboard from './pages/Dashboard'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Profile from './pages/Profile'
import UpdatePassword from './pages/UpdatePassword'
import NewInvoice from './pages/NewInvoice'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import HowToPay from './pages/HowToPay'
import NapTracking from './pages/NapTracking'
import IncomeList from './pages/IncomeList'
import ExpenseList from './pages/ExpenseList'
import InvoiceList from './pages/InvoiceList'
import NotFound from './pages/NotFound'

export default function App() {
  const [session, setSession] = useState(null)
  const { language, setLanguage } = useLanguage()
  const [onboarded, setOnboarded] = useState(null)
  const [country, setCountry] = useState(null)
  const [legalForm, setLegalForm] = useState(null)
  const [authorRate, setAuthorRate] = useState(false)
  const [needsCountry, setNeedsCountry] = useState(false)
  const [needsLegalForm, setNeedsLegalForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionWarning, setSessionWarning] = useState(false)
  const lastActivity = useRef(Date.now())
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        posthog.identify(session.user.id, { email: session.user.email })
        loadProfile(session.user.id)
      } else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session)
        navigate('/update-password')
        return
      }
      setSession(session)
      if (session) {
        posthog.identify(session.user.id, { email: session.user.email })
        loadProfile(session.user.id)
      } else {
        localStorage.removeItem('finku_set_aside')
        localStorage.removeItem('finku_visited')
        localStorage.removeItem('finku_tax_explained')
        Object.keys(localStorage).filter(k => k.startsWith('finku_paid_')).forEach(k => localStorage.removeItem(k))
        setOnboarded(null); setCountry(null); setLegalForm(null)
        setAuthorRate(false); setNeedsCountry(false); setNeedsLegalForm(false); setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setSessionWarning(false); return }
    lastActivity.current = Date.now()
    const resetActivity = () => { lastActivity.current = Date.now(); setSessionWarning(false) }
    window.addEventListener('mousemove', resetActivity)
    window.addEventListener('keypress', resetActivity)
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current >= 30 * 60 * 1000) setSessionWarning(true)
    }, 60_000)
    return () => {
      window.removeEventListener('mousemove', resetActivity)
      window.removeEventListener('keypress', resetActivity)
      clearInterval(timer)
    }
  }, [session])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('language, onboarded, legal_form, author_rate, country')
      .eq('id', userId)
      .single()
    setLanguage(data?.language || 'bg')
    setOnboarded(data?.onboarded ?? false)
    setCountry(data?.country || null)
    setLegalForm(data?.legal_form || null)
    setAuthorRate(data?.author_rate ?? false)
    // Existing users without a country skip the country step (default to bg behaviour)
    setNeedsCountry(data?.onboarded === true && !data?.country)
    setNeedsLegalForm(data?.onboarded === true && !data?.legal_form)
    setLoading(false)
  }

  async function handleLanguageSet(lang) {
    setLanguage(lang)
    navigate('/country')
  }

  async function handleCountrySet(countryId) {
    setCountry(countryId)
    setNeedsCountry(false)
    navigate('/legal-form')
  }

  async function handleLegalFormComplete(legalFormValue) {
    setOnboarded(true)
    setLegalForm(legalFormValue || legalForm)
    setNeedsLegalForm(false)
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0e0e0c' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #222', borderTop: '2px solid #c8f03a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Effective country: use stored country, or default to 'bg' for existing users with no country
  const effectiveCountry = country || 'bg'

  return (
    <>
    {sessionWarning && (
      <div style={{
        position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
        background: '#161614', border: '1px solid rgba(240,237,228,0.15)',
        borderRadius: 12, padding: '12px 20px', fontSize: 13, color: 'rgba(240,237,228,0.85)',
        zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap',
      }}>
        Your session will expire soon
        <button
          onClick={() => setSessionWarning(false)}
          style={{ background: 'none', border: 'none', color: 'rgba(240,237,228,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>
    )}
    <Routes>
      <Route path="/" element={
        session && onboarded ? <Navigate to="/dashboard" /> : <Landing />
      } />
      <Route path="/auth" element={
        session && onboarded ? <Navigate to="/dashboard" /> : <Auth />
      } />
      <Route path="/language" element={
        !session ? <Navigate to="/auth" /> :
        <LanguageSelect userId={session.user.id} onLanguageSet={handleLanguageSet} />
      } />
      <Route path="/country" element={
        !session ? <Navigate to="/auth" /> :
        <CountrySelect userId={session.user.id} onCountrySet={handleCountrySet} />
      } />
      <Route path="/legal-form" element={
        !session ? <Navigate to="/auth" /> :
        <LegalFormSelect
          userId={session.user.id}
          language={language || 'en'}
          countryId={effectiveCountry}
          onComplete={handleLegalFormComplete}
        />
      } />
      <Route path="/dashboard" element={
        !session ? <Navigate to="/auth" /> :
        !onboarded ? <Navigate to="/language" /> :
        needsLegalForm ? <Navigate to="/legal-form" /> :
        <Dashboard
          session={session}
          language={language}
          countryId={effectiveCountry}
          legalForm={legalForm}
          authorRate={authorRate}
          onAuthorRateChange={setAuthorRate}
          onLanguageChange={setLanguage}
        />
      } />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/profile" element={
        !session ? <Navigate to="/auth" /> :
        !onboarded ? <Navigate to="/language" /> :
        <Profile session={session} language={language} onLanguageChange={setLanguage} />
      } />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/invoice/new" element={
        !session ? <Navigate to="/auth" /> :
        !onboarded ? <Navigate to="/language" /> :
        <NewInvoice session={session} language={language} onLanguageChange={setLanguage} />
      } />
      <Route path="/income" element={
        !session ? <Navigate to="/auth" /> :
        !onboarded ? <Navigate to="/language" /> :
        <IncomeList session={session} language={language || 'en'} />
      } />
      <Route path="/expenses" element={
        !session ? <Navigate to="/auth" /> :
        !onboarded ? <Navigate to="/language" /> :
        <ExpenseList session={session} language={language || 'en'} />
      } />
      <Route path="/invoices" element={
        !session ? <Navigate to="/auth" /> :
        !onboarded ? <Navigate to="/language" /> :
        <InvoiceList session={session} />
      } />
      <Route path="/blog" element={<Blog language={language || 'en'} />} />
      <Route path="/blog/:slug" element={<BlogPost language={language || 'en'} />} />
      <Route path="/how-to-pay" element={<HowToPay language={language || 'en'} />} />
      <Route path="/nap-sledene" element={<NapTracking />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}
