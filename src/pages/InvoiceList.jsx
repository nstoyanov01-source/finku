import { useEffect, useState } from 'react'
import { useLanguage } from '../lib/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', BGN: 'лв.' }

export default function InvoiceList({ session }) {
  const { language } = useLanguage()
  const isBg = language === 'bg'
  const navigate = useNavigate()
  const userId = session.user.id

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = isBg ? 'Фактури · Finku' : 'Invoices · Finku'
    supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setLoading(false) })
  }, [])

  const total = invoices.reduce((s, inv) => s + (inv.currency === 'EUR' ? Number(inv.amount) : 0), 0)

  return (
    <>
      <style>{`
        .inv-list-page { min-height: 100vh; background: #0e0e0c; padding-top: 60px; font-family: 'DM Sans', sans-serif; }
        .inv-list-nav { display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; height: 60px; position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(14,14,12,0.9); backdrop-filter: blur(12px); border-bottom: 0.5px solid rgba(240,237,228,0.08); }
        .inv-list-back { background: none; border: none; color: rgba(240,237,228,0.5); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: color 0.15s, background 0.15s; }
        .inv-list-back:hover { color: #f0ede4; background: rgba(240,237,228,0.06); }
        .inv-list-content { max-width: 700px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }
        .inv-row { display: flex; align-items: center; justify-content: space-between; background: #161614; border-radius: 8px; padding: 14px 16px; margin-bottom: 6px; gap: 12px; }
        .inv-row-left { min-width: 0; flex: 1; }
        .inv-row-num { font-size: 11px; color: rgba(240,237,228,0.3); margin-bottom: 3px; }
        .inv-row-client { font-size: 13px; font-weight: 500; color: #f0ede4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inv-row-desc { font-size: 11px; color: rgba(240,237,228,0.3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inv-row-right { text-align: right; flex-shrink: 0; }
        .inv-row-amount { font-size: 14px; font-weight: 500; color: '#c8f03a'; font-variant-numeric: tabular-nums; }
        .inv-row-date { font-size: 11px; color: rgba(240,237,228,0.3); margin-top: 2px; }
        @media (max-width: 640px) {
          .inv-list-nav { padding: 0 1rem; }
          .inv-list-content { padding: 1.5rem 1rem 4rem; }
        }
      `}</style>

      <div className="inv-list-page">
        <nav className="inv-list-nav">
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#f0ede4', letterSpacing: '-0.3px' }}>Finku</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LanguageToggle />
            <button className="inv-list-back" onClick={() => navigate('/dashboard')}>
              {isBg ? '← Начало' : '← Dashboard'}
            </button>
          </div>
        </nav>

        <div className="inv-list-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: '#f0ede4', letterSpacing: '-0.5px' }}>
              {isBg ? 'Фактури' : 'Invoices'}
            </h1>
            <button
              onClick={() => navigate('/invoice/new')}
              style={{ background: '#c8f03a', color: '#0e0e0c', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
            >
              + {isBg ? 'Нова фактура' : 'New invoice'}
            </button>
          </div>

          {!loading && invoices.length > 0 && total > 0 && (
            <div style={{ fontSize: 22, fontWeight: 600, color: '#c8f03a', letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', marginBottom: '1.75rem' }}>
              +{fmt(total)} € {isBg ? 'общо (EUR)' : 'total (EUR)'}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(240,237,228,0.3)', fontSize: 13 }}>…</div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div style={{ fontSize: 14, color: 'rgba(240,237,228,0.25)', marginBottom: '1rem' }}>
                {isBg ? 'Все още няма фактури' : 'No invoices yet'}
              </div>
              <button
                onClick={() => navigate('/invoice/new')}
                style={{ background: 'rgba(200,240,58,0.1)', border: '1px solid rgba(200,240,58,0.2)', color: '#c8f03a', fontFamily: 'DM Sans, sans-serif', fontSize: 13, padding: '9px 18px', borderRadius: 8, cursor: 'pointer' }}
              >
                {isBg ? 'Създай първата си фактура' : 'Create your first invoice'}
              </button>
            </div>
          ) : (
            invoices.map(inv => (
              <div key={inv.id} className="inv-row">
                <div className="inv-row-left">
                  <div className="inv-row-num">#{String(inv.invoice_number).padStart(3, '0')}</div>
                  <div className="inv-row-client">{inv.client_name}</div>
                  {inv.service_description && (
                    <div className="inv-row-desc">{inv.service_description}</div>
                  )}
                </div>
                <div className="inv-row-right">
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#c8f03a', fontVariantNumeric: 'tabular-nums' }}>
                    {CURRENCY_SYMBOLS[inv.currency] || inv.currency}{fmt(inv.amount)}
                  </div>
                  <div className="inv-row-date">{fmtDate(inv.date)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
