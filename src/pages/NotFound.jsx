import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  useEffect(() => { document.title = 'Not Found · Finku' }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0e0e0c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      textAlign: 'center',
      fontFamily: 'DM Sans, sans-serif',
      padding: '2rem',
    }}>
      <div style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: 96,
        color: '#c8f03a',
        letterSpacing: -4,
        lineHeight: 1,
        marginBottom: '1.25rem',
      }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 500, color: '#f0ede4', marginBottom: '0.75rem', letterSpacing: '-0.3px' }}>
        Page not found
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(240,237,228,0.4)', marginBottom: '2rem', lineHeight: 1.6 }}>
        The page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#c8f03a', color: '#0e0e0c', border: 'none',
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
          padding: '11px 28px', borderRadius: 10, cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
      >
        Go home
      </button>
    </div>
  )
}
