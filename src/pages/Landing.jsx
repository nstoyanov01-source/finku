import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const faqs = [
  {
    q: 'Is Finku really free?',
    a: 'Yes — completely free during beta. No credit card, no hidden trial. We\'ll give plenty of notice before anything changes.',
  },
  {
    q: 'How is the tax estimate calculated?',
    a: 'Based on Bulgarian tax law for self-employed individuals: 75% of your gross income is taxable, then 15% income tax applies, plus fixed monthly insurance contributions. It\'s an estimate — always consult an accountant for your official declaration.',
  },
  {
    q: 'Is my financial data safe?',
    a: 'Your data is stored encrypted in EU-based servers (Ireland). Nobody else can access your entries — not even us. You can delete your account and all data at any time.',
  },
  {
    q: 'Is this for VAT-registered businesses?',
    a: 'Not yet. Finku is currently built for freelancers and sole traders who are not VAT registered. VAT tracking is on the roadmap.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => { document.title = 'Finku — Your freelance finances, simplified' }, [])

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

        .landing {
          font-family: 'DM Sans', sans-serif;
          background: #0e0e0c;
          color: #f0ede4;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal.visible { opacity: 1; transform: none; }

        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 4rem;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          background: rgba(14,14,12,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 0.5px solid rgba(240,237,228,0.08);
        }

        .nav-logo {
          font-family: 'Instrument Serif', serif;
          font-size: 22px;
          color: #f0ede4;
          letter-spacing: -0.3px;
        }

        .nav-right { display: flex; gap: 12px; align-items: center; }

        .btn-ghost {
          background: none;
          border: none;
          color: rgba(240,237,228,0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: color 0.2s;
        }
        .btn-ghost:hover { color: #f0ede4; }

        .btn-cta {
          background: #c8f03a;
          color: #0e0e0c;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 9px 20px;
          border-radius: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .btn-cta:hover { opacity: 0.9; transform: translateY(-1px); }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8rem 2rem 4rem;
          position: relative;
        }

        .hero-glow {
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(200,240,58,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(200,240,58,0.1);
          border: 0.5px solid rgba(200,240,58,0.3);
          color: #c8f03a;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 2rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .hero-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(48px, 7vw, 88px);
          line-height: 1.05;
          letter-spacing: -1.5px;
          color: #f0ede4;
          max-width: 800px;
          margin-bottom: 1.5rem;
        }

        .hero-title em {
          font-style: italic;
          color: #c8f03a;
        }

        .hero-sub {
          font-size: 18px;
          color: rgba(240,237,228,0.55);
          max-width: 480px;
          line-height: 1.65;
          margin-bottom: 2.5rem;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 10px;
        }

        .btn-primary-lg {
          background: #c8f03a;
          color: #0e0e0c;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          padding: 13px 28px;
          border-radius: 10px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .btn-primary-lg:hover { opacity: 0.9; transform: translateY(-1px); }

        .hero-note {
          font-size: 13px;
          color: rgba(240,237,228,0.35);
        }

        .beta-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(200,240,58,0.07);
          border: 0.5px solid rgba(200,240,58,0.18);
          color: rgba(200,240,58,0.7);
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 0.2px;
        }

        .dashboard-preview {
          margin: 3rem auto 0;
          max-width: 860px;
          width: 100%;
          background: #161614;
          border: 0.5px solid rgba(240,237,228,0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
        }

        .preview-bar {
          background: #1c1c1a;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 0.5px solid rgba(240,237,228,0.06);
        }

        .dot { width: 10px; height: 10px; border-radius: 50%; }

        .preview-body {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .preview-card {
          background: rgba(240,237,228,0.04);
          border: 0.5px solid rgba(240,237,228,0.08);
          border-radius: 10px;
          padding: 14px;
        }

        .preview-label { font-size: 11px; color: rgba(240,237,228,0.35); margin-bottom: 6px; }
        .preview-value { font-size: 20px; font-weight: 500; }
        .preview-green { color: #7ec95f; }
        .preview-red { color: #e07070; }
        .preview-amber { color: #e8a84a; }

        .preview-tax {
          grid-column: 1 / -1;
          background: rgba(200,240,58,0.04);
          border: 0.5px solid rgba(200,240,58,0.15);
          border-radius: 10px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .preview-tax-label { font-size: 13px; font-weight: 500; color: rgba(240,237,228,0.8); }
        .preview-tax-sub { font-size: 11px; color: rgba(240,237,228,0.35); margin-top: 2px; }
        .preview-tax-amount { font-size: 22px; font-weight: 500; color: #c8f03a; }

        .features {
          padding: 6rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .section-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(240,237,228,0.3);
          margin-bottom: 1rem;
        }

        .section-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(32px, 4vw, 48px);
          letter-spacing: -0.5px;
          line-height: 1.1;
          color: #f0ede4;
          max-width: 560px;
          margin-bottom: 3.5rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5px;
          background: rgba(240,237,228,0.08);
          border-radius: 16px;
          overflow: hidden;
        }

        .feature-card {
          background: #0e0e0c;
          padding: 2rem;
          position: relative;
          transition: background 0.2s;
        }
        .feature-card:hover { background: #161614; }

        .feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          font-size: 18px;
        }

        .icon-green { background: rgba(126,201,95,0.12); color: #7ec95f; }
        .icon-red { background: rgba(224,112,112,0.12); color: #e07070; }
        .icon-amber { background: rgba(200,240,58,0.12); color: #c8f03a; }

        .feature-title {
          font-size: 15px;
          font-weight: 500;
          color: #f0ede4;
          margin-bottom: 8px;
        }

        .feature-desc {
          font-size: 14px;
          color: rgba(240,237,228,0.45);
          line-height: 1.6;
        }

        .social-proof {
          padding: 4rem 2rem;
          text-align: center;
          border-top: 0.5px solid rgba(240,237,228,0.06);
        }

        .proof-number {
          font-family: 'Instrument Serif', serif;
          font-size: 64px;
          color: #c8f03a;
          letter-spacing: -2px;
        }

        .proof-label {
          font-size: 15px;
          color: rgba(240,237,228,0.45);
          margin-top: 6px;
        }

        .proof-grid {
          display: flex;
          justify-content: center;
          gap: 4rem;
          flex-wrap: wrap;
          margin-top: 2rem;
        }

        /* How it works */
        .how-section {
          padding: 5rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.5rem;
          margin-top: 3.5rem;
        }

        .how-step {}

        .how-number {
          font-family: 'Instrument Serif', serif;
          font-size: 52px;
          color: #c8f03a;
          opacity: 0.55;
          line-height: 1;
          margin-bottom: 1rem;
          letter-spacing: -1px;
        }

        .how-title {
          font-size: 16px;
          font-weight: 500;
          color: #f0ede4;
          margin-bottom: 8px;
        }

        .how-desc {
          font-size: 14px;
          color: rgba(240,237,228,0.5);
          line-height: 1.65;
        }

        /* FAQ */
        .faq-section {
          padding: 4rem 2rem 5rem;
          max-width: 720px;
          margin: 0 auto;
        }

        .faq-list {
          margin-top: 3rem;
          border: 1px solid rgba(240,237,228,0.08);
          border-radius: 14px;
          overflow: hidden;
        }

        .faq-item {
          border-bottom: 0.5px solid rgba(240,237,228,0.07);
        }
        .faq-item:last-child { border-bottom: none; }

        .faq-question {
          width: 100%;
          background: #161614;
          border: none;
          text-align: left;
          padding: 1.25rem 1.5rem;
          color: #f0ede4;
          font-size: 15px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          transition: background 0.15s;
        }
        .faq-question:hover { background: #1a1a18; }

        .faq-chevron {
          font-size: 18px;
          color: rgba(240,237,228,0.3);
          transition: transform 0.2s;
          flex-shrink: 0;
          line-height: 1;
        }
        .faq-chevron.open { transform: rotate(180deg); color: #c8f03a; }

        .faq-answer {
          background: #161614;
          padding: 0 1.5rem 1.25rem;
          font-size: 14px;
          color: rgba(240,237,228,0.5);
          line-height: 1.75;
        }

        /* CTA */
        .cta-section {
          padding: 6rem 2rem;
          text-align: center;
          border-top: 0.5px solid rgba(240,237,228,0.08);
        }

        .cta-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(36px, 5vw, 56px);
          letter-spacing: -1px;
          color: #f0ede4;
          margin-bottom: 1rem;
        }

        .cta-sub {
          font-size: 16px;
          color: rgba(240,237,228,0.45);
          margin-bottom: 2rem;
        }

        footer {
          padding: 2rem 4rem;
          border-top: 0.5px solid rgba(240,237,228,0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-logo {
          font-family: 'Instrument Serif', serif;
          font-size: 18px;
          color: rgba(240,237,228,0.4);
        }

        .footer-note {
          font-size: 13px;
          color: rgba(240,237,228,0.2);
        }

        .footer-links {
          display: flex;
          gap: 1.25rem;
        }

        .footer-link {
          font-size: 13px;
          color: rgba(240,237,228,0.45);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: rgba(240,237,228,0.75); }

        @media (max-width: 700px) {
          nav { padding: 1.25rem 1.5rem; }
          .preview-body { grid-template-columns: 1fr 1fr; }
          .how-grid { grid-template-columns: 1fr; gap: 2rem; }
          footer { padding: 1.5rem; }
        }

        @media (max-width: 700px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .dashboard-preview { display: none; }
          .hero { padding: 6rem 1.5rem 3rem; }
          .hero-sub { font-size: 16px; }
          nav .nav-right .btn-ghost { display: none; }
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

        {/* Hero */}
        <section className="hero" ref={heroRef}>
          <div className="hero-glow" />

          <div className="hero-badge reveal">Free to start · No card needed</div>

          <h1 className="hero-title reveal" style={{ transitionDelay: '0.1s' }}>
            Know exactly what<br />you owe, <em>always</em>
          </h1>

          <p className="hero-sub reveal" style={{ transitionDelay: '0.2s' }}>
            Finku tracks your freelance income and expenses and shows your live tax estimate — so you're never caught off guard at year end.
          </p>

          <div className="hero-actions reveal" style={{ transitionDelay: '0.3s' }}>
            <button className="btn-primary-lg" onClick={() => navigate('/auth?mode=signup')}>
              Start for free
            </button>
            <span className="hero-note">No credit card · Takes 30 seconds</span>
          </div>

          <div className="reveal" style={{ transitionDelay: '0.35s', marginBottom: '0.5rem' }}>
            <span className="beta-tag">Currently free · Beta access open</span>
          </div>

          <div className="dashboard-preview reveal" style={{ transitionDelay: '0.45s' }}>
            <div className="preview-bar">
              <div className="dot" style={{ background: '#ff5f57' }} />
              <div className="dot" style={{ background: '#febc2e' }} />
              <div className="dot" style={{ background: '#28c840' }} />
              <span style={{ fontSize: 12, color: 'rgba(240,237,228,0.25)', marginLeft: 8 }}>finku.eu/dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-card">
                <div className="preview-label">Total income</div>
                <div className="preview-value preview-green">18,400 €</div>
              </div>
              <div className="preview-card">
                <div className="preview-label">Total expenses</div>
                <div className="preview-value preview-red">3,210 €</div>
              </div>
              <div className="preview-card">
                <div className="preview-label">Net income</div>
                <div className="preview-value">15,190 €</div>
              </div>
              <div className="preview-card">
                <div className="preview-label">Avg. monthly</div>
                <div className="preview-value preview-amber">3,038 €</div>
              </div>
              <div className="preview-tax">
                <div>
                  <div className="preview-tax-label">Tax estimate</div>
                  <div className="preview-tax-sub">Based on your income so far this year</div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <div className="preview-label">Income tax (15%)</div>
                    <div style={{ fontSize: 15, color: 'rgba(240,237,228,0.7)' }}>1,709 €</div>
                  </div>
                  <div>
                    <div className="preview-label">Insurance</div>
                    <div style={{ fontSize: 15, color: 'rgba(240,237,228,0.7)' }}>~725 €</div>
                  </div>
                  <div>
                    <div className="preview-label">Total owed</div>
                    <div className="preview-tax-amount">~2,434 €</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <p className="section-label reveal">What Finku does</p>
          <h2 className="section-title reveal" style={{ transitionDelay: '0.1s' }}>
            Everything a freelancer actually needs
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
              {
                n: '01',
                title: 'Sign up free',
                desc: 'Create your account in 30 seconds. No credit card, no setup fees, no catch.',
              },
              {
                n: '02',
                title: 'Log your income',
                desc: 'Add payments as they come in, or import directly from a Revolut CSV export. Takes seconds per entry.',
              },
              {
                n: '03',
                title: 'See what you owe',
                desc: 'Your live tax estimate updates automatically as you go. Check it anytime — no year-end surprises.',
              },
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
          <h2 className="section-title reveal" style={{ transitionDelay: '0.1s' }}>
            Common questions
          </h2>
          <div className="faq-list reveal" style={{ transitionDelay: '0.15s' }}>
            {faqs.map((item, i) => (
              <div key={i} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <span className={`faq-chevron${openFaq === i ? ' open' : ''}`}>›</span>
                </button>
                {openFaq === i && (
                  <div className="faq-answer">{item.a}</div>
                )}
              </div>
            ))}
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
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms</Link>
          </div>
        </footer>
      </div>
    </>
  )
}
