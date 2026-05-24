import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'
import AddEntryModal from '../components/AddEntryModal'
import CSVImport from '../components/CSVImport'

function greeting(lang) {
  const h = new Date().getHours()
  if (h < 12) return lang.goodMorning
  if (h < 18) return lang.goodAfternoon
  return lang.goodEvening
}

function fmt(n) {
  return Math.round(n).toLocaleString('bg-BG')
}

function calcTax(grossIncome, monthsActive) {
  const taxableIncome = grossIncome * 0.75
  const ddfl = taxableIncome * 0.15
  const insurancePerMonth = 145
  const insurance = insurancePerMonth * Math.max(1, monthsActive)
  return { ddfl: Math.round(ddfl), insurance: Math.round(insurance), total: Math.round(ddfl + insurance) }
}

export default function Dashboard({ session, language, onLanguageChange }) {
  const lang = t[language]
  const userId = session.user.id
  const currentYear = new Date().getFullYear()

  const [income, setIncome] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [balance, setBalance] = useState('')
  const [showBalanceInput, setShowBalanceInput] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: inc }, { data: exp }] = await Promise.all([
      supabase.from('income').select('*').eq('user_id', userId)
        .gte('date', `${currentYear}-01-01`).order('date', { ascending: false }),
      supabase.from('expenses').select('*').eq('user_id', userId)
        .gte('date', `${currentYear}-01-01`).order('date', { ascending: false }),
    ])
    setIncome(inc || [])
    setExpenses(exp || [])
    setLoading(false)
  }

  const totalIncome = income.reduce((s, r) => s + Number(r.amount), 0)
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0)
  const netIncome = totalIncome - totalExpenses
  const currentMonth = new Date().getMonth() + 1
  const avgMonthly = currentMonth > 0 ? totalIncome / currentMonth : 0

  const tax = calcTax(totalIncome, currentMonth)
  const balanceNum = parseFloat(balance) || 0
  const hasEnough = balanceNum >= tax.total

  const monthlyData = Array.from({ length: currentMonth }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    const inc = income.filter(r => r.date.startsWith(`${currentYear}-${m}`)).reduce((s, r) => s + Number(r.amount), 0)
    const exp = expenses.filter(r => r.date.startsWith(`${currentYear}-${m}`)).reduce((s, r) => s + Number(r.amount), 0)
    return { inc, exp }
  })

  const maxBar = Math.max(...monthlyData.map(d => Math.max(d.inc, d.exp)), 1)

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.3px' }}>
              {greeting(lang)}<span style={{ color: '#bbb' }}> ·</span> Finku
            </h1>
            <p style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{lang.overview} · {currentYear}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={language}
              onChange={async e => {
                const l = e.target.value
                await supabase.from('profiles').update({ language: l }).eq('id', userId)
                onLanguageChange(l)
              }}
              style={{ fontSize: 13, border: '1px solid #ddd', borderRadius: 8, padding: '5px 10px', background: '#fff', color: '#444', cursor: 'pointer' }}
            >
              <option value="en">EN</option>
              <option value="bg">БГ</option>
            </select>
            <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: 13, padding: '6px 14px' }}>
              {lang.logout}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>…</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
              {[
                { label: lang.totalIncome, value: `${fmt(totalIncome)} ${lang.currency}`, color: '#166534' },
                { label: lang.totalExpenses, value: `${fmt(totalExpenses)} ${lang.currency}`, color: '#991b1b' },
                { label: lang.netIncome, value: `${fmt(netIncome)} ${lang.currency}`, color: '#1a1a1a' },
                { label: lang.avgMonthly, value: `${fmt(avgMonthly)} ${lang.currency}`, color: '#92400e' },
              ].map((k, i) => (
                <div key={i} style={{ background: '#ebebе5', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{lang.soFar} {currentYear}</div>
                </div>
              ))}
            </div>

            {/* Tax Banner */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{lang.taxEstimate}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2, maxWidth: 340 }}>{lang.taxDesc}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#888' }}>{lang.ddfl}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{fmt(tax.ddfl)} {lang.currency}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888' }}>{lang.insurance}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>~{fmt(tax.insurance)} {lang.currency}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888' }}>{lang.totalOwed}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#92400e', marginTop: 2 }}>~{fmt(tax.total)} {lang.currency}</div>
                  </div>
                  <div>
                    {showBalanceInput ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          className="input-field"
                          type="number"
                          value={balance}
                          onChange={e => setBalance(e.target.value)}
                          placeholder="0"
                          style={{ width: 100, padding: '6px 10px', fontSize: 13 }}
                          autoFocus
                          onBlur={() => setShowBalanceInput(false)}
                        />
                        <span style={{ fontSize: 12, color: '#888' }}>{lang.currency}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowBalanceInput(true)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500,
                          padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: hasEnough && balance ? '#dcfce7' : balance ? '#fef3c7' : '#f3f4f6',
                          color: hasEnough && balance ? '#166534' : balance ? '#92400e' : '#666',
                        }}
                      >
                        {balance
                          ? (hasEnough ? '✓ ' + lang.setAsideOk : '⚠ ' + lang.setAsideWarn)
                          : '+ Set current balance'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Income + Expenses columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                { type: 'income', label: lang.recentIncome, data: income.slice(0, 5), addLabel: lang.addIncome, emptyMsg: lang.noIncome, color: '#166534', bg: '#f0fdf4', dot: '#22c55e' },
                { type: 'expense', label: lang.recentExpenses, data: expenses.slice(0, 5), addLabel: lang.addExpense, emptyMsg: lang.noExpenses, color: '#991b1b', bg: '#fef2f2', dot: '#ef4444' },
              ].map(col => (
                <div key={col.type} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{col.label}</span>
                    <button
                      className="btn-primary"
                      onClick={() => setModal(col.type)}
                      style={{ padding: '5px 12px', fontSize: 12 }}
                    >
                      + {col.addLabel}
                    </button>
                  </div>

                  {col.data.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '1.5rem 0' }}>{col.emptyMsg}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {col.data.map(row => (
                        <div key={row.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafaf8', borderRadius: 9, padding: '8px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{row.description}</div>
                              <div style={{ fontSize: 11, color: '#aaa' }}>{row.date}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: col.color, flexShrink: 0, marginLeft: 8 }}>
                            {col.type === 'income' ? '+' : '-'}{fmt(row.amount)} {lang.currency}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <CSVImport userId={userId} language={language} onImported={fetchData} />
                </div>
              ))}
            </div>

            {/* Bar Chart */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{lang.chartTitle}</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  {[{ color: '#86efac', label: lang.incomeLabel }, { color: '#fca5a5', label: lang.expensesLabel }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                {monthlyData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, background: '#86efac', borderRadius: '3px 3px 0 0', height: `${(d.inc / maxBar) * 100}%`, minHeight: d.inc > 0 ? 3 : 0 }} />
                    <div style={{ flex: 1, background: '#fca5a5', borderRadius: '3px 3px 0 0', height: `${(d.exp / maxBar) * 100}%`, minHeight: d.exp > 0 ? 3 : 0 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {monthlyData.map((_, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#aaa' }}>
                    {lang.months[i]}
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', borderTop: '1px solid #eae9e3', paddingTop: '1rem' }}>
              {lang.disclaimer}
            </p>
          </>
        )}
      </div>

      {modal && (
        <AddEntryModal
          type={modal}
          userId={userId}
          language={language}
          onClose={() => setModal(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}
