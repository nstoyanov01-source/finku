import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function UpdatePassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => { document.title = 'Reset Password · Finku' }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    navigate('/dashboard')
  }

  const spinnerStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0e0e0c',
  }

  if (checking) {
    return (
      <div style={spinnerStyle}>
        <div style={{ width: 28, height: 28, border: '2px solid #222', borderTop: '2px solid #c8f03a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0e0e0c; padding: 1rem; font-family: 'DM Sans', sans-serif; }
        .auth-logo { font-family: 'Instrument Serif', serif; font-size: 32px; color: #f0ede4; letter-spacing: -0.5px; text-align: center; margin-bottom: 6px; }
        .auth-tagline { font-size: 14px; color: rgba(240,237,228,0.45); text-align: center; margin-bottom: 2rem; }
        .auth-card { background: #161614; border-radius: 16px; border: 1px solid rgba(240,237,228,0.08); padding: 1.75rem; box-shadow: 0 24px 60px rgba(0,0,0,0.4); }
        .auth-card h2 { font-size: 16px; font-weight: 500; color: #f0ede4; margin-bottom: 1.5rem; }
        .auth-error { background: rgba(224,112,112,0.1); border: 1px solid rgba(224,112,112,0.25); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #e07070; }
        .auth-switch { text-align: center; font-size: 13px; color: rgba(240,237,228,0.4); margin-top: 1.25rem; }
        .auth-switch-btn { background: none; border: none; color: #f0ede4; font-weight: 500; font-size: 13px; cursor: pointer; padding: 0; font-family: 'DM Sans', sans-serif; }
        .auth-switch-btn:hover { color: #c8f03a; }
      `}</style>

      <div className="auth-page">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="auth-logo">Finku</div>
          <p className="auth-tagline">Set your new password</p>

          <div className="auth-card">
            {!hasSession ? (
              <>
                <h2>Invalid or expired link</h2>
                <p style={{ fontSize: 14, color: 'rgba(240,237,228,0.5)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  This password reset link is no longer valid. Please request a new one.
                </p>
                <p className="auth-switch">
                  <button className="auth-switch-btn" onClick={() => navigate('/auth')}>Back to login</button>
                </p>
              </>
            ) : (
              <>
                <h2>Choose a new password</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="label">New password</label>
                    <input
                      className="input-field"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoFocus
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="label">Confirm password</label>
                    <input
                      className="input-field"
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  {error && <div className="auth-error">{error}</div>}
                  <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                    {loading ? 'Updating…' : 'Set new password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
