import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'

export default function AddEntryModal({ type, userId, language, onClose, onSaved }) {
  const lang = t[language]
  const [form, setForm] = useState({
    description: '',
    client: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'other',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    if (!form.description || !form.amount || !form.date) return
    setLoading(true)
    setError('')
    const table = type === 'income' ? 'income' : 'expenses'
    const payload = type === 'income'
      ? { user_id: userId, description: form.description, client: form.client, amount: parseFloat(form.amount), date: form.date }
      : { user_id: userId, description: form.description, category: form.category, amount: parseFloat(form.amount), date: form.date }

    const { error } = await supabase.from(table).insert(payload)
    if (error) { setError(error.message); setLoading(false); return }
    onSaved()
    onClose()
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: '1rem',
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>
            {type === 'income' ? lang.addIncome : lang.addExpense}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label className="label">{lang.description}</label>
            <input className="input-field" value={form.description} onChange={e => update('description', e.target.value)} placeholder={type === 'income' ? 'Website project' : 'Adobe Creative Cloud'} />
          </div>

          {type === 'income' && (
            <div>
              <label className="label">{lang.client}</label>
              <input className="input-field" value={form.client} onChange={e => update('client', e.target.value)} placeholder="Client name" />
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
              <input className="input-field" type="number" min="0" step="0.01" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="1200.00" />
            </div>
            <div>
              <label className="label">{lang.date}</label>
              <input className="input-field" type="date" value={form.date} onChange={e => update('date', e.target.value)} />
            </div>
          </div>

          {error && <div style={{ fontSize: 13, color: '#b91c1c', background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn-secondary" onClick={onClose}>{lang.cancel}</button>
            <button className="btn-primary" onClick={handleSave} disabled={loading || !form.description || !form.amount}>
              {loading ? lang.saving : lang.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
