import { useState, useCallback } from 'react'

let _id = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = ++_id
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return { toasts, showToast }
}

export default function Toast({ toasts }) {
  if (!toasts.length) return null
  return (
    <>
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
      <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#161614',
            border: '1px solid rgba(240,237,228,0.1)',
            borderLeft: `3px solid ${t.type === 'error' ? '#e07070' : '#c8f03a'}`,
            borderRadius: 10,
            padding: '10px 20px',
            color: '#f0ede4',
            fontSize: 14,
            fontFamily: 'DM Sans, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            animation: 'toast-in 0.2s ease forwards',
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </>
  )
}
