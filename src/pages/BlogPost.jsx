import { useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { blogPosts } from '../data/blogPosts'

function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let i = 0
  let tableBuffer = []
  let inTable = false

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim().startsWith('|')) {
      tableBuffer.push(line)
      inTable = true
      i++
      continue
    }
    if (inTable && !line.trim().startsWith('|')) {
      elements.push(renderTable(tableBuffer, elements.length))
      tableBuffer = []
      inTable = false
    }

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(20px, 3vw, 26px)', color: '#f0ede4', letterSpacing: '-0.3px', marginTop: '2.25rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>{line.slice(3)}</h2>)
    }
    else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: 16, fontWeight: 600, color: '#f0ede4', marginTop: '1.5rem', marginBottom: '0.5rem' }}>{line.slice(4)}</h3>)
    }
    else if (line.startsWith('```')) {
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} style={{ background: '#161614', border: '1px solid rgba(240,237,228,0.08)', borderRadius: 8, padding: '1rem', fontSize: 13, color: 'rgba(240,237,228,0.8)', overflowX: 'auto', marginTop: '1rem', marginBottom: '1rem', fontFamily: 'monospace', lineHeight: 1.6 }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
    }
    else if (line.trim() === '---') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '0.5px solid rgba(240,237,228,0.1)', margin: '2rem 0' }} />)
    }
    else if (line.startsWith('- ')) {
      const listItems = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(<li key={i} style={{ marginBottom: '0.35rem' }}>{inlineFormat(lines[i].slice(2))}</li>)
        i++
      }
      elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: '1.5rem', color: 'rgba(240,237,228,0.7)', fontSize: 15, lineHeight: 1.7, marginBottom: '1rem' }}>{listItems}</ul>)
      continue
    }
    else if (line.trim() === '') {
      // skip
    }
    else {
      elements.push(<p key={i} style={{ fontSize: 15, color: 'rgba(240,237,228,0.7)', lineHeight: 1.8, marginBottom: '1rem' }}>{inlineFormat(line)}</p>)
    }
    i++
  }

  if (tableBuffer.length > 0) {
    elements.push(renderTable(tableBuffer, elements.length))
  }

  return elements
}

function renderTable(rows, keyBase) {
  const parsed = rows
    .filter(r => !r.trim().match(/^\|[-| ]+\|$/))
    .map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()))
  if (parsed.length === 0) return null
  const [header, ...body] = parsed
  return (
    <div key={`table-${keyBase}`} style={{ overflowX: 'auto', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(240,237,228,0.12)', color: 'rgba(240,237,228,0.5)', fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '8px 12px', borderBottom: '0.5px solid rgba(240,237,228,0.06)', color: 'rgba(240,237,228,0.75)', verticalAlign: 'top' }}>{inlineFormat(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function inlineFormat(text) {
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g
  let last = 0
  let match
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2]) parts.push(<strong key={key++} style={{ color: '#f0ede4', fontWeight: 600 }}>{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={key++}>{match[3]}</em>)
    else if (match[4]) parts.push(<code key={key++} style={{ background: '#1e1e1c', padding: '1px 6px', borderRadius: 4, fontSize: '0.9em', color: 'rgba(240,237,228,0.85)', fontFamily: 'monospace' }}>{match[4]}</code>)
    else if (match[5]) parts.push(<a key={key++} href={match[6]} style={{ color: '#c8f03a', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">{match[5]}</a>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}

export default function BlogPost({ language = 'en' }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isBg = language === 'bg'

  const post = blogPosts.find(p => p.slug === slug)

  useEffect(() => {
    if (post) {
      document.title = `${isBg ? post.titleBg : post.title} · Finku`
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', isBg ? post.descriptionBg : post.description)
    } else {
      document.title = 'Post not found · Finku'
    }
  }, [post, isBg])

  if (!post) {
    return (
      <div style={{ background: '#0e0e0c', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', color: 'rgba(240,237,228,0.5)', gap: 16 }}>
        <div style={{ fontSize: 15 }}>Post not found.</div>
        <Link to="/blog" style={{ color: '#c8f03a', fontSize: 14, textDecoration: 'none' }}>← All articles</Link>
      </div>
    )
  }

  const content = isBg ? post.contentBg : post.content

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0e0e0c; }
        .bpost-page { font-family: 'DM Sans', sans-serif; background: #0e0e0c; color: #f0ede4; min-height: 100vh; }
        .bpost-nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.25rem 4rem; position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: rgba(14,14,12,0.88); backdrop-filter: blur(12px);
          border-bottom: 0.5px solid rgba(240,237,228,0.08);
        }
        .bpost-nav-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: #f0ede4; letter-spacing: -0.3px; text-decoration: none; }
        .bpost-nav-right { display: flex; gap: 10px; align-items: center; }
        .bpost-nav-ghost { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 7px 14px; border-radius: 8px; transition: color 0.15s; }
        .bpost-nav-ghost:hover { color: #f0ede4; }
        .bpost-nav-cta { background: #c8f03a; color: #0e0e0c; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; padding: 7px 16px; border-radius: 8px; transition: opacity 0.2s; }
        .bpost-nav-cta:hover { opacity: 0.88; }
        .bpost-content { max-width: 700px; margin: 0 auto; padding: 6rem 1.5rem 5rem; }
        @media (max-width: 640px) {
          .bpost-nav { padding: 1rem 1.25rem; }
          .bpost-nav-ghost { display: none; }
        }
      `}</style>

      <div className="bpost-page">
        <nav className="bpost-nav">
          <Link to="/" className="bpost-nav-logo">Finku</Link>
          <div className="bpost-nav-right">
            <button className="bpost-nav-ghost" onClick={() => navigate('/auth')}>Log in</button>
            <button className="bpost-nav-cta" onClick={() => navigate('/auth?mode=signup')}>Create free account</button>
          </div>
        </nav>

        <div className="bpost-content">
          <Link to="/blog" style={{ fontSize: 13, color: 'rgba(240,237,228,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem', transition: 'color 0.15s' }}
            onMouseOver={e => e.currentTarget.style.color = 'rgba(240,237,228,0.75)'}
            onMouseOut={e => e.currentTarget.style.color = 'rgba(240,237,228,0.4)'}
          >
            ← {isBg ? 'Всички статии' : 'All articles'}
          </Link>

          <div style={{ marginBottom: '0.75rem', fontSize: 12, color: 'rgba(240,237,228,0.3)', letterSpacing: 0.3 }}>
            {new Date(post.date).toLocaleDateString(isBg ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {post.readingTime} {isBg ? 'мин. четене' : 'min read'}
          </div>

          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 5vw, 42px)', letterSpacing: '-0.8px', lineHeight: 1.1, color: '#f0ede4', marginBottom: '2.5rem' }}>
            {isBg ? post.titleBg : post.title}
          </h1>

          <div>{renderMarkdown(content)}</div>

          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '0.5px solid rgba(240,237,228,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link to="/blog" style={{ fontSize: 13, color: 'rgba(240,237,228,0.4)', textDecoration: 'none' }}
              onMouseOver={e => e.currentTarget.style.color = 'rgba(240,237,228,0.7)'}
              onMouseOut={e => e.currentTarget.style.color = 'rgba(240,237,228,0.4)'}
            >
              ← {isBg ? 'Всички статии' : 'All articles'}
            </Link>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <Link to="/privacy" style={{ fontSize: 12, color: 'rgba(240,237,228,0.25)', textDecoration: 'none' }}>{isBg ? 'Поверителност' : 'Privacy'}</Link>
              <Link to="/terms" style={{ fontSize: 12, color: 'rgba(240,237,228,0.25)', textDecoration: 'none' }}>{isBg ? 'Условия' : 'Terms'}</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
