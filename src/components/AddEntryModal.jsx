import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'
import { usePostHog } from '@posthog/react'

function translateDbError(msg) {
  if (!msg) return 'Something went wrong. Please try again.'
  if (msg.includes('duplicate') || msg.includes('unique')) return 'This entry already exists.'
  return 'Something went wrong. Please try again.'
}

export default function AddEntryModal({ type, userId, language, onClose, onSaved, onDeleted, initialData, entryId }) {
  const lang = t[language]
  const isEdit = !!entryId
  const submitting = useRef(false)
  const posthog = usePostHog()

  const [form, setForm] = useState(initialData ? {
    description: initialData.description || '',
    client: initialData.client || '',
    amount: String(initialData.amount || ''),
    date: initialData.date || new Date().toISOString().split('T')[0],
    category: initialData.category || 'other',
  } : {
    description: '',
    client: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'other',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave(force = false) {
    if (submitting.current) return
    const desc = form.description.trim()
    const amt = parseFloat(form.amount)

    if (!desc) { setError(lang.descriptionRequired); return }
    if (desc.length > 200) { setError('Description must be 200 characters or fewer.'); return }
    if (form.client.trim().length > 100) { setError('Client name must be 100 characters or fewer.'); return }
    if (!form.amount || isNaN(amt)) { setError(lang.descriptionRequired); return }
    if (amt < 0) { setError(lang.amountNegative); return }
    if (amt > 9999999) { setError(lang.amountTooLarge); return }

    if (!isEdit && !force) {
      const table = type === 'income' ? 'income' : 'expenses'
      const escaped = desc.replace(/%/g, '\\%').replace(/_/g, '\\_')
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .ilike('description', escaped)
        .eq('amount', amt)
        .eq('date', form.date)
      if (count > 0) { setShowDuplicateWarning(true); return }
    }

    setShowDuplicateWarning(false)
    submitting.current = true
    setLoading(true)
    setError('')
    const table = type === 'income' ? 'income' : 'expenses'

    if (isEdit) {
      const patch = type === 'income'
        ? { description: desc, client: form.client.trim(), amount: amt, date: form.date }
        : { description: desc, category: form.category, amount: amt, date: form.date }
      const { error } = await supabase.from(table).update(patch).eq('id', entryId)
      if (error) { setError(translateDbError(error.message)); setLoading(false); submitting.current = false; return }
      posthog?.capture('entry_updated', { type, amount: amt })
    } else {
      const payload = type === 'income'
        ? { user_id: userId, description: desc, client: form.client.trim(), amount: amt, date: form.date }
        : { user_id: userId, description: desc, category: form.category, amount: amt, date: form.date }
      const { error } = await supabase.from(table).insert(payload)
      if (error) { setError(translateDbError(error.message)); setLoading(false); submitting.current = false; return }
      posthog?.capture(type === 'income' ? 'income_added' : 'expense_added', {
        amount: amt,
        ...(type === 'expense' ? { category: form.category } : {}),
      })
    }

    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    const table = type === 'income' ? 'income' : 'expenses'
    const { error } = await supabase.from(table).delete().eq('id', entryId)
    if (error) { setError(translateDbError(error.message)); setLoading(false); submitting.current = false; return }
    posthog?.capture('entry_deleted', { type })
    if (onDeleted) onDeleted(); else onSaved()
    onClose()
  }

  const title = isEdit
    ? (type === 'income' ? lang.editIncome : lang.editExpense)
    : (type === 'income' ? lang.addIncome : lang.addExpense)

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: '1rem',
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'rgba(240,237,228,0.4)', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label className="label">{lang.description}</label>
            <input className="input-field" value={form.description} onChange={e => update('description', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder={type === 'income' ? 'Website project' : 'Adobe Creative Cloud'} maxLength={200} />
          </div>

          {type === 'income' && (
            <div>
              <label className="label">{lang.client}</label>
              <input className="input-field" value={form.client} onChange={e => update('client', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="Client name" maxLength={100} />
            </div>
          )}

          {type === 'expense' && (
            <div>
              <label className="label">{lang.category}</label>
              <select className="input-field" value={form.category} onChange={e => update('category', e.target.value)}>
                {Object.entries(lang.categories).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">{lang.amount}</label>
              <input className="input-field" type="number" min="0" max="9999999" step="0.01" value={form.amount} onChange={e => update('amount', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="1200.00" />
            </div>
            <div>
              <label className="label">{lang.date}</label>
              <input className="input-field" type="date" value={form.date} onChange={e => update('date', e.target.value)} />
            </div>
          </div>

          {error && <div style={{ fontSize: 13, color: '#e07070', background: 'rgba(224,112,112,0.1)', border: '1px solid rgba(224,112,112,0.2)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

          {showDuplicateWarning ? (
            <div>
              <div style={{
                background: 'rgba(200,240,58,0.08)', border: '0.5px solid rgba(200,240,58,0.3)',
                borderRadius: 8, padding: '10px 14px', fontSize: 13,
                color: 'rgba(240,237,228,0.7)', marginBottom: 10, lineHeight: 1.6,
              }}>
                {lang.duplicateWarning}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setShowDuplicateWarning(false)}>{lang.cancel}</button>
                <button className="btn-primary" onClick={() => handleSave(true)} disabled={loading}>
                  {loading ? lang.saving : lang.addAnyway}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 4 }}>
              {isEdit ? (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  style={{
                    background: 'none', border: '1px solid rgba(224,112,112,0.3)', color: '#e07070',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(224,112,112,0.08)'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  {lang.deleteEntry}
                </button>
              ) : <div />}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={onClose}>{lang.cancel}</button>
                <button className="btn-primary" onClick={handleSave} disabled={loading || !form.description || !form.amount}>
                  {loading ? (isEdit ? lang.updating : lang.saving) : (isEdit ? lang.update : lang.save)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
