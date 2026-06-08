import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePostHog } from '@posthog/react'

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password. Please try again.'
  if (msg.includes('Email not confirmed')) return 'Please check your email and confirm your account first.'
  if (msg.includes('User already registered')) return 'An account with this email already exists. Try logging in instead.'
  if (msg.includes('Password should be at least 6 characters')) return 'Password must be at least 6 characters.'
  return 'Something went wrong. Please try again.'
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const posthog = usePostHog()

  useEffect(() => { document.title = 'Sign in · Finku' }, [])

  function switchMode(next) { setMode(next); setError(''); setResetSent(false); setSignupSuccess(false) }

  async function handleGoogleSignIn() {
    posthog?.capture('user_logged_in', { method: 'google' })
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://finku.eu/dashboard' },
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) setError(translateError(error.message))
      else setResetSent(true)
      setLoading(false)
      return
    }

    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(translateError(error.message))
      } else if (data?.user) {
        posthog?.identify(data.user.id, { email: data.user.email })
        posthog?.capture('user_logged_in', { method: 'email' })
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(translateError(error.message)); setLoading(false); return }
      posthog?.capture('user_signed_up', { method: 'email' })
      setSignupSuccess(true)
      setLoading(false)
      return
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0e0e0c;
          padding: 1rem;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-logo {
          font-family: 'Instrument Serif', serif;
          font-size: 32px;
          color: #f0ede4;
          letter-spacing: -0.5px;
          text-align: center;
          margin-bottom: 6px;
        }

        .auth-tagline {
          font-size: 14px;
          color: rgba(240,237,228,0.45);
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-card {
          background: #161614;
          border-radius: 16px;
          border: 1px solid rgba(240,237,228,0.08);
          padding: 1.75rem;
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
        }

        .auth-card h2 {
          font-size: 16px;
          font-weight: 500;
          color: #f0ede4;
          margin-bottom: 1.5rem;
        }

        .auth-error {
          background: rgba(224,112,112,0.1);
          border: 1px solid rgba(224,112,112,0.25);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #e07070;
        }

        .auth-success {
          background: rgba(200,240,58,0.07);
          border: 1px solid rgba(200,240,58,0.2);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13px;
          color: #c8f03a;
          line-height: 1.6;
        }

        .auth-switch {
          text-align: center;
          font-size: 13px;
          color: rgba(240,237,228,0.4);
          margin-top: 1.25rem;
        }

        .auth-switch-btn {
          background: none;
          border: none;
          color: #f0ede4;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          font-family: 'DM Sans', sans-serif;
        }
        .auth-switch-btn:hover { color: #c8f03a; }

        .auth-forgot {
          background: none;
          border: none;
          color: rgba(240,237,228,0.35);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          margin-top: 4px;
          display: block;
          text-align: right;
          width: 100%;
          transition: color 0.15s;
        }
        .auth-forgot:hover { color: rgba(240,237,228,0.7); }

        .google-btn {
          width: 100%;
          background: #161614;
          border: 1px solid rgba(240,237,228,0.15);
          border-radius: 10px;
          padding: 11px 16px;
          color: #f0ede4;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: border-color 0.15s, background 0.15s;
        }
        .google-btn:hover { border-color: rgba(240,237,228,0.3); background: rgba(240,237,228,0.04); }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 1rem 0;
        }
        .auth-divider-line { flex: 1; height: 1px; background: rgba(240,237,228,0.08); }
        .auth-divider-text { font-size: 12px; color: rgba(240,237,228,0.3); }
      `}</style>

      <div className="auth-page">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="auth-logo">Finku</div>
          <p className="auth-tagline">Your freelance finances, simplified.</p>

          <div className="auth-card">
            {mode === 'reset' ? (
              <>
                <h2>Reset your password</h2>
                {resetSent ? (
                  <>
                    <div className="auth-success">
                      Check your email — we've sent a password reset link to <strong>{email}</strong>.
                    </div>
                    <p className="auth-switch">
                      <button className="auth-switch-btn" onClick={() => switchMode('login')}>← Back to login</button>
                    </p>
                  </>
                ) : (
                  <>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label className="label">Email address</label>
                        <input
                          className="input-field"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          autoFocus
                          autoComplete="email"
                        />
                      </div>
                      {error && <div className="auth-error">{error}</div>}
                      <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                        {loading ? 'Sending…' : 'Send reset link'}
                      </button>
                    </form>
                    <p className="auth-switch">
                      <button className="auth-switch-btn" onClick={() => switchMode('login')}>← Back to login</button>
                    </p>
                  </>
                )}
              </>
            ) : signupSuccess ? (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: '#c8f03a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0e0e0c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 400, color: '#f0ede4', marginBottom: '0.75rem', letterSpacing: '-0.3px' }}>
                  Check your email
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(240,237,228,0.55)', lineHeight: 1.65, marginBottom: '0.6rem' }}>
                  We sent a confirmation link to <strong style={{ color: '#f0ede4' }}>{email}</strong>. Click it to activate your account.
                </p>
                <p style={{ fontSize: 12, color: 'rgba(240,237,228,0.3)', marginBottom: '1.5rem' }}>
                  Can't find it? Check your spam folder.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => switchMode('login')}
                  style={{ width: '100%', justifyContent: 'center', background: '#c8f03a', color: '#0e0e0c' }}
                >
                  ← Back to login
                </button>
              </div>
            ) : (
              <>
                <h2>{mode === 'login' ? 'Log in to your account' : 'Create your account'}</h2>

                <button type="button" className="google-btn" onClick={handleGoogleSignIn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-text">or</span>
                  <div className="auth-divider-line" />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="label">Email address</label>
                    <input
                      className="input-field"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input
                      className="input-field"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    {mode === 'login' && (
                      <button type="button" className="auth-forgot" onClick={() => switchMode('reset')}>
                        Forgot password?
                      </button>
                    )}
                  </div>

                  {error && <div className="auth-error">{error}</div>}

                  <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                    {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
                  </button>
                </form>

                <p className="auth-switch">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    className="auth-switch-btn"
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  >
                    {mode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
