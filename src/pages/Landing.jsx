import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const faqs = [
  {
    q: 'Is Finku really free?',
    a: "Yes — completely free during beta. No credit card, no hidden trial. We'll give plenty of notice before anything changes.",
  },
  {
    q: 'How is the tax estimate calculated?',
    a: "Based on Bulgarian tax law for self-employed individuals: 75% of your gross income is taxable, then 15% income tax applies, plus fixed monthly insurance contributions. It's an estimate — always consult an accountant for your official declaration.",
  },
  {
    q: 'Is my financial data safe?',
    a: 'Your data is stored encrypted in EU-based servers (Ireland). Nobody else can access your entries — not even us. You can delete your account and all data at any time.',
  },
  {
    q: 'Is this for VAT-registered businesses?',
    a: 'Not yet. Finku is currently built for the self-employed who are not VAT registered. VAT tracking is on the roadmap.',
  },
]

function fmt(n) {
  return Math.round(n).toLocaleString('en-US')
}

function calcEstimate(totalEarned, legalForm) {
  const currentMonth = new Date().getMonth() + 1
  const insurance = Math.round(153 * currentMonth)
  if (legalForm === 'tracking') {
    const projected = Math.round((totalEarned / Math.max(currentMonth, 1)) * 12)
    return { earned: Math.round(totalEarned), taxable: 0, incomeTax: 0, insurance: 0, total: 0, projected }
  }
  const taxable = legalForm === 'ET' ? totalEarned : totalEarned * 0.75
  const incomeTax = Math.round(taxable * 0.15)
  return { earned: Math.round(totalEarned), taxable: Math.round(taxable), incomeTax, insurance, total: incomeTax + insurance }
}

export default function Landing({ language = 'en' }) {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [returning, setReturning] = useState(false)
  const [calcIncome, setCalcIncome] = useState('')
  const [calcForm, setCalcForm] = useState('svobodna')

  const currentMonth = new Date().getMonth() + 1
  const earned = parseFloat(calcIncome) || 0
  const res = calcEstimate(earned, calcForm)

  const lx = language === 'bg' ? {
    calcTitle: 'Колко дължиш?',
    calcSub: 'Въведи приходите си за тази година — виж прогнозата мигновено. Без регистрация.',
    placeholder: 'Приход досега в 2026 (€)',
    inputHelper: 'Общият ти приход от началото на годината',
    earned: 'Приход досега',
    taxable: 'Облагаем доход',
    incomeTax: 'Данък (15%)',
    insurance: 'Осигуровки',
    totalOwed: 'Общо задължение досега',
    projected: 'Прогноза за годината',
    ctaCalc: 'Проследи автоматично, безплатно →',
    forms: { svobodna: 'Свободна професия', ET: 'ЕТ', tracking: 'Само проследяване' },
    taxmanTitle: 'Знай колко дължиш',
    withoutFinku: 'Без Finku',
    withFinku: 'С Finku',
    withoutLines: ['Изненадващи сметки накрая', 'Никаква представа предварително', 'Паника всеки април'],
    withLines: ['Жива прогноза за данъци', 'Приходи и разходи проследени', 'Без изненади в края на годината'],
  } : {
    calcTitle: 'How much do you owe?',
    calcSub: 'Enter your income so far this year — see your estimate instantly. No signup needed.',
    placeholder: 'Earned so far in 2026 (€)',
    inputHelper: 'Your total income this year to date',
    earned: 'Your income so far',
    taxable: 'Taxable income',
    incomeTax: 'Income tax (15%)',
    insurance: 'Insurance',
    totalOwed: 'Total owed so far',
    projected: 'Projected annual income',
    ctaCalc: 'Track this automatically, free →',
    forms: { svobodna: 'Freelancer', ET: 'Sole trader', tracking: 'Just tracking' },
    taxmanTitle: 'Finally know what you owe',
    withoutFinku: 'Without Finku',
    withFinku: 'With Finku',
    withoutLines: ["Surprise bills at year-end", "No idea what's coming", "Panic every April"],
    withLines: ['Live tax estimate, always', 'Income & expenses tracked', 'No surprises at year-end'],
  }

  const taxAuth = language === 'bg' ? 'НАП' : 'NRA'
  const heroLang = localStorage.getItem('finku_lang') === 'en' ? 'en' : 'bg'

  useEffect(() => { document.title = 'Finku — Know what you owe, always' }, [])

  useEffect(() => {
    const initOneTap = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { navigate('/dashboard'); return }

      if (localStorage.getItem('finku_visited')) setReturning(true)
      localStorage.setItem('finku_visited', 'true')

      const generateNonce = async () => {
        const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
        const encoder = new TextEncoder()
        const encodedNonce = encoder.encode(nonce)
        const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashedNonce = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        return [nonce, hashedNonce]
      }

      const [nonce, hashedNonce] = await generateNonce()

      const initGoogle = () => {
        window.google?.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response) => {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            })
            if (!error && data.session) navigate('/dashboard')
          },
          nonce: hashedNonce,
          use_fedcm_for_prompt: true,
        })
        window.google?.accounts.id.prompt()
      }

      if (window.google) {
        initGoogle()
      } else {
        window.addEventListener('load', initGoogle)
      }
    }

    initOneTap()
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0e0e0c; }
        .landing { font-family: 'DM Sans', sans-serif; background: #0e0e0c; color: #f0ede4; min-height: 100vh; overflow-x: hidden; }
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity: 1; transform: none; }

        nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem 4rem; position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: rgba(14,14,12,0.85); backdrop-filter: blur(12px);
          border-bottom: 0.5px solid rgba(240,237,228,0.08);
        }
        .nav-logo { font-family: 'Instrument Serif', serif; font-size: 22px; color: #f0ede4; letter-spacing: -0.3px; }
        .nav-right { display: flex; gap: 12px; align-items: center; }
        .btn-ghost { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; padding: 8px 16px; border-radius: 8px; transition: color 0.2s; }
        .btn-ghost:hover { color: #f0ede4; }
        .btn-cta { background: #c8f03a; color: #0e0e0c; border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; padding: 9px 20px; border-radius: 8px; transition: opacity 0.2s, transform 0.15s; }
        .btn-cta:hover { opacity: 0.9; transform: translateY(-1px); }

        /* HERO */
        .hero { min-height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; padding: 80px 48px; padding-top: 144px; position: relative; }
        .hero-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; width: 100%; max-width: 1100px; }
        .hero-glow {
          position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%);
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(200,240,58,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-title { font-family: 'Instrument Serif', serif; font-size: 64px; line-height: 1.05; letter-spacing: -1.5px; color: #f0ede4; max-width: 540px; margin-bottom: 1.75rem; }
        .hero-title em { font-style: italic; color: #c8f03a; }
        .btn-primary-lg { background: #c8f03a; color: #0e0e0c; border: none; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; padding: 16px 32px; border-radius: 10px; transition: opacity 0.2s, transform 0.15s; }
        .btn-primary-lg:hover { opacity: 0.9; transform: translateY(-1px); }
        .hero-right { display: flex; flex-direction: column; gap: 10px; filter: drop-shadow(0 0 40px rgba(200,240,58,0.08)); }

        /* CALC SECTION */
        .calc-section { padding: 4rem 2rem; max-width: 760px; margin: 0 auto; }
        .calc-card { background: #161614; border: 1px solid rgba(240,237,228,0.08); border-radius: 16px; padding: 2.5rem; }
        .calc-title { font-family: 'Instrument Serif', serif; font-size: clamp(26px, 3.5vw, 38px); letter-spacing: -0.5px; color: #f0ede4; margin-bottom: 0.5rem; }
        .calc-sub { font-size: 14px; color: rgba(240,237,228,0.45); margin-bottom: 1.75rem; line-height: 1.6; }
        .calc-input { width: 100%; background: rgba(240,237,228,0.05); border: 1px solid rgba(240,237,228,0.12); border-radius: 10px; padding: 12px 16px; font-size: 18px; font-family: 'DM Sans', sans-serif; color: #f0ede4; outline: none; margin-bottom: 1rem; transition: border-color 0.15s; }
        .calc-input:focus { border-color: rgba(200,240,58,0.4); }
        .calc-input::placeholder { color: rgba(240,237,228,0.25); }
        .calc-toggles { display: flex; gap: 8px; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .calc-toggle { background: rgba(240,237,228,0.05); border: 1px solid rgba(240,237,228,0.12); color: rgba(240,237,228,0.55); font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 7px 14px; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
        .calc-toggle.active { background: rgba(200,240,58,0.1); border-color: rgba(200,240,58,0.35); color: #c8f03a; }
        .calc-results { border-top: 0.5px solid rgba(240,237,228,0.08); padding-top: 1.25rem; }
        .calc-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px; }
        .calc-row-label { color: rgba(240,237,228,0.5); }
        .calc-row-val { color: #f0ede4; font-weight: 500; }
        .calc-total-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0 10px; border-top: 0.5px solid rgba(240,237,228,0.08); margin-top: 4px; }
        .calc-total-label { font-size: 15px; font-weight: 500; color: rgba(240,237,228,0.8); }
        .calc-total-val { font-size: 28px; font-weight: 600; color: #c8f03a; }

        /* FEATURES */
        .features { padding: 6rem 2rem; max-width: 1000px; margin: 0 auto; }
        .section-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(240,237,228,0.3); margin-bottom: 1rem; }
        .section-title { font-family: 'Instrument Serif', serif; font-size: clamp(32px, 4vw, 48px); letter-spacing: -0.5px; line-height: 1.1; color: #f0ede4; max-width: 560px; margin-bottom: 3.5rem; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5px; background: rgba(240,237,228,0.08); border-radius: 16px; overflow: hidden; }
        .feature-card { background: #0e0e0c; padding: 2rem; position: relative; transition: background 0.2s; }
        .feature-card:hover { background: #161614; }
        .feature-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; font-size: 18px; }
        .icon-green { background: rgba(126,201,95,0.12); color: #7ec95f; }
        .icon-amber { background: rgba(200,240,58,0.12); color: #c8f03a; }
        .feature-title { font-size: 15px; font-weight: 500; color: #f0ede4; margin-bottom: 8px; }
        .feature-desc { font-size: 14px; color: rgba(240,237,228,0.45); line-height: 1.6; }

        /* SOCIAL PROOF */
        .social-proof { padding: 4rem 2rem; text-align: center; border-top: 0.5px solid rgba(240,237,228,0.06); }
        .proof-number { font-family: 'Instrument Serif', serif; font-size: 64px; color: #c8f03a; letter-spacing: -2px; }
        .proof-label { font-size: 15px; color: rgba(240,237,228,0.45); margin-top: 6px; }
        .proof-grid { display: flex; justify-content: center; gap: 4rem; flex-wrap: wrap; margin-top: 2rem; }

        /* HOW */
        .how-section { padding: 5rem 2rem; max-width: 1000px; margin: 0 auto; }
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem; margin-top: 3.5rem; }
        .how-number { font-family: 'Instrument Serif', serif; font-size: 52px; color: #c8f03a; opacity: 0.55; line-height: 1; margin-bottom: 1rem; letter-spacing: -1px; }
        .how-title { font-size: 16px; font-weight: 500; color: #f0ede4; margin-bottom: 8px; }
        .how-desc { font-size: 14px; color: rgba(240,237,228,0.5); line-height: 1.65; }

        /* FAQ */
        .faq-section { padding: 4rem 2rem 5rem; max-width: 720px; margin: 0 auto; }
        .faq-list { margin-top: 3rem; border: 1px solid rgba(240,237,228,0.08); border-radius: 14px; overflow: hidden; }
        .faq-item { border-bottom: 0.5px solid rgba(240,237,228,0.07); }
        .faq-item:last-child { border-bottom: none; }
        .faq-question { width: 100%; background: #161614; border: none; text-align: left; padding: 1.25rem 1.5rem; color: #f0ede4; font-size: 15px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 1rem; transition: background 0.15s; }
        .faq-question:hover { background: #1a1a18; }
        .faq-chevron { font-size: 18px; color: rgba(240,237,228,0.3); transition: transform 0.2s; flex-shrink: 0; line-height: 1; }
        .faq-chevron.open { transform: rotate(180deg); color: #c8f03a; }
        .faq-answer { background: #161614; padding: 0 1.5rem 1.25rem; font-size: 14px; color: rgba(240,237,228,0.5); line-height: 1.75; }

        /* TAXMAN SECTION */
        @keyframes chase {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(-16px); }
        }
        @keyframes panic {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes sweatDrop {
          0%, 100% { opacity: 0; transform: translateY(0px); }
          40% { opacity: 1; }
          80% { opacity: 0; transform: translateY(8px); }
        }
        @keyframes floatCalm {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseCheck {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        .taxman-section { padding: 5rem 2rem; max-width: 1000px; margin: 0 auto; }
        .taxman-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 3rem; }
        .taxman-panel { background: #0e0e0c; border: 0.5px solid rgba(240,237,228,0.1); border-radius: 16px; padding: 2rem; position: relative; overflow: hidden; }
        .taxman-panel-title { font-size: 15px; font-weight: 500; color: rgba(240,237,228,0.6); margin-bottom: 1.25rem; }
        .taxman-svg-area { height: 140px; margin-bottom: 1.25rem; }
        .taxman-lines { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1rem; }
        .taxman-line { font-size: 13px; color: rgba(240,237,228,0.35); }
        .taxman-line-bright { font-size: 13px; color: rgba(240,237,228,0.65); }
        .taxman-accent-red { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #e07070, #c0392b); }
        .taxman-accent-green { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #c8f03a, #7ec95f); }

        /* CTA */
        .cta-section { padding: 6rem 2rem; text-align: center; border-top: 0.5px solid rgba(240,237,228,0.08); }
        .cta-title { font-family: 'Instrument Serif', serif; font-size: clamp(36px, 5vw, 56px); letter-spacing: -1px; color: #f0ede4; margin-bottom: 1rem; }
        .cta-sub { font-size: 16px; color: rgba(240,237,228,0.45); margin-bottom: 2rem; }

        footer { padding: 2rem 4rem; border-top: 0.5px solid rgba(240,237,228,0.06); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .footer-logo { font-family: 'Instrument Serif', serif; font-size: 18px; color: rgba(240,237,228,0.4); }
        .footer-note { font-size: 13px; color: rgba(240,237,228,0.2); }
        .footer-links { display: flex; gap: 1.25rem; }
        .footer-link { font-size: 13px; color: rgba(240,237,228,0.45); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: rgba(240,237,228,0.75); }

        /* RESPONSIVE */
        @media (max-width: 700px) {
          nav { padding: 1.25rem 1.5rem; }
          .how-grid { grid-template-columns: 1fr; gap: 2rem; }
          footer { padding: 1.5rem; }
          .features-grid { grid-template-columns: 1fr !important; }
          .taxman-panels { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .hero { min-height: auto; padding: 100px 20px 40px; }
          .hero-inner { grid-template-columns: 1fr; }
          .hero-title { font-size: 38px; }
          .hero-right { margin-top: 2rem; }
        }
        @media (max-width: 640px) {
          nav .nav-right .btn-ghost { display: none; }
          .calc-card { padding: 1.5rem; }
        }
      `}</style>

      <div className="landing">
        <nav>
          <div className="nav-logo">Finku</div>
          <div className="nav-right">
            <button className="btn-ghost" onClick={() => navigate('/auth')}>Log in</button>
            <button className="btn-cta" onClick={() => navigate('/auth?mode=signup')}>Create free account</button>
          </div>
        </nav>

        {/* Hero — two columns */}
        <section className="hero" ref={heroRef}>
          <div className="hero-glow" />
          <div className="hero-inner">
            <div className="hero-left">
              <h1 className="hero-title reveal">
                {heroLang === 'bg' ? (
                  <>
                    НАП знае колко си спечелил.<br />
                    Ти — не.<br />
                    <em>Поправи това.</em>
                  </>
                ) : (
                  <>
                    НАП knows what you earned.<br />
                    You don't.<br />
                    <em>Fix that.</em>
                  </>
                )}
              </h1>
              <div className="reveal" style={{ transitionDelay: '0.15s' }}>
                <button className="btn-primary-lg" onClick={() => navigate('/auth?mode=signup')}>
                  {heroLang === 'bg' ? 'Виж колко дължиш →' : 'See what you owe →'}
                </button>
              </div>
              <div className="reveal" style={{ transitionDelay: '0.2s', marginTop: 14, fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px' }}>
                {heroLang === 'bg' ? 'FREE · БЕЗ КАРТА · 30 СЕКУНДИ' : 'FREE · NO CARD · 30 SECONDS'}
              </div>
            </div>

            {/* Live dashboard preview */}
            <div className="hero-right reveal" style={{ transitionDelay: '0.2s' }}>
              {/* Tax card */}
              <div style={{ background: '#c8f03a', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', fontWeight: 600, letterSpacing: '0.8px', marginBottom: 8 }}>
                  {heroLang === 'bg' ? 'ДАНЪК ВЪРХУ ДОХОДА · Q2' : 'INCOME TAX · Q2'}
                </div>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#0e0e0c', lineHeight: 1, marginBottom: 10 }}>~321 €</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: 100, padding: '4px 12px', fontSize: 12, color: '#0e0e0c' }}>
                    {heroLang === 'bg' ? 'До 31 юли · 51 дни' : 'By July 31 · 51 days'}
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>
                    {heroLang === 'bg' ? 'Как да платя?' : 'How to pay?'}
                  </span>
                </div>
              </div>

              {/* Insurance card */}
              <div style={{
                background: '#161614', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.8px', marginBottom: 4 }}>
                    {heroLang === 'bg' ? 'ОСИГУРОВКИ' : 'INSURANCE'}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 500, color: '#f0ede4', lineHeight: 1.15, marginBottom: 3 }}>153 €</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                    {heroLang === 'bg' ? 'Фиксирано · Всеки месец' : 'Fixed · Every month'}
                  </div>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.15)', border: '0.5px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {heroLang === 'bg' ? 'До 25 юни' : 'By June 25'}
                </div>
              </div>

              {/* Recent income card */}
              <div style={{ background: '#161614', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.8px', marginBottom: 10 }}>
                  {heroLang === 'bg' ? 'ПОСЛЕДНИ ПРИХОДИ' : 'RECENT INCOME'}
                </div>
                {(heroLang === 'bg' ? [
                  { name: 'Уеб дизайн — TechCo', amount: '+2,400 €' },
                  { name: 'Лого — StartupBG', amount: '+800 €' },
                  { name: 'Консултация — RetailMax', amount: '+1,200 €' },
                ] : [
                  { name: 'Web design — TechCo', amount: '+2,400 €' },
                  { name: 'Logo — StartupBG', amount: '+800 €' },
                  { name: 'Consulting — RetailMax', amount: '+1,200 €' },
                ]).map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{row.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#c8f03a' }}>{row.amount}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{
                  flex: 1, background: '#c8f03a', color: '#0e0e0c', border: 'none',
                  borderRadius: 8, padding: 12, fontSize: 12, fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif', cursor: 'default',
                }}>
                  {heroLang === 'bg' ? '+ Добави приход' : '+ Add income'}
                </button>
                <button style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
                  border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, fontSize: 12,
                  fontFamily: 'DM Sans, sans-serif', cursor: 'default',
                }}>
                  {heroLang === 'bg' ? '+ Добави разход' : '+ Add expense'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Tax Calculator */}
        <section className="calc-section reveal">
          <div className="calc-card">
            <h2 className="calc-title">{lx.calcTitle}</h2>
            <p className="calc-sub">{lx.calcSub}</p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(240,237,228,0.6)', marginBottom: '0.4rem' }}>
              {lx.placeholder}
            </label>
            <input
              className="calc-input"
              type="number"
              min="0"
              placeholder="0"
              value={calcIncome}
              onChange={e => setCalcIncome(e.target.value)}
            />
            <div style={{ fontSize: 12, color: 'rgba(240,237,228,0.3)', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
              {lx.inputHelper}
            </div>
            <div className="calc-toggles">
              {[
                { key: 'svobodna', label: lx.forms.svobodna },
                { key: 'ET', label: lx.forms.ET },
                { key: 'tracking', label: lx.forms.tracking },
              ].map(f => (
                <button
                  key={f.key}
                  className={`calc-toggle${calcForm === f.key ? ' active' : ''}`}
                  onClick={() => setCalcForm(f.key)}
                >{f.label}</button>
              ))}
            </div>

            {earned > 0 && (
              <div className="calc-results">
                {calcForm === 'tracking' ? (
                  <>
                    <div className="calc-row">
                      <span className="calc-row-label">{lx.earned}</span>
                      <span className="calc-row-val">{fmt(res.earned)} €</span>
                    </div>
                    <div className="calc-total-row">
                      <span className="calc-total-label">{lx.projected}</span>
                      <span className="calc-total-val">{fmt(res.projected)} €</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="calc-row">
                      <span className="calc-row-label">{lx.earned}</span>
                      <span className="calc-row-val">{fmt(res.earned)} €</span>
                    </div>
                    <div className="calc-row">
                      <span className="calc-row-label">{lx.taxable}</span>
                      <span className="calc-row-val">{fmt(res.taxable)} €</span>
                    </div>
                    <div className="calc-row">
                      <span className="calc-row-label">{lx.incomeTax}</span>
                      <span className="calc-row-val">{fmt(res.incomeTax)} €</span>
                    </div>
                    <div className="calc-row">
                      <span className="calc-row-label">{lx.insurance}</span>
                      <span className="calc-row-val">~{fmt(res.insurance)} €</span>
                    </div>
                    <div className="calc-total-row">
                      <span className="calc-total-label">{lx.totalOwed}</span>
                      <span className="calc-total-val">~{fmt(res.total)} €</span>
                    </div>
                  </>
                )}
                <button
                  className="btn-primary-lg"
                  onClick={() => navigate('/auth?mode=signup')}
                  style={{ marginTop: '1rem', width: '100%' }}
                >{lx.ctaCalc}</button>
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <p className="section-label reveal">What Finku does</p>
          <h2 className="section-title reveal" style={{ transitionDelay: '0.1s' }}>
            Everything you actually need
          </h2>
          <div className="features-grid">
            {[
              {
                icon: '↑↓', iconClass: 'icon-green',
                title: 'Income & expense tracking',
                desc: 'Log payments and business expenses as they happen. Add a client, amount, and date — or import directly from your Revolut CSV.',
              },
              {
                icon: '€', iconClass: 'icon-amber',
                title: 'Live tax estimate',
                desc: 'Based on your actual income, Finku calculates your income tax and insurance contributions in real time. No surprises.',
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                ), iconClass: 'icon-amber',
                title: 'Invoice generator',
                desc: 'Create professional EUR invoices to send to your clients in seconds. Auto-numbered, downloadable as PDF, income tracked automatically.',
              },
            ].map((f, i) => (
              <div key={i} className="feature-card reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
                <div className={`feature-icon ${f.iconClass}`}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap', marginTop: '1.25rem', paddingLeft: 2 }}>
            {['✓ Revolut CSV import', '✓ English & Bulgarian', '✓ EU data storage'].map(item => (
              <span key={item} style={{ fontSize: 13, color: 'rgba(240,237,228,0.35)' }}>{item}</span>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="social-proof reveal">
          <div className="proof-grid">
            <div>
              <div className="proof-number">€0</div>
              <div className="proof-label">to get started</div>
            </div>
            <div>
              <div className="proof-number">30s</div>
              <div className="proof-label">to set up</div>
            </div>
            <div>
              <div className="proof-number">5 min</div>
              <div className="proof-label">of tracking per month, that's it</div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="how-section">
          <p className="section-label reveal">How it works</p>
          <h2 className="section-title reveal" style={{ transitionDelay: '0.1s' }}>
            Up and running in three steps
          </h2>
          <div className="how-grid">
            {[
              { n: '01', title: 'Sign up free', desc: 'Create your account in 30 seconds. No credit card, no setup fees, no catch.' },
              { n: '02', title: 'Log your income', desc: 'Add payments as they come in, or import directly from a Revolut CSV export. Takes seconds per entry.' },
              { n: '03', title: 'See what you owe', desc: 'Your live tax estimate updates automatically as you go. Check it anytime — no year-end surprises.' },
            ].map((s, i) => (
              <div key={i} className="how-step reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="how-number">{s.n}</div>
                <div className="how-title">{s.title}</div>
                <div className="how-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section">
          <p className="section-label reveal">FAQ</p>
          <h2 className="section-title reveal" style={{ transitionDelay: '0.1s' }}>Common questions</h2>
          <div className="faq-list reveal" style={{ transitionDelay: '0.15s' }}>
            {faqs.map((item, i) => (
              <div key={i} className="faq-item">
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {item.q}
                  <span className={`faq-chevron${openFaq === i ? ' open' : ''}`}>›</span>
                </button>
                {openFaq === i && <div className="faq-answer">{item.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Taxman Animation */}
        <section className="taxman-section">
          <p className="section-label reveal">Why it matters</p>
          <h2 className="section-title reveal" style={{ transitionDelay: '0.1s' }}>{lx.taxmanTitle}</h2>
          <div className="taxman-panels reveal" style={{ transitionDelay: '0.15s' }}>

            {/* Left: Without Finku */}
            <div className="taxman-panel">
              <div className="taxman-panel-title">{lx.withoutFinku}</div>
              <div className="taxman-svg-area">
                <svg viewBox="0 0 260 130" style={{ width: '100%', height: '100%' }} aria-hidden="true">
                  {/* Panicking freelancer */}
                  <g style={{ animation: 'panic 0.7s ease-in-out infinite' }}>
                    <rect x="62" y="56" width="24" height="36" fill="#f0ede4" rx="3"/>
                    <circle cx="74" cy="47" r="13" fill="#f0ede4"/>
                    <circle cx="69" cy="44" r="2.5" fill="#0e0e0c"/>
                    <circle cx="79" cy="44" r="2.5" fill="#0e0e0c"/>
                    <ellipse cx="74" cy="52" rx="4" ry="3.5" fill="#555"/>
                    <line x1="62" y1="65" x2="48" y2="54" stroke="#f0ede4" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="86" y1="65" x2="100" y2="54" stroke="#f0ede4" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="69" y1="92" x2="62" y2="110" stroke="#f0ede4" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="79" y1="92" x2="86" y2="110" stroke="#f0ede4" strokeWidth="3" strokeLinecap="round"/>
                  </g>
                  {/* Sweat drops */}
                  <circle cx="96" cy="38" r="3" fill="#6eb5ff" style={{ animation: 'sweatDrop 1.3s ease-in-out infinite' }}/>
                  <circle cx="103" cy="50" r="2" fill="#6eb5ff" style={{ animation: 'sweatDrop 1.3s ease-in-out infinite 0.45s' }}/>

                  {/* Taxman chasing */}
                  <g style={{ animation: 'chase 2s ease-in-out infinite' }}>
                    {/* Body with € on chest */}
                    <rect x="170" y="56" width="30" height="40" fill="#c0392b" rx="4"/>
                    <text x="185" y="80" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="15" fontWeight="700" fontFamily="DM Sans, sans-serif">€</text>
                    {/* Head — no label */}
                    <circle cx="185" cy="46" r="14" fill="#c0392b"/>
                    {/* Angry eyes */}
                    <circle cx="181" cy="47" r="2" fill="#7f0000"/>
                    <circle cx="189" cy="47" r="2" fill="#7f0000"/>
                    {/* Arm holding document */}
                    <line x1="170" y1="67" x2="150" y2="60" stroke="#c0392b" strokeWidth="3.5" strokeLinecap="round"/>
                    {/* Document: white rect + TAX title + content lines */}
                    <rect x="112" y="48" width="40" height="28" fill="#f0ede4" rx="3"/>
                    <text x="132" y="61" textAnchor="middle" fill="#0e0e0c" fontSize="8" fontWeight="700" fontFamily="DM Sans, sans-serif">TAX</text>
                    <line x1="117" y1="66" x2="147" y2="66" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2"/>
                    <line x1="117" y1="70" x2="143" y2="70" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2"/>
                    <line x1="117" y1="73" x2="138" y2="73" stroke="rgba(0,0,0,0.1)" strokeWidth="1.2"/>
                    {/* Other arm */}
                    <line x1="200" y1="67" x2="212" y2="60" stroke="#c0392b" strokeWidth="3.5" strokeLinecap="round"/>
                    {/* Running legs */}
                    <line x1="178" y1="96" x2="168" y2="114" stroke="#c0392b" strokeWidth="3.5" strokeLinecap="round"/>
                    <line x1="192" y1="96" x2="202" y2="114" stroke="#c0392b" strokeWidth="3.5" strokeLinecap="round"/>
                  </g>
                </svg>
              </div>
              <div className="taxman-lines">
                {lx.withoutLines.map((line, i) => (
                  <div key={i} className="taxman-line">✗ {line}</div>
                ))}
              </div>
              <div className="taxman-accent-red" />
            </div>

            {/* Right: With Finku */}
            <div className="taxman-panel">
              <div className="taxman-panel-title">{lx.withFinku}</div>
              <div className="taxman-svg-area">
                <svg viewBox="0 0 260 130" style={{ width: '100%', height: '100%' }} aria-hidden="true">
                  {/* Calm floating freelancer */}
                  <g style={{ animation: 'floatCalm 3s ease-in-out infinite' }}>
                    <rect x="52" y="56" width="24" height="36" fill="#f0ede4" rx="3"/>
                    <circle cx="64" cy="47" r="13" fill="#f0ede4"/>
                    <circle cx="59" cy="44" r="1.8" fill="#0e0e0c"/>
                    <circle cx="69" cy="44" r="1.8" fill="#0e0e0c"/>
                    <path d="M59 52 Q64 58 69 52" stroke="#555" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                    <line x1="52" y1="67" x2="38" y2="76" stroke="#f0ede4" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="76" y1="67" x2="90" y2="76" stroke="#f0ede4" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="59" y1="92" x2="54" y2="110" stroke="#f0ede4" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="69" y1="92" x2="74" y2="110" stroke="#f0ede4" strokeWidth="3" strokeLinecap="round"/>
                  </g>

                  {/* Mini phone */}
                  <rect x="138" y="20" width="58" height="94" fill="#161614" rx="10" stroke="#2a2a28" strokeWidth="2"/>
                  <rect x="155" y="20" width="24" height="9" fill="#2a2a28" rx="0 0 5px 5px"/>
                  {/* Mini tax banner inside phone */}
                  <rect x="142" y="34" width="50" height="18" fill="rgba(200,240,58,0.08)" rx="4" stroke="rgba(200,240,58,0.2)" strokeWidth="0.5"/>
                  <text x="167" y="46" textAnchor="middle" fill="#c8f03a" fontSize="7" fontFamily="DM Sans, sans-serif">~1,842 €</text>
                  {/* Mini KPI cards */}
                  <rect x="142" y="56" width="23" height="16" fill="rgba(240,237,228,0.05)" rx="3"/>
                  <rect x="169" y="56" width="23" height="16" fill="rgba(240,237,228,0.05)" rx="3"/>
                  {/* Pulsing checkmark */}
                  <g style={{ animation: 'pulseCheck 2s ease-in-out infinite' }}>
                    <circle cx="167" cy="91" r="15" fill="rgba(200,240,58,0.14)" stroke="#c8f03a" strokeWidth="1.5"/>
                    <path d="M160 91 L165 97 L175 83" stroke="#c8f03a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </svg>
              </div>
              <div className="taxman-lines">
                {lx.withLines.map((line, i) => (
                  <div key={i} className="taxman-line-bright">✓ {line}</div>
                ))}
              </div>
              <div className="taxman-accent-green" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section reveal">
          <h2 className="cta-title">Start knowing your numbers.</h2>
          <p className="cta-sub">Free to use. No credit card. Takes 30 seconds.</p>
          <button className="btn-primary-lg" onClick={() => navigate('/auth?mode=signup')}>
            Create your account
          </button>
        </section>

        <footer>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="footer-logo">Finku</div>
            <span className="footer-note">© 2026</span>
          </div>
          <div className="footer-note">Tax estimates are approximate and do not constitute tax advice.</div>
          <div className="footer-links">
            <Link to="/blog" className="footer-link">Blog</Link>
            <Link to="/how-to-pay" className="footer-link">How to pay</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms</Link>
          </div>
        </footer>
      </div>
    </>
  )
}
