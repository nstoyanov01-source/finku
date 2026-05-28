import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (data?.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, first_name: name.trim() })
      }
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
      `}</style>

      <div className="auth-page">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="auth-logo">Finku</div>
          <p className="auth-tagline">Your freelance finances, simplified.</p>

          <div className="auth-card">
            <h2>{mode === 'login' ? 'Log in to your account' : 'Create your account'}</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mode === 'signup' && (
                <div>
                  <label className="label">First name</label>
                  <input
                    className="input-field"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nikola"
                    required
                    autoComplete="given-name"
                  />
                </div>
              )}
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
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
