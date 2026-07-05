import { useState } from 'react'
import { useLanguage } from '../lib/LanguageContext'
import { supabase } from '../lib/supabase'
import { usePostHog } from '@posthog/react'
import { getCountry } from '../countries/index.js'

export default function LegalFormSelect({ userId, countryId = 'bg', onComplete }) {
  const { language } = useLanguage()
  const [selected, setSelected] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isBg = language === 'bg'
  const posthog = usePostHog()

  const countryConfig = getCountry(countryId)
  const options = countryConfig.legalForms || []

  // Pick the display language: try the app language, fall back to 'en'
  function label(field) {
    return field?.[language] || field?.en || ''
  }

  async function handleContinue() {
    if (!selected) return
    if (firstName.trim().length > 100) {
      setError(isBg ? 'Името е прекалено дълго (макс. 100 символа).' : 'Name is too long (max 100 characters).')
      return
    }
    setError('')
    setLoading(true)
    await supabase
      .from('profiles')
      .update({ legal_form: selected, onboarded: true, first_name: firstName.trim() })
      .eq('id', userId)
    posthog?.capture('onboarding_completed', { legal_form: selected, country: countryId })
    onComplete(selected)
  }

  return (
    <>
      <style>{`
        .lang-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0e0e0c; padding: 1rem; font-family: 'DM Sans', sans-serif; }
        .lang-logo { font-family: 'Instrument Serif', serif; font-size: 32px; color: #f0ede4; letter-spacing: -0.5px; text-align: center; margin-bottom: 6px; }
        .lang-sub { font-size: 15px; color: rgba(240,237,228,0.45); text-align: center; margin-bottom: 2rem; }
        .lang-option { background: #161614; border: 1px solid rgba(240,237,228,0.08); border-radius: 14px; padding: 1.1rem 1.5rem; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; font-family: 'DM Sans', sans-serif; width: 100%; }
        .lang-option:hover { border-color: rgba(240,237,228,0.2); background: #1c1c1a; }
        .lang-option.selected { border-color: #c8f03a; background: rgba(200,240,58,0.06); }
        .lang-option-label { font-weight: 500; font-size: 15px; color: #f0ede4; }
        .lang-option-sub { font-size: 13px; color: rgba(240,237,228,0.45); margin-top: 2px; }
        .lang-option-desc { font-size: 12px; color: rgba(240,237,228,0.3); margin-top: 5px; line-height: 1.45; }
      `}</style>

      <div className="lang-page">
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="lang-logo">Finku</div>
          <p className="lang-sub">
            {countryConfig.flag} {isBg ? 'Как работите?' : 'How do you work?'}
          </p>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(240,237,228,0.45)', marginBottom: 6 }}>
              {isBg ? 'Вашето име' : 'Your first name'}
            </label>
            <input
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#161614', border: '1px solid rgba(240,237,228,0.12)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 14, color: '#f0ede4', fontFamily: 'DM Sans, sans-serif',
                outline: 'none', transition: 'border-color 0.15s',
              }}
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder={isBg ? 'Иван' : 'Alex'}
              maxLength={100}
              autoComplete="given-name"
              autoFocus
              onFocus={e => { e.target.style.borderColor = 'rgba(200,240,58,0.35)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(240,237,228,0.12)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
            {options.map(opt => (
              <button
                key={opt.value}
                className={`lang-option${selected === opt.value ? ' selected' : ''}`}
                onClick={() => setSelected(opt.value)}
              >
                <div className="lang-option-label">{label(opt.label)}</div>
                <div className="lang-option-sub">{label(opt.sub)}</div>
                <div className="lang-option-desc">{label(opt.desc)}</div>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#e07070', background: 'rgba(224,112,112,0.1)', border: '1px solid rgba(224,112,112,0.2)', padding: '8px 12px', borderRadius: 8, marginBottom: '0.75rem' }}>
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleContinue}
            disabled={!selected || loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? '…' : isBg ? 'Продължи' : 'Continue'}
          </button>

          <p style={{ fontSize: 12, color: 'rgba(240,237,228,0.25)', textAlign: 'center', marginTop: '1.25rem' }}>
            {isBg ? 'Не си сигурен? Най-вероятно си Свободна професия.' : "Not sure? Pick the first option."}
          </p>
        </div>
      </div>
    </>
  )
}
