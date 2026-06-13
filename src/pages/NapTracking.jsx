import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../lib/LanguageContext'
import { t } from '../i18n/translations'
import LanguageToggle from '../components/LanguageToggle'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

const autoSources = [
  {
    name: 'Банкови сметки',
    desc: 'Директен достъп; преводи над 1 000 лв генерират сигнал',
    since: 'От 1995 г.',
    sinceEn: 'Since 1995',
    nameEn: 'Bank accounts',
    descEn: 'Direct access; transfers over 1,000 BGN trigger a flag',
  },
  {
    name: 'Revolut',
    desc: 'DAC7 директива — докладва всички EU потребители',
    since: 'От 2023 г. — DAC7',
    sinceEn: 'Since 2023 — DAC7',
    nameEn: 'Revolut',
    descEn: 'DAC7 directive — reports all EU users',
  },
  {
    name: 'Airbnb',
    desc: 'Задължително докладване на всички наемни приходи',
    since: 'От 2023 г. — DAC7',
    sinceEn: 'Since 2023 — DAC7',
    nameEn: 'Airbnb',
    descEn: 'Mandatory reporting of all rental income',
  },
  {
    name: 'Upwork / Fiverr',
    desc: 'Докладват приходи на EU-базирани потребители',
    since: 'От 2023 г. — DAC7',
    sinceEn: 'Since 2023 — DAC7',
    nameEn: 'Upwork / Fiverr',
    descEn: 'Report earnings of EU-based users',
  },
  {
    name: 'YouTube / AdSense',
    desc: 'Google докладва AdSense приходи към данъчни органи',
    since: 'Автоматично',
    sinceEn: 'Automatic',
    nameEn: 'YouTube / AdSense',
    descEn: 'Google reports AdSense earnings to tax authorities',
  },
  {
    name: 'Крипто борси (Binance, Kraken)',
    desc: 'DAC8 задължава всички EU борси да докладват',
    since: 'От 2026 г. — DAC8',
    sinceEn: 'From 2026 — DAC8',
    nameEn: 'Crypto exchanges (Binance, Kraken)',
    descEn: 'DAC8 requires all EU exchanges to report',
  },
]

const manualSources = [
  {
    name: 'Социални мрежи (#ad постове)',
    desc: 'НАП следи публични профили за рекламно съдържание',
    nameEn: 'Social media (#ad posts)',
    descEn: 'NRA monitors public profiles for sponsored content',
  },
  {
    name: 'PayPal',
    desc: 'Споделя информация при директно запитване от НАП',
    nameEn: 'PayPal',
    descEn: 'Shares information upon direct NRA request',
  },
  {
    name: 'Имотен регистър',
    desc: 'НАП кръстосва имотни сделки с декларирани доходи',
    nameEn: 'Property registry',
    descEn: 'NRA cross-references property transactions with declared income',
  },
]

export default function NapTracking() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const lang = t[language]
  const isBg = language === 'bg'
  const [session, setSession] = useState(null)

  useEffect(() => {
    document.title = isBg ? 'Какво вижда НАП · Finku' : 'What NRA Sees · Finku'
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0e0e0c; }
        .nap-page { font-family: 'DM Sans', sans-serif; background: #0e0e0c; color: #f0ede4; min-height: 100vh; }

        .nap-nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.25rem 4rem; position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: rgba(14,14,12,0.88); backdrop-filter: blur(12px);
          border-bottom: 0.5px solid rgba(240,237,228,0.08);
        }
        .nap-nav-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: #f0ede4; letter-spacing: -0.3px; text-decoration: none; }
        .nap-nav-right { display: flex; gap: 10px; align-items: center; }
        .nap-nav-ghost { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 7px 14px; border-radius: 8px; transition: color 0.15s; }
        .nap-nav-ghost:hover { color: #f0ede4; }
        .nap-nav-cta { background: #c8f03a; color: #0e0e0c; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; padding: 7px 16px; border-radius: 8px; transition: opacity 0.2s; }
        .nap-nav-cta:hover { opacity: 0.88; }

        .nap-content { max-width: 800px; margin: 0 auto; padding: 6rem 1.5rem 5rem; }

        .nap-hero { margin-bottom: 3.5rem; }
        .nap-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #e07070; margin-bottom: 1rem; font-weight: 500; }
        .nap-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(30px, 5vw, 52px);
          letter-spacing: -0.8px; line-height: 1.08;
          color: #f0ede4; margin-bottom: 0.75rem;
        }
        .nap-sub { font-size: 16px; color: rgba(240,237,228,0.5); line-height: 1.65; max-width: 560px; }

        .nap-section { margin-bottom: 2.5rem; }
        .nap-section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
        .nap-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .nap-dot-red { background: #e07070; box-shadow: 0 0 8px rgba(224,112,112,0.5); }
        .nap-dot-amber { background: #ffb400; box-shadow: 0 0 8px rgba(255,180,0,0.4); }
        .nap-section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; }
        .nap-section-label-red { color: #e07070; }
        .nap-section-label-amber { color: #ffb400; }

        .nap-cards { display: flex; flex-direction: column; gap: 8px; }
        .nap-card {
          background: #161614;
          border: 1px solid rgba(240,237,228,0.07);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex; justify-content: space-between; align-items: center; gap: 1rem;
          transition: border-color 0.15s;
        }
        .nap-card:hover { border-color: rgba(240,237,228,0.14); }
        .nap-card-auto { border-left: 2px solid rgba(224,112,112,0.35); }
        .nap-card-manual { border-left: 2px solid rgba(255,180,0,0.35); }
        .nap-card-name { font-size: 14px; font-weight: 500; color: #f0ede4; margin-bottom: 3px; }
        .nap-card-desc { font-size: 12px; color: rgba(240,237,228,0.4); line-height: 1.5; }
        .nap-card-since {
          font-size: 11px; font-weight: 500; white-space: nowrap; flex-shrink: 0;
          padding: 3px 10px; border-radius: 20px;
        }
        .nap-card-since-red { background: rgba(224,112,112,0.1); color: #e07070; border: 1px solid rgba(224,112,112,0.2); }
        .nap-card-since-amber { background: rgba(255,180,0,0.1); color: #ffb400; border: 1px solid rgba(255,180,0,0.2); }

        .nap-cta-card {
          background: #161614;
          border: 1px solid rgba(240,237,228,0.1);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          margin-top: 3rem;
          position: relative;
          overflow: hidden;
        }
        .nap-cta-glow {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 300px; height: 200px;
          background: radial-gradient(ellipse, rgba(200,240,58,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .nap-cta-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(22px, 3vw, 32px);
          color: #f0ede4; letter-spacing: -0.3px;
          margin-bottom: 0.75rem; position: relative;
        }
        .nap-cta-sub { font-size: 14px; color: rgba(240,237,228,0.45); margin-bottom: 1.5rem; line-height: 1.6; position: relative; }
        .nap-cta-btn {
          display: inline-block;
          background: #c8f03a; color: #0e0e0c;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          padding: 12px 28px; border-radius: 10px;
          border: none; cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          position: relative; text-decoration: none;
        }
        .nap-cta-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        .nap-footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 0.5px solid rgba(240,237,228,0.07); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .nap-footer-logo { font-family: 'Instrument Serif', serif; font-size: 16px; color: rgba(240,237,228,0.3); }
        .nap-footer-links { display: flex; gap: 1.25rem; }
        .nap-footer-link { font-size: 13px; color: rgba(240,237,228,0.35); text-decoration: none; transition: color 0.15s; }
        .nap-footer-link:hover { color: rgba(240,237,228,0.65); }

        @media (max-width: 640px) {
          .nap-nav { padding: 1rem 1.25rem; }
          .nap-nav-ghost { display: none; }
          .nap-content { padding: 5rem 1rem 4rem; }
          .nap-card { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .nap-footer { padding: 1.5rem 0; }
        }
      `}</style>

      <div className="nap-page">
        <nav className="nap-nav">
          <Link to="/" className="nap-nav-logo">Finku</Link>
          <div className="nap-nav-right">
            <LanguageToggle />
            {session ? (
              <button className="nap-nav-ghost" onClick={() => navigate('/dashboard')}>{lang.backToDashboard}</button>
            ) : (
              <>
                <button className="nap-nav-ghost" onClick={() => navigate('/auth')}>{lang.login}</button>
                <button className="nap-nav-cta" onClick={() => navigate('/auth?mode=signup')}>{lang.navCreateFree}</button>
              </>
            )}
          </div>
        </nav>

        <div className="nap-content">
          <div className="nap-hero">
            <div className="nap-eyebrow">НАП</div>
            <h1 className="nap-title">
              {isBg ? 'НАП вижда всичко.\nТи наясно ли си?' : 'NRA sees everything.\nAre you aware?'}
            </h1>
            <p className="nap-sub">
              {isBg
                ? 'Тези платформи автоматично споделят информация с НАП. Без предупреждение. Без изключения.'
                : 'These platforms automatically share information with the NRA. No warning. No exceptions.'}
            </p>
          </div>

          {/* Automatic reporting */}
          <div className="nap-section">
            <div className="nap-section-header">
              <div className="nap-dot nap-dot-red" />
              <span className="nap-section-label nap-section-label-red">
                {isBg ? 'Автоматично докладване' : 'Automatic reporting'}
              </span>
            </div>
            <div className="nap-cards">
              {autoSources.map((s, i) => (
                <div key={i} className="nap-card nap-card-auto">
                  <div>
                    <div className="nap-card-name">{isBg ? s.name : s.nameEn}</div>
                    <div className="nap-card-desc">{isBg ? s.desc : s.descEn}</div>
                  </div>
                  <span className="nap-card-since nap-card-since-red">{isBg ? s.since : s.sinceEn}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Manual reporting */}
          <div className="nap-section">
            <div className="nap-section-header">
              <div className="nap-dot nap-dot-amber" />
              <span className="nap-section-label nap-section-label-amber">
                {isBg ? 'Ръчна проверка' : 'Manual inspection'}
              </span>
            </div>
            <div className="nap-cards">
              {manualSources.map((s, i) => (
                <div key={i} className="nap-card nap-card-manual">
                  <div>
                    <div className="nap-card-name">{isBg ? s.name : s.nameEn}</div>
                    <div className="nap-card-desc">{isBg ? s.desc : s.descEn}</div>
                  </div>
                  <span className="nap-card-since nap-card-since-amber">
                    {isBg ? 'При запитване' : 'Upon request'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="nap-cta-card">
            <div className="nap-cta-glow" />
            <h2 className="nap-cta-title">
              {isBg ? 'НАП вече провери. Ти провери ли се?' : 'NRA already checked. Have you?'}
            </h2>
            <p className="nap-cta-sub">
              {isBg
                ? 'Finku показва точно колко дължиш, преди НАП да те потърси.'
                : 'Finku shows you exactly what you owe, before NRA comes looking.'}
            </p>
            <Link
              to={session ? '/dashboard' : '/auth?mode=signup'}
              className="nap-cta-btn"
            >
              {isBg ? 'Виж колко дължиш →' : 'See what you owe →'}
            </Link>
          </div>

          <div className="nap-footer">
            <div className="nap-footer-logo">Finku</div>
            <div className="nap-footer-links">
              <Link to="/blog" className="nap-footer-link">{lang.footerBlog}</Link>
              <Link to="/how-to-pay" className="nap-footer-link">{lang.footerHowToPay}</Link>
              <Link to="/privacy" className="nap-footer-link">{lang.footerPrivacy}</Link>
              <Link to="/terms" className="nap-footer-link">{lang.footerTerms}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
