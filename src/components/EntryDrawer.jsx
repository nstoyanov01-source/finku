import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'
import { usePostHog } from '@posthog/react'

function fmtAmt(n) {
  return Math.round(n).toLocaleString('en-US')
}

function fmtDate(dateStr, language) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function EntryDrawer({ entry, type, language, onClose, onEdit, onDeleted }) {
  const lang = t[language]
  const [visible, setVisible] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const posthog = usePostHog()

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  async function handleDelete() {
    setDeleting(true)
    const table = type === 'income' ? 'income' : 'expenses'
    const { error } = await supabase.from(table).delete().eq('id', entry.id)
    if (error) { setDeleting(false); return }
    posthog?.capture(type === 'income' ? 'income_deleted' : 'expense_deleted', { source: 'drawer' })
    onDeleted()
  }

  const isIncome = type === 'income'
  const color = isIncome ? '#7ec95f' : '#e07070'
  const sign = isIncome ? '+' : '−'
  const categoryLabel = !isIncome && lang.categories[entry.category] ? lang.categories[entry.category] : null

  const overlayStyle = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 150,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.28s ease',
  }

  const drawerStyle = {
    position: 'fixed', top: 0, right: 0, height: '100%',
    width: 360,
    maxWidth: '100vw',
    background: '#161614',
    zIndex: 151,
    transform: visible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-8px 0 48px rgba(0,0,0,0.5)',
    borderLeft: '0.5px solid rgba(240,237,228,0.08)',
  }

  return (
    <>
      <style>{`
        .drawer-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(240,237,228,0.3); margin-bottom: 5px; }
        .drawer-value { font-size: 15px; color: #f0ede4; font-weight: 400; line-height: 1.5; }
        .drawer-field { margin-bottom: 1.25rem; }
        .drawer-action-btn {
          flex: 1; padding: 12px; border-radius: 10px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s;
        }
        .drawer-action-btn:hover { opacity: 0.85; }
        .drawer-edit-btn { background: rgba(240,237,228,0.08); color: #f0ede4; border: 1px solid rgba(240,237,228,0.12) !important; }
        .drawer-delete-btn { background: rgba(224,112,112,0.12); color: #e07070; border: 1px solid rgba(224,112,112,0.2) !important; }
        .drawer-confirm-delete-btn { background: #e07070; color: #fff; }
      `}</style>

      <div style={overlayStyle} onClick={close} />

      <div style={drawerStyle}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '0.5px solid rgba(240,237,228,0.07)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#f0ede4' }}>
              {isIncome ? lang.incomeLabel : lang.expensesLabel}
            </span>
          </div>
          <button
            onClick={close}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'rgba(240,237,228,0.4)', lineHeight: 1, padding: '2px 4px' }}
          >×</button>
        </div>

        {/* Amount hero */}
        <div style={{
          padding: '1.75rem 1.5rem 1.5rem',
          borderBottom: '0.5px solid rgba(240,237,228,0.07)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 32, fontWeight: 500, color, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
            {sign}{fmtAmt(entry.amount)} {lang.currency}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(240,237,228,0.4)', marginTop: 4 }}>
            {fmtDate(entry.date, language)}
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          <div className="drawer-field">
            <div className="drawer-label">{lang.description}</div>
            <div className="drawer-value">{entry.description}</div>
          </div>

          {isIncome && entry.client && (
            <div className="drawer-field">
              <div className="drawer-label">{lang.client}</div>
              <div className="drawer-value">{entry.client}</div>
            </div>
          )}

          {!isIncome && categoryLabel && (
            <div className="drawer-field">
              <div className="drawer-label">{lang.category}</div>
              <div className="drawer-value">{categoryLabel}</div>
            </div>
          )}

          <div className="drawer-field">
            <div className="drawer-label">{lang.date}</div>
            <div className="drawer-value">{fmtDate(entry.date, language)}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '0.5px solid rgba(240,237,228,0.07)',
          flexShrink: 0,
        }}>
          {confirmDelete ? (
            <div>
              <p style={{ fontSize: 13, color: 'rgba(240,237,228,0.55)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                {language === 'bg' ? 'Сигурни ли сте? Това не може да се отмени.' : 'Are you sure? This cannot be undone.'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="drawer-action-btn drawer-edit-btn" onClick={() => setConfirmDelete(false)}>
                  {lang.cancel}
                </button>
                <button className="drawer-action-btn drawer-confirm-delete-btn" onClick={handleDelete} disabled={deleting}>
                  {deleting ? '…' : lang.deleteEntry}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="drawer-action-btn drawer-edit-btn" onClick={onEdit}>
                {language === 'bg' ? 'Редактирай' : 'Edit'}
              </button>
              <button className="drawer-action-btn drawer-delete-btn" onClick={() => setConfirmDelete(true)}>
                {lang.deleteEntry}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
