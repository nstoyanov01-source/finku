import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import LanguageSelect from './pages/LanguageSelect'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [language, setLanguage] = useState(null)
  const [onboarded, setOnboarded] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setLanguage(null); setOnboarded(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('language, onboarded')
      .eq('id', userId)
      .single()
    setLanguage(data?.language || 'en')
    setOnboarded(data?.onboarded ?? false)
    setLoading(false)
  }

  async function handleLanguageSet(lang) {
    setLanguage(lang)
    setOnboarded(true)
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #eae9e3', borderTop: '2px solid #1a1a1a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={
        !session ? <Auth /> :
        !onboarded ? <Navigate to="/language" /> :
        <Navigate to="/dashboard" />
      } />
      <Route path="/language" element={
        !session ? <Navigate to="/" /> :
        <LanguageSelect userId={session.user.id} onLanguageSet={handleLanguageSet} />
      } />
      <Route path="/dashboard" element={
        !session ? <Navigate to="/" /> :
        !onboarded ? <Navigate to="/language" /> :
        <Dashboard session={session} language={language} onLanguageChange={setLanguage} />
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
