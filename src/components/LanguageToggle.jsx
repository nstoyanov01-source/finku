import { useLanguage } from '../lib/LanguageContext'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  const btn = (code, label) => ({
    padding: '4px 12px',
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 18,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.15s',
    background: language === code ? '#c8f03a' : 'transparent',
    color: language === code ? '#0e0e0c' : 'rgba(255,255,255,0.5)',
  })

  return (
    <div style={{
      display: 'flex',
      background: 'rgba(255,255,255,0.05)',
      border: '0.5px solid rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: 2,
      gap: 0,
    }}>
      <button style={btn('bg', 'БГ')} onClick={() => setLanguage('bg')}>БГ</button>
      <button style={btn('en', 'EN')} onClick={() => setLanguage('en')}>EN</button>
    </div>
  )
}
