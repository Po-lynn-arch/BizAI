import '../CSS/DataEntry.css'
import { useState, useEffect } from 'react'
import { Sidebar } from '../../components/Sidebar'
import { API_URL } from '../../hooks/config'

export function OperationalExpenses() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [data, setData] = useState([])
  const [item, setItem] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [isFixed, setIsFixed] = useState(true)
  const [todayProfit, setTodayProfit] = useState(0)
  const [saving, setSaving] = useState(false)

  function loadData() {
    Promise.all([
      fetch(`${API_URL}/api/operational-expenses?user_id=${user.id}`).then(r => r.json()),
      fetch(`${API_URL}/api/summary?user_id=${user.id}`).then(r => r.json())
    ]).then(([expensesData, summaryData]) => {
      setData(Array.isArray(expensesData) ? expensesData : [])
      setTodayProfit(summaryData.today_profit || 0)
    }).catch(() => setData([]))
  }

  useEffect(() => { loadData() }, [])

  async function addExpense() {
    if (!item || !amount) { alert('Please fill in all fields'); return }
    if (Number(amount) <= 0) { alert('Amount must be greater than zero'); return }

    // ✅ Optimistic update — add to UI instantly
    const tempExpense = {
      id: `temp_${Date.now()}`,
      user_id: user.id,
      item,
      amount: Number(amount),
      frequency,
      is_fixed: isFixed,
      date: new Date().toLocaleDateString()
    }
    setData(prev => [tempExpense, ...prev])
    setItem(''); setAmount('')
    setSaving(true)

    try {
      await fetch(`${API_URL}/api/operational-expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id, item,
          amount: Number(amount),
          frequency,
          is_fixed: isFixed,
          date: new Date().toLocaleDateString()
        })
      })
      // Refresh to get real id from backend
      loadData()
    } catch {
      // Revert if failed
      setData(prev => prev.filter(d => d.id !== tempExpense.id))
      alert('Failed to save expense. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteExpense(id) {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    await fetch(`${API_URL}/api/operational-expenses/${id}`, { method: 'DELETE' })
    loadData()
  }

  const totalMonthly = data.reduce((sum, d) => {
    if (d.frequency === 'daily') return sum + (d.amount * 30)
    if (d.frequency === 'weekly') return sum + (d.amount * 4)
    if (d.frequency === 'once') return sum + d.amount
    return sum + d.amount // monthly
  }, 0)

  const getDailyAmount = (amount, frequency) => {
    if (frequency === 'daily') return amount
    if (frequency === 'weekly') return amount / 7
    if (frequency === 'monthly') return amount / 30
    if (frequency === 'once') return 0 // one time cost has no daily impact
    return amount / 30
  }

  const fixedExpenses = data.filter(d => d.is_fixed)
  const variableExpenses = data.filter(d => !d.is_fixed)
  const totalDailyCost = data.reduce((sum, d) => sum + getDailyAmount(d.amount, d.frequency), 0)
  

  const breakEvenGap = totalDailyCost - todayProfit
  const progressPercent = totalDailyCost > 0 ? Math.min((todayProfit / totalDailyCost) * 100, 100) : 0

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>🏠 Operational Expenses</h2>
            <p>Track your running costs and daily break-even target</p>
          </div>
        </header>

        {data.length > 0 && (
          <div style={{
            background: breakEvenGap <= 0 ? '#0d2b1f' : '#1a1400',
            border: `1px solid ${breakEvenGap <= 0 ? '#10B981' : '#F97316'}`,
            borderRadius: '12px', padding: '20px', marginBottom: '24px'
          }}>
            <h3 style={{ color: breakEvenGap <= 0 ? '#10B981' : '#F97316', marginBottom: '8px' }}>
              {breakEvenGap <= 0 ? '✅ Expenses covered today!' : '⏳ Working towards break-even'}
            </h3>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>
              Daily running costs: <strong style={{ color: '#F97316' }}>KES {totalDailyCost.toFixed(0)}</strong>.
              Today's profit: <strong style={{ color: todayProfit >= 0 ? '#10B981' : '#aaa' }}>KES {todayProfit.toFixed(0)}</strong>.
              {breakEvenGap <= 0
                ? ` You are KES ${Math.abs(breakEvenGap).toFixed(0)} above break-even. Great work!`
                : ` You need KES ${breakEvenGap.toFixed(0)} more profit to cover today's costs.`}
            </p>
            <div style={{ background: '#2a2a2a', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPercent}%`,
                background: progressPercent >= 100 ? '#10B981' : '#F97316',
                borderRadius: '999px', transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#666' }}>KES 0</span>
              <span style={{ fontSize: '11px', color: progressPercent >= 100 ? '#10B981' : '#F97316', fontWeight: '600' }}>
                {progressPercent.toFixed(0)}% covered
              </span>
              <span style={{ fontSize: '11px', color: '#666' }}>KES {totalDailyCost.toFixed(0)}</span>
            </div>
          </div>
        )}

        <div className="feature-cards" style={{ marginBottom: '24px' }}>
          <div className="card">
            <div className="card-icon">📅</div>
            <p className="card-label">Daily Cost</p>
            <p className="card-value" style={{ color: '#F97316' }}>KES {totalDailyCost.toFixed(0)}</p>
            <p style={{ fontSize: '11px', color: '#666' }}>Must earn this daily to break even</p>
          </div>
          <div className="card">
            <div className="card-icon">📆</div>
            <p className="card-label">Monthly Cost</p>
            <p className="card-value" style={{ color: '#8B5CF6' }}>KES {totalMonthly.toLocaleString()}</p>
            <p style={{ fontSize: '11px', color: '#666' }}>Total recorded expenses</p>
          </div>
          <div className="card">
            <div className="card-icon">🎯</div>
            <p className="card-label">Today's Profit</p>
            <p className="card-value" style={{ color: todayProfit >= 0 ? '#10B981' : '#F97316' }}>
              KES {todayProfit.toFixed(0)}
            </p>
            <p style={{ fontSize: '11px', color: '#666' }}>From today's sales</p>
          </div>
        </div>

        <div className="entry-form">

          {frequency !== 'once' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setIsFixed(true)} style={{
                flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                background: isFixed ? '#ff4444' : 'transparent',
                color: isFixed ? '#fff' : '#aaa',
                border: isFixed ? 'none' : '1px solid #2a2a2a'
              }}>🏠 Fixed (same every time)</button>
              <button onClick={() => setIsFixed(false)} style={{
                flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                background: !isFixed ? '#FFA500' : 'transparent',
                color: !isFixed ? '#fff' : '#aaa',
                border: !isFixed ? 'none' : '1px solid #2a2a2a'
              }}>🚗 Variable (changes)</button>
            </div>
          )}
          <div style={{
            background: isFixed ? '#1a0e00' : '#120d1a',
            border: `1px solid ${isFixed ? '#F97316' : '#8B5CF6'}`,
            borderRadius: '8px', padding: '12px', marginBottom: '16px',
            color: isFixed ? '#F97316' : '#8B5CF6', fontSize: '13px'
          }}>
            {isFixed
              ? '🏠 Fixed costs are the same every month — rent, electricity, salaries, insurance.'
              : '🚗 Variable costs change day to day — transport, airtime, packaging, casual labour.'}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Expense Name</label>
              <input
                placeholder={isFixed ? 'e.g. Shop Rent' : 'e.g. Transport to market'}
                value={item} onChange={e => setItem(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Amount (KES)</label>
              <input type="number" placeholder="e.g. 15000"
                value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="form-field">
              <label>How often?</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)}>
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
                <option value="once">One time only</option>
              </select>
            </div>
          </div>

          {amount && (
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '12px' }}>
              Daily impact: <strong style={{ color: isFixed ? '#F97316' : '#8B5CF6' }}>
                KES {getDailyAmount(Number(amount), frequency).toFixed(0)}/day
              </strong>
            </p>
          )}

          <button className="add-btn" style={{
            background: saving ? '#555' : isFixed ? '#F97316' : '#8B5CF6',
            width: '100%'
          }} onClick={addExpense} disabled={saving}>
            {saving ? 'Saving...' : `+ Record ${isFixed ? 'Fixed' : 'Variable'} Expense`}
          </button>
        </div>

        {fixedExpenses.length > 0 && (
          <div className="recent-sales" style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#F97316', marginBottom: '4px' }}>🏠 Fixed Monthly Costs</h3>
            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>
              These costs happen every month regardless of sales.
            </p>
            <div className="mobile-expense-list">
              {fixedExpenses.map(d => (
                <div key={d.id} style={{
                  background: '#1a0e00', border: '1px solid #F97316',
                  borderRadius: '10px', padding: '14px', marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#fff', fontWeight: '600' }}>{d.item}</p>
                    <button className="delete-btn" onClick={() => deleteExpense(d.id)}>🗑</button>
                  </div>
                  <p style={{ color: '#F97316', fontWeight: '700', fontSize: '18px', margin: '6px 0' }}>
                    KES {d.amount.toLocaleString()}
                  </p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {d.frequency} · KES {getDailyAmount(d.amount, d.frequency).toFixed(0)}/day
                  </p>
                </div>
              ))}
            </div>
            <div className="desktop-expense-table">
              <table>
                <thead>
                  <tr><th>Expense</th><th>Amount</th><th>Frequency</th><th>Daily Cost</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {fixedExpenses.map(d => (
                    <tr key={d.id} style={{ opacity: String(d.id).startsWith('temp_') ? 0.6 : 1 }}>
                      <td>{d.item}</td>
                      <td style={{ color: '#F97316', fontWeight: 'bold' }}>KES {d.amount.toLocaleString()}</td>
                      <td style={{ color: '#aaa', fontSize: '12px' }}>{d.frequency}</td>
                      <td style={{ color: '#F97316' }}>KES {getDailyAmount(d.amount, d.frequency).toFixed(0)}/day</td>
                      <td>
                        {!String(d.id).startsWith('temp_') && (
                          <button className="delete-btn" onClick={() => deleteExpense(d.id)}>🗑</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {variableExpenses.length > 0 && (
          <div className="recent-sales">
            <h3 style={{ color: '#8B5CF6', marginBottom: '4px' }}>🚗 Variable Costs</h3>
            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>
              These costs change depending on your business activity.
            </p>
            <div className="mobile-expense-list">
              {variableExpenses.map(d => (
                <div key={d.id} style={{
                  background: '#120d1a', border: '1px solid #8B5CF6',
                  borderRadius: '10px', padding: '14px', marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#fff', fontWeight: '600' }}>{d.item}</p>
                    <button className="delete-btn" onClick={() => deleteExpense(d.id)}>🗑</button>
                  </div>
                  <p style={{ color: '#8B5CF6', fontWeight: '700', fontSize: '18px', margin: '6px 0' }}>
                    KES {d.amount.toLocaleString()}
                  </p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {d.frequency} · KES {getDailyAmount(d.amount, d.frequency).toFixed(0)}/day
                  </p>
                </div>
              ))}
            </div>
            <div className="desktop-expense-table">
              <table>
                <thead>
                  <tr><th>Expense</th><th>Amount</th><th>Frequency</th><th>Daily Cost</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {variableExpenses.map(d => (
                    <tr key={d.id} style={{ opacity: String(d.id).startsWith('temp_') ? 0.6 : 1 }}>
                      <td>{d.item}</td>
                      <td style={{ color: '#8B5CF6', fontWeight: 'bold' }}>KES {d.amount.toLocaleString()}</td>
                      <td style={{ color: '#aaa', fontSize: '12px' }}>{d.frequency}</td>
                      <td style={{ color: '#8B5CF6' }}>KES {getDailyAmount(d.amount, d.frequency).toFixed(0)}/day</td>
                      <td>
                        {!String(d.id).startsWith('temp_') && (
                          <button className="delete-btn" onClick={() => deleteExpense(d.id)}>🗑</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.length === 0 && (
          <div className="recent-sales">
            <p className="empty-state">
              No expenses recorded yet. Add your rent, transport and other running costs to see your daily break-even target.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}