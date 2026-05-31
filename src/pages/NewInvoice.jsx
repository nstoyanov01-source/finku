import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', BGN: 'лв.' }

function fmtInvoiceDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NewInvoice({ session, language, onLanguageChange }) {
  const navigate = useNavigate()
  const userId = session.user.id
  const isBg = language === 'bg'

  const [yourName, setYourName] = useState('')
  const [yourAddress, setYourAddress] = useState('')
  const [yourTaxId, setYourTaxId] = useState('')
  const [yourEmail, setYourEmail] = useState(session.user.email || '')
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('1')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'New Invoice · Finku'
    supabase.from('profiles').select('first_name').eq('id', userId).single()
      .then(({ data }) => { if (data?.first_name) setYourName(data.first_name) })
    supabase.from('invoices').select('invoice_number').eq('user_id', userId)
      .order('invoice_number', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setInvoiceNumber(String((data?.invoice_number || 0) + 1)))
  }, [])

  async function handleGenerate() {
    if (!yourName.trim() || !clientName.trim() || !serviceDescription.trim() || !amount) {
      setError(isBg ? 'Попълнете всички задължителни полета.' : 'Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')

    const { error: invErr } = await supabase.from('invoices').insert({
      user_id: userId,
      invoice_number: parseInt(invoiceNumber) || 1,
      client_name: clientName.trim(),
      client_address: clientAddress.trim(),
      client_email: clientEmail.trim(),
      service_description: serviceDescription.trim(),
      amount: parseFloat(amount),
      currency,
      date: invoiceDate,
      due_date: dueDate || null,
      notes: notes.trim(),
      status: 'sent',
    })
    if (invErr) { setError(invErr.message); setLoading(false); return }

    await supabase.from('income').insert({
      user_id: userId,
      description: `${clientName.trim()} — ${serviceDescription.trim()}`.slice(0, 200),
      client: clientName.trim().slice(0, 100),
      amount: parseFloat(amount),
      date: invoiceDate,
    })

    setLoading(false)
    window.print()
  }

  const sym = CURRENCY_SYMBOLS[currency] || currency
  const numStr = parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const invNumStr = String(invoiceNumber).padStart(3, '0')

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid rgba(240,237,228,0.1)',
    borderRadius: 10, background: 'rgba(240,237,228,0.04)',
    color: '#f0ede4', fontFamily: 'DM Sans, sans-serif', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }
  const textareaStyle = { ...inputStyle, resize: 'vertical', lineHeight: 1.6 }
  const labelStyle = { display: 'block', fontSize: 12, color: 'rgba(240,237,228,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <>
      <style>{`
        .inv-page { min-height: 100vh; background: #0e0e0c; font-family: 'DM Sans', sans-serif; padding-top: 60px; }
        .inv-nav { display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; height: 60px; position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(14,14,12,0.9); backdrop-filter: blur(12px); border-bottom: 0.5px solid rgba(240,237,228,0.08); }
        .inv-nav-logo { font-family: 'Instrument Serif', serif; font-size: 20px; color: #f0ede4; letter-spacing: -0.3px; }
        .inv-nav-right { display: flex; align-items: center; gap: 8px; }
        .inv-nav-btn { background: none; border: none; color: rgba(240,237,228,0.6); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: color 0.15s; }
        .inv-nav-btn:hover { color: #f0ede4; background: rgba(240,237,228,0.06); }
        .inv-content { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }
        .inv-heading { font-family: 'Instrument Serif', serif; font-size: 32px; color: #f0ede4; letter-spacing: -0.5px; margin-bottom: 2rem; }
        .inv-section { background: #161614; border: 1px solid rgba(240,237,228,0.08); border-radius: 14px; padding: 1.5rem; margin-bottom: 1rem; }
        .inv-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(240,237,228,0.3); margin-bottom: 1.25rem; }
        .inv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .inv-field { margin-bottom: 1rem; }
        .inv-field:last-child { margin-bottom: 0; }
        .inv-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .inv-lang-select { font-size: 13px; border: 1px solid rgba(240,237,228,0.12); border-radius: 8px; padding: 5px 10px; background: rgba(240,237,228,0.06); color: rgba(240,237,228,0.7); cursor: pointer; outline: none; font-family: 'DM Sans', sans-serif; color-scheme: dark; }
        .inv-currency-select { padding: 10px 14px; border: 1px solid rgba(240,237,228,0.1); border-radius: 10px; background: rgba(240,237,228,0.04); color: #f0ede4; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; color-scheme: dark; }
        .inv-error { background: rgba(224,112,112,0.1); border: 1px solid rgba(224,112,112,0.2); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #e07070; margin-bottom: 1rem; }

        /* Print styles */
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { margin: 0; size: A4; }
        }
        @media (max-width: 640px) {
          .inv-grid { grid-template-columns: 1fr; }
          .inv-row { grid-template-columns: 1fr; }
          .inv-nav { padding: 0 1rem; }
          .inv-content { padding: 1.5rem 1rem 4rem; }
        }
      `}</style>

      <div className="no-print">
        <nav className="inv-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="inv-nav-logo">Finku</div>
            <button className="inv-nav-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          </div>
          <div className="inv-nav-right">
            <select
              className="inv-lang-select"
              value={language}
              onChange={async e => {
                const l = e.target.value
                await supabase.from('profiles').update({ language: l }).eq('id', userId)
                onLanguageChange(l)
              }}
            >
              <option value="en">EN</option>
              <option value="bg">БГ</option>
            </select>
            <button className="inv-nav-btn" onClick={() => navigate('/profile')}>Profile</button>
            <button
              className="inv-nav-btn"
              style={{ border: '1px solid rgba(240,237,228,0.12)' }}
              onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
            >
              {isBg ? 'Изход' : 'Log out'}
            </button>
          </div>
        </nav>

        <div className="inv-content">
          <h1 className="inv-heading">{isBg ? 'Нова фактура' : 'New Invoice'}</h1>

          {error && <div className="inv-error">{error}</div>}

          <div className="inv-grid" style={{ marginBottom: '1rem' }}>
            {/* Your details */}
            <div className="inv-section">
              <div className="inv-section-title">{isBg ? 'Вашите данни' : 'Your details'}</div>
              <div className="inv-field">
                <label style={labelStyle}>{isBg ? 'Вашето име *' : 'Your name *'}</label>
                <input style={inputStyle} value={yourName} onChange={e => setYourName(e.target.value)} placeholder="Nikola Stoyanov" />
              </div>
              <div className="inv-field">
                <label style={labelStyle}>{isBg ? 'Адрес' : 'Your address'}</label>
                <textarea style={textareaStyle} rows={2} value={yourAddress} onChange={e => setYourAddress(e.target.value)} placeholder="ul. Sava Radulov 3&#10;Varna 9002, Bulgaria" />
              </div>
              <div className="inv-field">
                <label style={labelStyle}>EGN / EIK</label>
                <input style={inputStyle} value={yourTaxId} onChange={e => setYourTaxId(e.target.value)} placeholder="9XXXXXXXXX" />
              </div>
              <div className="inv-field">
                <label style={labelStyle}>{isBg ? 'Имейл' : 'Your email'}</label>
                <input style={inputStyle} type="email" value={yourEmail} onChange={e => setYourEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>

            {/* Client details */}
            <div className="inv-section">
              <div className="inv-section-title">{isBg ? 'Данни на клиента' : 'Client details'}</div>
              <div className="inv-field">
                <label style={labelStyle}>{isBg ? 'Клиент *' : 'Client name *'}</label>
                <input style={inputStyle} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Ltd." />
              </div>
              <div className="inv-field">
                <label style={labelStyle}>{isBg ? 'Адрес на клиента' : 'Client address'}</label>
                <textarea style={textareaStyle} rows={2} value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="123 Main Street&#10;London EC1A 1BB, UK" />
              </div>
              <div className="inv-field">
                <label style={labelStyle}>{isBg ? 'Имейл на клиента' : 'Client email'}</label>
                <input style={inputStyle} type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="billing@client.com" />
              </div>
            </div>
          </div>

          {/* Invoice details */}
          <div className="inv-section">
            <div className="inv-section-title">{isBg ? 'Детайли на фактурата' : 'Invoice details'}</div>
            <div className="inv-row" style={{ marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>{isBg ? 'Номер на фактурата' : 'Invoice number'}</label>
                <input style={inputStyle} type="number" min="1" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>{isBg ? 'Дата' : 'Invoice date'}</label>
                <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>{isBg ? 'Падеж (по избор)' : 'Due date (optional)'}</label>
              <input style={{ ...inputStyle, colorScheme: 'dark', maxWidth: 200 }} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>{isBg ? 'Описание на услугата *' : 'Service description *'}</label>
              <textarea style={textareaStyle} rows={3} value={serviceDescription} onChange={e => setServiceDescription(e.target.value)} placeholder={isBg ? 'Уеб разработка — м. май 2026' : 'Web development — May 2026'} />
            </div>
            <div className="inv-row">
              <div>
                <label style={labelStyle}>{isBg ? 'Сума *' : 'Amount *'}</label>
                <input style={inputStyle} type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1200.00" />
              </div>
              <div>
                <label style={labelStyle}>{isBg ? 'Валута' : 'Currency'}</label>
                <select className="inv-currency-select" style={{ width: '100%' }} value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="EUR">EUR — €</option>
                  <option value="USD">USD — $</option>
                  <option value="GBP">GBP — £</option>
                  <option value="BGN">BGN — лв.</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>{isBg ? 'Бележки / детайли за плащане' : 'Notes / payment details'}</label>
              <textarea style={textareaStyle} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={isBg ? 'IBAN: BG...  BIC: XXXXX' : 'IBAN: BG...  BIC: XXXXX'} />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', background: '#c8f03a', color: '#0e0e0c',
              border: 'none', borderRadius: 12, fontFamily: 'DM Sans, sans-serif',
              fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? '…' : (isBg ? '↓ Генерирай фактура (PDF)' : '↓ Generate Invoice (PDF)')}
          </button>
          <p style={{ fontSize: 12, color: 'rgba(240,237,228,0.3)', textAlign: 'center', marginTop: '0.75rem' }}>
            {isBg ? 'Фактурата ще се добави автоматично в приходите.' : 'The invoice will be automatically added to your income.'}
          </p>
        </div>
      </div>

      {/* Printable invoice — hidden on screen, shown only when printing */}
      <div className="print-only" id="invoice-pdf">
        <div style={{ fontFamily: 'Georgia, serif', color: '#111', background: '#fff', minHeight: '297mm', padding: '12mm 18mm', boxSizing: 'border-box' }}>
          {/* Accent bar */}
          <div style={{ height: 4, background: '#c8f03a', marginBottom: 40 }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, color: '#111', fontFamily: 'Georgia, serif' }}>
                INVOICE
              </div>
              <div style={{ fontSize: 14, color: '#666', marginTop: 4, fontFamily: 'Arial, sans-serif' }}>
                No. {invNumStr}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ fontSize: 13, color: '#444' }}>Date: {fmtInvoiceDate(invoiceDate)}</div>
              {dueDate && <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>Due: {fmtInvoiceDate(dueDate)}</div>}
            </div>
          </div>

          {/* From / To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40, fontFamily: 'Arial, sans-serif' }}>
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', marginBottom: 8 }}>From</div>
              {yourName && <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>{yourName}</div>}
              {yourAddress && <div style={{ fontSize: 12, color: '#555', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{yourAddress}</div>}
              {yourTaxId && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>EGN/EIK: {yourTaxId}</div>}
              {yourEmail && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{yourEmail}</div>}
            </div>
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', marginBottom: 8 }}>To</div>
              {clientName && <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>{clientName}</div>}
              {clientAddress && <div style={{ fontSize: 12, color: '#555', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{clientAddress}</div>}
              {clientEmail && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{clientEmail}</div>}
            </div>
          </div>

          {/* Service table */}
          <div style={{ borderTop: '1px solid #ddd', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999' }}>Description</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', textAlign: 'right' }}>Amount</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', padding: '16px 0', borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: 14, color: '#111', lineHeight: 1.5 }}>{serviceDescription}</div>
              <div style={{ fontSize: 14, color: '#111', textAlign: 'right' }}>{numStr} {currency}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', padding: '14px 0', borderBottom: '2px solid #111' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Total</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111', textAlign: 'right' }}>{numStr} {currency}</div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div style={{ marginTop: 32, fontFamily: 'Arial, sans-serif' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#999', marginBottom: 8 }}>Notes</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 60, paddingTop: 16, borderTop: '1px solid #eee', fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#bbb', textAlign: 'center' }}>
            Generated by Finku · finku.eu
          </div>
        </div>
      </div>
    </>
  )
}
