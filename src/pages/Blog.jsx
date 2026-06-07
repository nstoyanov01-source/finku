import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { blogPosts } from '../data/blogPosts'

export default function Blog({ language = 'en' }) {
  const navigate = useNavigate()
  const isBg = language === 'bg'

  useEffect(() => { document.title = 'Blog · Finku' }, [])

  const sortedPosts = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0e0e0c; }
        .blog-page { font-family: 'DM Sans', sans-serif; background: #0e0e0c; color: #f0ede4; min-height: 100vh; }

        .blog-nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.25rem 4rem; position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: rgba(14,14,12,0.88); backdrop-filter: blur(12px);
          border-bottom: 0.5px solid rgba(240,237,228,0.08);
        }
        .blog-nav-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: #f0ede4; letter-spacing: -0.3px; text-decoration: none; }
        .blog-nav-right { display: flex; gap: 10px; align-items: center; }
        .blog-nav-ghost { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 7px 14px; border-radius: 8px; transition: color 0.15s; }
        .blog-nav-ghost:hover { color: #f0ede4; }
        .blog-nav-cta { background: #c8f03a; color: #0e0e0c; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; padding: 7px 16px; border-radius: 8px; transition: opacity 0.2s; }
        .blog-nav-cta:hover { opacity: 0.88; }

        .blog-content { max-width: 860px; margin: 0 auto; padding: 6rem 1.5rem 4rem; }

        .blog-hero { margin-bottom: 3.5rem; }
        .blog-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(32px, 5vw, 52px);
          letter-spacing: -0.8px;
          line-height: 1.08;
          color: #f0ede4;
          margin-bottom: 0.75rem;
        }
        .blog-sub { font-size: 16px; color: rgba(240,237,228,0.5); line-height: 1.6; max-width: 560px; }

        .blog-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }

        .blog-card {
          background: #161614;
          border: 1px solid rgba(240,237,228,0.08);
          border-radius: 14px;
          padding: 1.5rem;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: border-color 0.15s, background 0.15s;
        }
        .blog-card:hover { border-color: rgba(240,237,228,0.18); background: #1a1a18; }

        .blog-card-meta { font-size: 11px; color: rgba(240,237,228,0.3); margin-bottom: 0.75rem; letter-spacing: 0.3px; }
        .blog-card-title { font-size: 16px; font-weight: 500; color: #f0ede4; line-height: 1.4; margin-bottom: 0.6rem; letter-spacing: -0.2px; }
        .blog-card-desc { font-size: 13px; color: rgba(240,237,228,0.5); line-height: 1.6; flex: 1; margin-bottom: 1.25rem; }
        .blog-card-read { font-size: 13px; color: #c8f03a; font-weight: 500; }

        .blog-footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 0.5px solid rgba(240,237,228,0.07); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .blog-footer-logo { font-family: 'Instrument Serif', serif; font-size: 16px; color: rgba(240,237,228,0.3); }
        .blog-footer-links { display: flex; gap: 1.25rem; }
        .blog-footer-link { font-size: 13px; color: rgba(240,237,228,0.35); text-decoration: none; transition: color 0.15s; }
        .blog-footer-link:hover { color: rgba(240,237,228,0.65); }

        @media (max-width: 640px) {
          .blog-nav { padding: 1rem 1.25rem; }
          .blog-grid { grid-template-columns: 1fr; }
          .blog-nav-ghost { display: none; }
        }
      `}</style>

      <div className="blog-page">
        <nav className="blog-nav">
          <Link to="/" className="blog-nav-logo">Finku</Link>
          <div className="blog-nav-right">
            <button className="blog-nav-ghost" onClick={() => navigate('/auth')}>Log in</button>
            <button className="blog-nav-cta" onClick={() => navigate('/auth?mode=signup')}>Create free account</button>
          </div>
        </nav>

        <div className="blog-content">
          <div className="blog-hero">
            <h1 className="blog-title">
              {isBg
                ? 'Финансови съвети за самоосигуряващи се'
                : 'Financial guides for the self-employed'}
            </h1>
            <p className="blog-sub">
              {isBg
                ? 'Практични обяснения за данъци, осигуровки и фактури в България.'
                : 'Practical explanations of taxes, insurance and invoicing in Bulgaria.'}
            </p>
          </div>

          <div className="blog-grid">
            {sortedPosts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="blog-card">
                <div className="blog-card-meta">
                  {new Date(post.date).toLocaleDateString(isBg ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}
                  {post.readingTime} {isBg ? 'мин. четене' : 'min read'}
                </div>
                <div className="blog-card-title">{isBg ? post.titleBg : post.title}</div>
                <div className="blog-card-desc">{isBg ? post.descriptionBg : post.description}</div>
                <div className="blog-card-read">{isBg ? 'Прочети →' : 'Read →'}</div>
              </Link>
            ))}
          </div>

          <div className="blog-footer">
            <div className="blog-footer-logo">Finku</div>
            <div className="blog-footer-links">
              <Link to="/blog" className="blog-footer-link">Blog</Link>
              <Link to="/how-to-pay" className="blog-footer-link">{isBg ? 'Как да платиш' : 'How to pay'}</Link>
              <Link to="/changelog" className="blog-footer-link">Changelog</Link>
              <Link to="/privacy" className="blog-footer-link">{isBg ? 'Поверителност' : 'Privacy'}</Link>
              <Link to="/terms" className="blog-footer-link">{isBg ? 'Условия' : 'Terms'}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
