import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LanguageSelect({ userId, onLanguageSet }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!selected) return
    setLoading(true)
    await supabase.from('profiles').update({ language: selected }).eq('id', userId)
    onLanguageSet(selected)
  }

  const options = [
    { code: 'en', label: 'English', sub: 'Continue in English' },
    { code: 'bg', label: 'Български', sub: 'Продължи на български' },
  ]

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f4f0', padding: '1rem',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', color: '#1a1a1a', fontFamily: "'DM Sans', sans-serif" }}>Finku</h1>
          <p style={{ fontSize: 15, color: '#888', marginTop: 8 }}>Choose your language / Изберете език</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
          {options.map(opt => (
            <button
              key={opt.code}
              onClick={() => setSelected(opt.code)}
              style={{
                background: selected === opt.code ? '#1a1a1a' : '#fff',
                color: selected === opt.code ? '#fff' : '#1a1a1a',
                border: selected === opt.code ? '2px solid #1a1a1a' : '2px solid #eae9e3',
                borderRadius: 14, padding: '1.1rem 1.5rem', textAlign: 'left',
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 16 }}>{opt.label}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{opt.sub}</div>
            </button>
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={handleContinue}
          disabled={!selected || loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? '…' : selected === 'bg' ? 'Продължи' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
