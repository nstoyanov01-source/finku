import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const entries = [
  {
    date: 'June 2026',
    dateBg: 'Юни 2026',
    tag: 'Major Update',
    tagBg: 'Голямо обновление',
    title: 'Complete redesign + Tax timeline',
    titleBg: 'Пълен редизайн + Данъчен таймлайн',
    items: [
      'Dark theme across entire app',
      'Payment timeline with upcoming НАП deadlines',
      'Invoice generator with PDF export',
      'Bilingual English and Bulgarian',
      'Interactive tax calculator on landing page',
      'Blog with tax guides',
    ],
    itemsBg: [
      'Тъмна тема в цялото приложение',
      'Таймлайн на плащанията с предстоящи срокове на НАП',
      'Генератор на фактури с PDF експорт',
      'Двуезично — английски и български',
      'Интерактивен данъчен калкулатор на началната страница',
      'Блог с данъчни ръководства',
    ],
    tagStyle: { background: 'rgba(200,240,58,0.15)', color: '#c8f03a' },
  },
  {
    date: 'May 2026',
    dateBg: 'Май 2026',
    tag: 'Launch',
    tagBg: 'Старт',
    title: 'Finku launches',
    titleBg: 'Finku се стартира',
    items: [
      'Income and expense tracking',
      'Live tax estimate for свободна професия and ЕТ',
      'Revolut CSV import',
      'PWA installable on mobile',
    ],
    itemsBg: [
      'Проследяване на приходи и разходи',
      'Жива данъчна прогноза за свободна професия и ЕТ',
      'Импорт на Revolut CSV',
      'PWA — инсталируем на мобилно устройство',
    ],
    tagStyle: { background: '#c8f03a', color: '#0e0e0c' },
  },
]

export default function Changelog({ language = 'en' }) {
  const navigate = useNavigate()
  const isBg = language === 'bg'

  useEffect(() => { document.title = "What's New · Finku" }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0e0e0c; }
        .cl-page { font-family: 'DM Sans', sans-serif; background: #0e0e0c; color: #f0ede4; min-height: 100vh; }
        .cl-nav { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 4rem; position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(14,14,12,0.88); backdrop-filter: blur(12px); border-bottom: 0.5px solid rgba(240,237,228,0.08); }
        .cl-nav-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: #f0ede4; letter-spacing: -0.3px; text-decoration: none; }
        .cl-nav-right { display: flex; gap: 10px; align-items: center; }
        .cl-nav-ghost { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 7px 14px; border-radius: 8px; transition: color 0.15s; }
        .cl-nav-ghost:hover { color: #f0ede4; }
        .cl-nav-cta { background: #c8f03a; color: #0e0e0c; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; padding: 7px 16px; border-radius: 8px; transition: opacity 0.2s; }
        .cl-nav-cta:hover { opacity: 0.88; }
        .cl-content { max-width: 760px; margin: 0 auto; padding: 6rem 1.5rem 5rem; }
        .cl-hero { margin-bottom: 3.5rem; }
        .cl-title { font-family: 'Instrument Serif', serif; font-size: clamp(32px, 5vw, 52px); letter-spacing: -0.8px; line-height: 1.08; color: #f0ede4; margin-bottom: 0.5rem; }
        .cl-sub { font-size: 15px; color: rgba(240,237,228,0.45); }
        .cl-timeline { position: relative; padding-left: 2rem; }
        .cl-timeline::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 1px; background: rgba(200,240,58,0.2); }
        .cl-entry { position: relative; display: grid; grid-template-columns: 140px 1fr; gap: 2rem; margin-bottom: 2.5rem; align-items: flex-start; }
        .cl-entry::before { content: ''; position: absolute; left: -2.35rem; top: 10px; width: 8px; height: 8px; border-radius: 50%; background: rgba(200,240,58,0.4); border: 1.5px solid rgba(200,240,58,0.6); }
        .cl-entry-date { font-size: 13px; color: rgba(240,237,228,0.35); padding-top: 2px; }
        .cl-entry-card { background: #161614; border: 1px solid rgba(240,237,228,0.08); border-radius: 14px; padding: 1.5rem; }
        .cl-entry-header { display: flex; align-items: center; gap: 10px; margin-bottom: 0.75rem; flex-wrap: wrap; }
        .cl-tag { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
        .cl-entry-title { font-size: 16px; font-weight: 500; color: #f0ede4; }
        .cl-entry-items { list-style: none; margin-top: 0.75rem; display: flex; flex-direction: column; gap: 6px; }
        .cl-entry-item { font-size: 13px; color: rgba(240,237,228,0.5); display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
        .cl-entry-item::before { content: '✓'; color: #c8f03a; font-size: 11px; flex-shrink: 0; margin-top: 1px; }
        .cl-footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 0.5px solid rgba(240,237,228,0.07); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .cl-footer-logo { font-family: 'Instrument Serif', serif; font-size: 16px; color: rgba(240,237,228,0.3); }
        .cl-footer-links { display: flex; gap: 1.25rem; }
        .cl-footer-link { font-size: 13px; color: rgba(240,237,228,0.35); text-decoration: none; transition: color 0.15s; }
        .cl-footer-link:hover { color: rgba(240,237,228,0.65); }
        @media (max-width: 640px) {
          .cl-nav { padding: 1rem 1.25rem; }
          .cl-timeline { padding-left: 1.25rem; }
          .cl-entry { grid-template-columns: 1fr; gap: 0.5rem; }
          .cl-entry::before { left: -1.6rem; }
          .cl-entry-date { padding-top: 0; }
        }
      `}</style>

      <div className="cl-page">
        <nav className="cl-nav">
          <Link to="/" className="cl-nav-logo">Finku</Link>
          <div className="cl-nav-right">
            <button className="cl-nav-ghost" onClick={() => navigate('/auth')}>Log in</button>
            <button className="cl-nav-cta" onClick={() => navigate('/auth?mode=signup')}>Create free account</button>
          </div>
        </nav>

        <div className="cl-content">
          <div className="cl-hero">
            <h1 className="cl-title">{isBg ? 'Какво е ново' : "What's New"}</h1>
            <p className="cl-sub">{isBg ? 'Продуктови обновления и подобрения' : 'Product updates and improvements'}</p>
          </div>

          <div className="cl-timeline">
            {entries.map((entry, i) => (
              <div key={i} className="cl-entry">
                <div className="cl-entry-date">{isBg ? entry.dateBg : entry.date}</div>
                <div className="cl-entry-card">
                  <div className="cl-entry-header">
                    <span className="cl-tag" style={entry.tagStyle}>{isBg ? entry.tagBg : entry.tag}</span>
                    <span className="cl-entry-title">{isBg ? entry.titleBg : entry.title}</span>
                  </div>
                  <ul className="cl-entry-items">
                    {(isBg ? entry.itemsBg : entry.items).map((item, j) => (
                      <li key={j} className="cl-entry-item">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="cl-footer">
            <div className="cl-footer-logo">Finku</div>
            <div className="cl-footer-links">
              <Link to="/blog" className="cl-footer-link">Blog</Link>
              <Link to="/how-to-pay" className="cl-footer-link">{isBg ? 'Как да платиш' : 'How to pay'}</Link>
              <Link to="/privacy" className="cl-footer-link">{isBg ? 'Поверителност' : 'Privacy'}</Link>
              <Link to="/terms" className="cl-footer-link">{isBg ? 'Условия' : 'Terms'}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
