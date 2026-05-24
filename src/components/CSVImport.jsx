import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'

function parseRevolutCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('started'))
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('reference') || h.includes('beneficiary'))
  const amountIdx = headers.findIndex(h => h === 'amount' || h.includes('amount'))

  if (dateIdx === -1 || amountIdx === -1) return null

  const entries = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim())
    if (!cols[amountIdx]) continue
    const amount = parseFloat(cols[amountIdx])
    if (isNaN(amount) || amount === 0) continue
    const rawDate = cols[dateIdx]
    const date = rawDate.includes(' ') ? rawDate.split(' ')[0] : rawDate
    const description = descIdx !== -1 ? cols[descIdx] : 'Imported entry'
    entries.push({ amount, date, description })
  }
  return entries
}

export default function CSVImport({ userId, language, onImported }) {
  const lang = t[language]
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setStatus('')
    setError('')

    const text = await file.text()
    const entries = parseRevolutCSV(text)

    if (!entries) { setError(lang.csvError); return }

    const incomeRows = entries.filter(e => e.amount > 0).map(e => ({
      user_id: userId, description: e.description, client: '', amount: e.amount, date: e.date,
    }))
    const expenseRows = entries.filter(e => e.amount < 0).map(e => ({
      user_id: userId, description: e.description, category: 'other', amount: Math.abs(e.amount), date: e.date,
    }))

    let count = 0
    if (incomeRows.length) { await supabase.from('income').insert(incomeRows); count += incomeRows.length }
    if (expenseRows.length) { await supabase.from('expenses').insert(expenseRows); count += expenseRows.length }

    setStatus(lang.csvSuccess(count))
    onImported()
    e.target.value = ''
  }

  return (
    <div style={{ borderTop: '1px solid #eae9e3', marginTop: '1rem', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
      <span style={{ fontSize: 12, color: '#888', flex: 1 }}>{lang.csvImport}</span>
      <label style={{
        fontSize: 12, border: '1px solid #ddd', borderRadius: 8, padding: '5px 12px',
        cursor: 'pointer', color: '#444', background: '#fff', whiteSpace: 'nowrap',
        transition: 'background 0.15s',
      }}>
        {lang.uploadFile}
        <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      {status && <span style={{ fontSize: 12, color: '#15803d', width: '100%' }}>{status}</span>}
      {error && <span style={{ fontSize: 12, color: '#b91c1c', width: '100%' }}>{error}</span>}
    </div>
  )
}
