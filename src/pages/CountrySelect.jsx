import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ALL_COUNTRIES } from '../countries/index.js'
import { usePostHog } from '@posthog/react'

const FULL_TAX = ALL_COUNTRIES.filter(c => c.supportsFullTax)
const OTHER    = ALL_COUNTRIES.filter(c => !c.supportsFullTax)

export default function CountrySelect({ userId, onCountrySet }) {
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const posthog = usePostHog()

  const q = query.toLowerCase()
  function matches(c) {
    return c.name.toLowerCase().includes(q) || c.nameLocal.toLowerCase().includes(q) || c.id.includes(q)
  }

  const filteredFull  = FULL_TAX.filter(matches)
  const filteredOther = OTHER.filter(matches)

  async function handleContinue() {
    if (!selected) return
    setLoading(true)
    await supabase.from('profiles').update({ country: selected.id }).eq('id', userId)
    posthog?.capture('country_selected', { country: selected.id, full_tax: selected.supportsFullTax })
    onCountrySet(selected.id)
  }

  function CountryRow({ country }) {
    const isSelected = selected?.id === country.id
    return (
      <button
        onClick={() => setSelected(country)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
          background: isSelected ? 'rgba(200,240,58,0.07)' : '#161614',
          border: `1px solid ${isSelected ? '#c8f03a' : 'rgba(240,237,228,0.08)'}`,
          borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onMouseOver={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.2)'; e.currentTarget.style.background = '#1c1c1a' } }}
        onMouseOut={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.08)'; e.currentTarget.style.background = '#161614' } }}
      >
        <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{country.flag}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: isSelected ? '#c8f03a' : '#f0ede4', marginBottom: 1 }}>
            {country.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(240,237,228,0.35)' }}>
            {country.nameLocal}
            {country.supportsFullTax && (
              <span style={{
                marginLeft: 8, background: 'rgba(200,240,58,0.12)', color: '#c8f03a',
                border: '1px solid rgba(200,240,58,0.25)', borderRadius: 20,
                padding: '1px 7px', fontSize: 10, fontWeight: 500, verticalAlign: 'middle',
              }}>Full tax</span>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <>
      <style>{`
        .cs-page { min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; background: #0e0e0c; padding: 2rem 1rem 4rem; font-family: 'DM Sans', sans-serif; }
        .cs-wrap { width: 100%; max-width: 420px; }
        .cs-logo { font-family: 'Instrument Serif', serif; font-size: 32px; color: #f0ede4; letter-spacing: -0.5px; text-align: center; margin-bottom: 6px; }
        .cs-sub { font-size: 15px; color: rgba(240,237,228,0.45); text-align: center; margin-bottom: 1.5rem; }
        .cs-search { width: 100%; box-sizing: border-box; background: #161614; border: 1px solid rgba(240,237,228,0.12); border-radius: 10px; padding: 10px 14px; font-size: 14px; color: #f0ede4; font-family: 'DM Sans', sans-serif; outline: none; margin-bottom: 1.25rem; transition: border-color 0.15s; }
        .cs-search:focus { border-color: rgba(200,240,58,0.35); }
        .cs-search::placeholder { color: rgba(240,237,228,0.25); }
        .cs-section-label { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.7px; color: rgba(240,237,228,0.3); margin-bottom: 8px; }
        .cs-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.25rem; }
        .cs-other-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.25rem; }
        @media (max-width: 400px) { .cs-other-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="cs-page">
        <div className="cs-wrap">
          <div className="cs-logo">Finku</div>
          <p className="cs-sub">Where are you based?</p>

          <input
            className="cs-search"
            type="text"
            placeholder="Search country…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />

          {filteredFull.length > 0 && (
            <>
              <div className="cs-section-label">Full tax calculation</div>
              <div className="cs-grid">
                {filteredFull.map(c => <CountryRow key={c.id} country={c} />)}
              </div>
            </>
          )}

          {filteredOther.length > 0 && (
            <>
              <div className="cs-section-label">Income & expense tracking</div>
              <div className="cs-other-grid">
                {filteredOther.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                      background: selected?.id === c.id ? 'rgba(200,240,58,0.07)' : '#161614',
                      border: `1px solid ${selected?.id === c.id ? '#c8f03a' : 'rgba(240,237,228,0.08)'}`,
                      borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseOver={e => { if (selected?.id !== c.id) { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.2)'; e.currentTarget.style.background = '#1c1c1a' } }}
                    onMouseOut={e => { if (selected?.id !== c.id) { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.08)'; e.currentTarget.style.background = '#161614' } }}
                  >
                    <span style={{ fontSize: 20 }}>{c.flag}</span>
                    <span style={{ fontSize: 13, color: selected?.id === c.id ? '#c8f03a' : '#f0ede4', fontWeight: 500 }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {filteredFull.length === 0 && filteredOther.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(240,237,228,0.3)', fontSize: 14, padding: '2rem 0' }}>
              No country found for "{query}"
            </div>
          )}

          {selected && !selected.supportsFullTax && (
            <div style={{ background: 'rgba(200,240,58,0.06)', border: '1px solid rgba(200,240,58,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: '1rem', fontSize: 13, color: 'rgba(200,240,58,0.7)', lineHeight: 1.55 }}>
              {selected.flag} <strong style={{ color: '#c8f03a' }}>{selected.name}</strong> — income & expense tracking is available now. Full tax calculation is coming soon.
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleContinue}
            disabled={!selected || loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? '…' : 'Continue'}
          </button>

          <p style={{ fontSize: 11, color: 'rgba(240,237,228,0.2)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.55 }}>
            You can only change your country by contacting support.
          </p>
        </div>
      </div>
    </>
  )
}
