import { Component } from 'react'
import posthog from 'posthog-js'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    posthog.captureException(error)
  }

  render() {
    if (this.state.hasError) {
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
          <h1 style={{ fontSize: 24, fontWeight: 500, color: '#f0ede4', marginBottom: '0.75rem', letterSpacing: '-0.3px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(240,237,228,0.4)', marginBottom: '2rem', lineHeight: 1.6 }}>
            An unexpected error occurred. Please refresh the page.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#c8f03a', color: '#0e0e0c', border: 'none',
                fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
                padding: '11px 24px', borderRadius: 10, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => { window.location.href = '/' }}
              style={{
                background: 'none', border: '1px solid rgba(240,237,228,0.15)',
                color: 'rgba(240,237,228,0.6)',
                fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                padding: '11px 24px', borderRadius: 10, cursor: 'pointer',
              }}
            >
              Go home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
