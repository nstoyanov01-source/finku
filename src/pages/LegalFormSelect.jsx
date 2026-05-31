import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LegalFormSelect({ userId, language, onComplete }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const isBg = language === 'bg'

  async function handleContinue() {
    if (!selected) return
    setLoading(true)
    await supabase.from('profiles').update({ legal_form: selected, onboarded: true }).eq('id', userId)
    onComplete()
  }

  const options = [
    {
      value: 'svobodna_profesiya',
      label: 'Свободна професия',
      sub: isBg ? 'Фрийлансър, консултант, дизайнер, разработчик' : 'Freelancer, consultant, designer, developer',
    },
    {
      value: 'ET',
      label: 'ЕТ (Едноличен търговец)',
      sub: isBg ? 'Регистриран едноличен търговец' : 'Registered sole trader',
    },
    {
      value: 'just_tracking',
      label: isBg ? 'Само проследяване' : 'Just tracking',
      sub: isBg ? 'Искам само да проследявам приходи и разходи' : 'I just want to track income and expenses',
    },
  ]

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
      `}</style>

      <div className="lang-page">
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="lang-logo">Finku</div>
          <p className="lang-sub">{isBg ? 'Как работите?' : 'How do you work?'}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
            {options.map(opt => (
              <button
                key={opt.value}
                className={`lang-option${selected === opt.value ? ' selected' : ''}`}
                onClick={() => setSelected(opt.value)}
              >
                <div className="lang-option-label">{opt.label}</div>
                <div className="lang-option-sub">{opt.sub}</div>
              </button>
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={handleContinue}
            disabled={!selected || loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? '…' : isBg ? 'Продължи' : 'Continue'}
          </button>
        </div>
      </div>
    </>
  )
}
