import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../lib/LanguageContext'
import { t } from '../i18n/translations'
import LanguageToggle from '../components/LanguageToggle'

const steps = [
  {
    n: 1,
    titleEn: 'Get your ПИК code',
    titleBg: 'Вземи ПИК код',
    textEn: 'You need a ПИК (Personal Identification Code) to access НАП online services. If you don\'t have one, visit your local НАП office with your ID card and request one for free. It takes about 10 minutes.',
    textBg: 'Нужен ти е ПИК (Персонален идентификационен код) за достъп до онлайн услугите на НАП. Ако нямаш, посети местния офис на НАП с лична карта и поискай безплатно. Отнема около 10 минути.',
  },
  {
    n: 2,
    titleEn: 'Log in to НАП online portal',
    titleBg: 'Влез в онлайн портала на НАП',
    textEn: 'Go to nra.bg and click "Вход с ПИК" (Login with ПИК). Enter your EGN and ПИК code.',
    textBg: 'Отиди на nra.bg и кликни "Вход с ПИК". Въведи ЕГН и ПИК код.',
  },
  {
    n: 3,
    titleEn: 'File your declaration (чл. 55 ЗДДФЛ)',
    titleBg: 'Подай декларация (чл. 55 ЗДДФЛ)',
    textEn: 'Navigate to Услуги → Деклариране → Декларация по чл. 55 ЗДДФЛ. This is the quarterly advance tax declaration. Fill in your gross income for the quarter.',
    textBg: 'Навигирай до Услуги → Деклариране → Декларация по чл. 55 ЗДДФЛ. Това е тримесечната авансова данъчна декларация. Попълни брутния си доход за тримесечието.',
  },
  {
    n: 4,
    titleEn: 'Calculate and pay',
    titleBg: 'Изчисли и плати',
    textEn: 'НАП will calculate the amount based on your declaration. You can pay directly online via bank card, or via bank transfer to НАП\'s account. Keep the payment receipt.',
    textBg: 'НАП ще изчисли сумата въз основа на декларацията. Можеш да платиш онлайн с карта или банков превод по сметката на НАП. Запази разписката.',
  },
  {
    n: 5,
    titleEn: 'Pay monthly insurance separately',
    titleBg: 'Плащай осигуровките отделно',
    textEn: 'Insurance contributions (153 €/month minimum) are paid separately — not through this declaration. Pay them monthly by the 25th via your bank or online banking to the НАП insurance account.',
    textBg: 'Осигуровките (153 €/месец минимум) се плащат отделно — не чрез тази декларация. Плащай ги месечно до 25-о число чрез банката или онлайн банкиране по осигурителната сметка на НАП.',
  },
]

const deadlines = [
  { labelEn: 'Q1 advance tax', labelBg: 'Q1 авансов данък', dateEn: 'April 30', dateBg: '30 април' },
  { labelEn: 'Q2 advance tax', labelBg: 'Q2 авансов данък', dateEn: 'July 31', dateBg: '31 юли' },
  { labelEn: 'Q3 advance tax', labelBg: 'Q3 авансов данък', dateEn: 'October 31', dateBg: '31 октомври' },
  { labelEn: 'Monthly insurance', labelBg: 'Месечни осигуровки', dateEn: '25th of each month', dateBg: '25-о всеки месец' },
]

export default function HowToPay() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const lang = t[language]
  const isBg = language === 'bg'

  useEffect(() => { document.title = 'How to Pay Your Tax · Finku' }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0e0e0c; }
        .htp-page { font-family: 'DM Sans', sans-serif; background: #0e0e0c; color: #f0ede4; min-height: 100vh; }
        .htp-nav { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 4rem; position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(14,14,12,0.88); backdrop-filter: blur(12px); border-bottom: 0.5px solid rgba(240,237,228,0.08); }
        .htp-nav-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: #f0ede4; letter-spacing: -0.3px; text-decoration: none; }
        .htp-nav-right { display: flex; gap: 10px; align-items: center; }
        .htp-nav-ghost { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 7px 14px; border-radius: 8px; transition: color 0.15s; }
        .htp-nav-ghost:hover { color: #f0ede4; }
        .htp-nav-cta { background: #c8f03a; color: #0e0e0c; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; padding: 7px 16px; border-radius: 8px; transition: opacity 0.2s; }
        .htp-nav-cta:hover { opacity: 0.88; }
        .htp-content { max-width: 720px; margin: 0 auto; padding: 6rem 1.5rem 5rem; }
        .htp-title { font-family: 'Instrument Serif', serif; font-size: clamp(30px, 5vw, 48px); letter-spacing: -0.8px; line-height: 1.1; color: #f0ede4; margin-bottom: 0.75rem; }
        .htp-sub { font-size: 15px; color: rgba(240,237,228,0.45); line-height: 1.65; margin-bottom: 3rem; }
        .htp-steps { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2.5rem; }
        .htp-step { background: #161614; border: 1px solid rgba(240,237,228,0.08); border-radius: 14px; padding: 1.5rem; display: flex; gap: 1.25rem; align-items: flex-start; }
        .htp-step-num { font-family: 'Instrument Serif', serif; font-size: 32px; color: rgba(200,240,58,0.5); line-height: 1; flex-shrink: 0; width: 36px; text-align: right; }
        .htp-step-body { flex: 1; min-width: 0; }
        .htp-step-title { font-size: 15px; font-weight: 500; color: #f0ede4; margin-bottom: 0.5rem; }
        .htp-step-text { font-size: 14px; color: rgba(240,237,228,0.5); line-height: 1.7; }
        .htp-deadlines { background: #161614; border: 1px solid rgba(200,240,58,0.2); border-radius: 14px; padding: 1.5rem; margin-bottom: 2.5rem; }
        .htp-deadlines-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(200,240,58,0.6); margin-bottom: 1rem; }
        .htp-deadline-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 0.5px solid rgba(240,237,228,0.06); font-size: 13px; }
        .htp-deadline-row:last-child { border-bottom: none; padding-bottom: 0; }
        .htp-cta { background: #161614; border: 1px solid rgba(240,237,228,0.08); border-radius: 14px; padding: 2rem; text-align: center; }
        .htp-cta-text { font-size: 15px; color: rgba(240,237,228,0.6); line-height: 1.65; margin-bottom: 1.25rem; }
        .htp-cta-btn { display: inline-block; background: #c8f03a; color: #0e0e0c; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; padding: 11px 24px; border-radius: 10px; text-decoration: none; transition: opacity 0.2s; }
        .htp-cta-btn:hover { opacity: 0.88; }
        .htp-footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 0.5px solid rgba(240,237,228,0.07); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .htp-footer-logo { font-family: 'Instrument Serif', serif; font-size: 16px; color: rgba(240,237,228,0.3); }
        .htp-footer-links { display: flex; gap: 1.25rem; }
        .htp-footer-link { font-size: 13px; color: rgba(240,237,228,0.35); text-decoration: none; transition: color 0.15s; }
        .htp-footer-link:hover { color: rgba(240,237,228,0.65); }
        @media (max-width: 640px) {
          .htp-nav { padding: 1rem 1.25rem; }
          .htp-step { flex-direction: column; gap: 0.5rem; }
          .htp-step-num { width: auto; text-align: left; }
        }
      `}</style>

      <div className="htp-page">
        <nav className="htp-nav">
          <Link to="/" className="htp-nav-logo">Finku</Link>
          <div className="htp-nav-right">
            <button className="htp-nav-ghost" onClick={() => navigate('/auth')}>{lang.login}</button>
            <LanguageToggle />
            <button className="htp-nav-cta" onClick={() => navigate('/auth?mode=signup')}>{lang.navCreateFree}</button>
          </div>
        </nav>

        <div className="htp-content">
          <h1 className="htp-title">
            {isBg ? 'Как да платиш данък на НАП' : 'How to Pay Your Tax to НАП'}
          </h1>
          <p className="htp-sub">
            {isBg
              ? 'Стъпка по стъпка ръководство за авансови данъчни плащания и осигуровки за свободни професии в България.'
              : 'Step-by-step guide to advance tax payments and insurance contributions for the self-employed in Bulgaria.'}
          </p>

          <div className="htp-steps">
            {steps.map(step => (
              <div key={step.n} className="htp-step">
                <div className="htp-step-num">{step.n}</div>
                <div className="htp-step-body">
                  <div className="htp-step-title">{isBg ? step.titleBg : step.titleEn}</div>
                  <div className="htp-step-text">{isBg ? step.textBg : step.textEn}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="htp-deadlines">
            <div className="htp-deadlines-title">
              {isBg ? 'Важни срокове' : 'Important deadlines'}
            </div>
            {deadlines.map((d, i) => (
              <div key={i} className="htp-deadline-row">
                <span style={{ color: 'rgba(240,237,228,0.6)' }}>{isBg ? d.labelBg : d.labelEn}</span>
                <span style={{ color: '#c8f03a', fontWeight: 500 }}>{isBg ? d.dateBg : d.dateEn}</span>
              </div>
            ))}
          </div>

          <div className="htp-cta">
            <p className="htp-cta-text">
              {isBg
                ? 'Използвай Finku, за да знаеш точно колко дължиш преди всеки срок.'
                : 'Use Finku to know exactly what you owe before each deadline.'}
            </p>
            <Link to="/auth?mode=signup" className="htp-cta-btn">
              {isBg ? 'Започни безплатно →' : 'Start for free →'}
            </Link>
          </div>

          <div className="htp-footer">
            <div className="htp-footer-logo">Finku</div>
            <div className="htp-footer-links">
              <Link to="/blog" className="htp-footer-link">{lang.footerBlog}</Link>
              <Link to="/privacy" className="htp-footer-link">{isBg ? 'Поверителност' : 'Privacy'}</Link>
              <Link to="/terms" className="htp-footer-link">{isBg ? 'Условия' : 'Terms'}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
