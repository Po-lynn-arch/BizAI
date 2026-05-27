import '../CSS/DataEntry.css'
import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import { API_URL } from '../config'

export function OperationalExpenses() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [data, setData] = useState([])
  const [item, setItem] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [isFixed, setIsFixed] = useState(true)
  const [todayProfit, setTodayProfit] = useState(0)

  function loadData() {
    Promise.all([
      fetch(`${API_URL}/api/operational-expenses?user_id=${user.id}`).then(r => r.json()),
      fetch(`${API_URL}/api/summary?user_id=${user.id}`).then(r => r.json())
    ]).then(([expensesData, summaryData]) => {
      setData(Array.isArray(expensesData) ? expensesData : [])
      setTodayProfit(summaryData.today_profit || 0)
    })
  }

  useEffect(() => { loadData() }, [])

  async function addExpense() {
    if (!item || !amount) { alert('Please fill in all fields'); return }
    if (Number(amount) <= 0) { alert('Amount must be greater than zero'); return }

    await fetch(`${API_URL}/api/operational-expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        item,
        amount: Number(amount),
        frequency,
        is_fixed: isFixed,
        date: new Date().toLocaleDateString()
      })
    })
    loadData()
    setItem(''); setAmount('')
  }

  async function deleteExpense(id) {
    await fetch(`${API_URL}/api/operational-expenses/${id}`, { method: 'DELETE' })
    loadData()
  }

  const getDailyAmount = (amount, frequency) => {
    if (frequency === 'daily') return amount
    if (frequency === 'weekly') return amount / 7
    if (frequency === 'monthly') return amount / 30
    return amount / 30
  }

  const fixedExpenses = data.filter(d => d.is_fixed)
  const variableExpenses = data.filter(d => !d.is_fixed)
  const totalDailyCost = data.reduce((sum, d) => sum + getDailyAmount(d.amount, d.frequency), 0)
  const totalMonthly = data.reduce((sum, d) => sum + d.amount, 0)
  const breakEvenGap = totalDailyCost - todayProfit

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>🏠 Operational Expenses</h2>
            <p>Track your business running costs and see your daily break-even target</p>
          </div>
        </header>

        {/* BREAK-EVEN INDICATOR */}
        {data.length > 0 && (
          <div style={{
            background: breakEvenGap <= 0 ? '#0d2b1f' : '#2b0d0d',
            border: `1px solid ${breakEvenGap <= 0 ? '#10B981' : '#ff4444'}`,
            borderRadius: '12px', padding: '20px', marginBottom: '24px'
          }}>
            <h3 style={{ color: breakEvenGap <= 0 ? '#10B981' : '#ff4444', marginBottom: '8px' }}>
              {breakEvenGap <= 0 ? '✅ You have covered your expenses today!' : '⚠️ You have not covered your expenses today yet'}
            </h3>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.7' }}>
              Your daily running costs total <strong style={{ color: '#ff4444' }}>KES {totalDailyCost.toFixed(0)}</strong>.
              Today's profit so far is <strong style={{ color: todayProfit >= 0 ? '#10B981' : '#ff4444' }}>KES {todayProfit.toFixed(0)}</strong>.
              {breakEvenGap <= 0
                ? ` You are KES ${Math.abs(breakEvenGap).toFixed(0)} above your break-even point. Keep going!`
                : ` You still need KES ${breakEvenGap.toFixed(0)} more profit today to cover your running costs.`
              }
            </p>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="feature-cards" style={{ marginBottom: '24px' }}>
          <div className="card">
            <div className="card-icon">📅</div>
            <p className="card-label">Daily Cost</p>
            <p className="card-value" style={{ color: '#ff4444' }}>KES {totalDailyCost.toFixed(0)}</p>
            <p style={{ fontSize: '11px', color: '#666' }}>Must earn this daily to break even</p>
          </div>
          <div className="card">
            <div className="card-icon">📆</div>
            <p className="card-label">Monthly Cost</p>
            <p className="card-value" style={{ color: '#FFA500' }}>KES {totalMonthly.toLocaleString()}</p>
            <p style={{ fontSize: '11px', color: '#666' }}>Total recorded expenses</p>
          </div>
          <div className="card">
            <div className="card-icon">🎯</div>
            <p className="card-label">Today's Profit</p>
            <p className="card-value" style={{ color: todayProfit >= 0 ? '#10B981' : '#ff4444' }}>
              KES {todayProfit.toFixed(0)}
            </p>
            <p style={{ fontSize: '11px', color: '#666' }}>From today's sales</p>
          </div>
        </div>

        {/* ADD FORM */}
        <div className="entry-form">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={() => setIsFixed(true)} style={{
              flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              background: isFixed ? '#ff4444' : 'transparent',
              color: isFixed ? '#fff' : '#aaa',
              border: isFixed ? 'none' : '1px solid #2a2a2a'
            }}>
              🏠 Fixed Cost (e.g. rent)
            </button>
            <button onClick={() => setIsFixed(false)} style={{
              flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              background: !isFixed ? '#FFA500' : 'transparent',
              color: !isFixed ? '#fff' : '#aaa',
              border: !isFixed ? 'none' : '1px solid #2a2a2a'
            }}>
              🚗 Variable Cost (e.g. transport)
            </button>
          </div>

          <div style={{
            background: isFixed ? '#2b0d0d' : '#1a1a0d',
            border: `1px solid ${isFixed ? '#ff4444' : '#FFA500'}`,
            borderRadius: '8px', padding: '12px', marginBottom: '16px',
            color: isFixed ? '#ff4444' : '#FFA500', fontSize: '13px'
          }}>
            {isFixed
              ? '🏠 Fixed costs are the same every month — rent, electricity, salaries, insurance.'
              : '🚗 Variable costs change day to day — transport, airtime, packaging, casual labour.'}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Expense Name</label>
              <input placeholder={isFixed ? 'e.g. Shop Rent' : 'e.g. Transport to market'}
                value={item} onChange={e => setItem(e.target.value)} />
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
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>
              Daily impact: <strong style={{ color: '#ff4444' }}>
                KES {getDailyAmount(Number(amount), frequency).toFixed(0)}/day
              </strong> — your sales must cover this daily.
            </p>
          )}

          <button className="add-btn" style={{ background: isFixed ? '#ff4444' : '#FFA500' }} onClick={addExpense}>
            + Record {isFixed ? 'Fixed' : 'Variable'} Expense
          </button>
        </div>

        {/* FIXED EXPENSES */}
        {fixedExpenses.length > 0 && (
          <div className="recent-sales" style={{ marginBottom: '24px' }}>
            <h3>🏠 Fixed Monthly Costs</h3>
            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>
              These costs happen every month regardless of sales.
            </p>
            <table>
              <thead>
                <tr><th>Expense</th><th>Amount</th><th>Frequency</th><th>Daily Cost</th><th>Action</th></tr>
              </thead>
              <tbody>
                {fixedExpenses.map(d => (
                  <tr key={d.id}>
                    <td>{d.item}</td>
                    <td style={{ color: '#ff4444', fontWeight: 'bold' }}>KES {d.amount.toLocaleString()}</td>
                    <td style={{ color: '#aaa', fontSize: '12px' }}>{d.frequency}</td>
                    <td style={{ color: '#ff4444' }}>KES {getDailyAmount(d.amount, d.frequency).toFixed(0)}/day</td>
                    <td><button className="delete-btn" onClick={() => deleteExpense(d.id)}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VARIABLE EXPENSES */}
        {variableExpenses.length > 0 && (
          <div className="recent-sales">
            <h3>🚗 Variable Costs</h3>
            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>
              These costs change depending on your business activity.
            </p>
            <table>
              <thead>
                <tr><th>Expense</th><th>Amount</th><th>Frequency</th><th>Daily Cost</th><th>Action</th></tr>
              </thead>
              <tbody>
                {variableExpenses.map(d => (
                  <tr key={d.id}>
                    <td>{d.item}</td>
                    <td style={{ color: '#FFA500', fontWeight: 'bold' }}>KES {d.amount.toLocaleString()}</td>
                    <td style={{ color: '#aaa', fontSize: '12px' }}>{d.frequency}</td>
                    <td style={{ color: '#FFA500' }}>KES {getDailyAmount(d.amount, d.frequency).toFixed(0)}/day</td>
                    <td><button className="delete-btn" onClick={() => deleteExpense(d.id)}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
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