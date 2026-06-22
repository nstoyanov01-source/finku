import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useLanguage } from './lib/LanguageContext'
import posthog from 'posthog-js'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import LanguageSelect from './pages/LanguageSelect'
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
  const [legalForm, setLegalForm] = useState(null)
  const [authorRate, setAuthorRate] = useState(false)
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
        setOnboarded(null); setLegalForm(null); setAuthorRate(false); setNeedsLegalForm(false); setLoading(false)
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
      .select('language, onboarded, legal_form, author_rate')
      .eq('id', userId)
      .single()
    setLanguage(data?.language || 'bg')
    setOnboarded(data?.onboarded ?? false)
    setLegalForm(data?.legal_form || null)
    setAuthorRate(data?.author_rate ?? false)
    setNeedsLegalForm(data?.onboarded === true && !data?.legal_form)
    setLoading(false)
  }

  async function handleLanguageSet(lang) {
    setLanguage(lang)
    navigate('/legal-form')
  }

  async function handleLegalFormComplete() {
    setOnboarded(true)
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
      <Route path="/legal-form" element={
        !session ? <Navigate to="/auth" /> :
        <LegalFormSelect userId={session.user.id} language={language || 'en'} onComplete={handleLegalFormComplete} />
      } />
      <Route path="/dashboard" element={
        !session ? <Navigate to="/auth" /> :
        !onboarded ? <Navigate to="/language" /> :
        needsLegalForm ? <Navigate to="/legal-form" /> :
        <Dashboard session={session} language={language} legalForm={legalForm} authorRate={authorRate} onAuthorRateChange={setAuthorRate} onLanguageChange={setLanguage} />
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
