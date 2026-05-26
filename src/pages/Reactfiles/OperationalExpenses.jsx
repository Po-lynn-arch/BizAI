import '../CSS/DataEntry.css'
import { useState, useEffect } from 'react'
import { Sidebar } from '../../components/Sidebar'

export function OperationalExpenses() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [data, setData] = useState([])
  const [item, setItem] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [isFixed, setIsFixed] = useState(false)

  function loadExpenses() {
    fetch(`http://127.0.0.1:5000/api/operational-expenses?user_id=${user.id}`)
      .then(res => res.json()).then(d => setData(d))
  }

  useEffect(() => { loadExpenses() }, [])

  async function addExpense() {
    if (!item || !amount) { alert('Please fill in all fields'); return }
    if (Number(amount) <= 0) { alert('Amount must be greater than zero'); return }

    await fetch('http://127.0.0.1:5000/api/operational-expenses', {
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
    loadExpenses()
    setItem(''); setAmount('')
  }

  async function deleteExpense(id) {
    await fetch(`http://127.0.0.1:5000/api/operational-expenses/${id}`, { method: 'DELETE' })
    loadExpenses()
  }

  const getDailyAmount = (amount, frequency) => {
    if (frequency === 'daily') return amount
    if (frequency === 'weekly') return (amount / 7).toFixed(0)
    if (frequency === 'monthly') return (amount / 30).toFixed(0)
    return (amount / 30).toFixed(0)
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>🏠 Operational Expenses</h2>
            <p>Record costs of running your business — rent, transport, utilities</p>
          </div>
        </header>

        <div className="entry-form">
          <div style={{ background: '#2b0d0d', border: '1px solid #ff4444', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ff4444', fontSize: '14px' }}>
            💡 These are costs not related to buying stock. Set the frequency so the system knows how often this expense occurs and calculates your daily profit correctly.
          </div>
          <div className="form-row">
            <div className='form-field'>
              <label>Expense Name</label>
              <input
                placeholder="e.g. Shop Rent, Electricity, Transport"
                value={item}
                onChange={e => setItem(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Amount (KES)</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>How often is this expense?</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)}>
                <option value="daily">Every day (e.g. transport)</option>
                <option value="weekly">Every week (e.g. cleaning)</option>
                <option value="monthly">Every month (e.g. rent, electricity)</option>
                <option value="once">One time only (e.g. equipment)</option>
              </select>
            </div>

            <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <input
                type="checkbox"
                id="isFixed"
                checked={isFixed}
                onChange={e => setIsFixed(e.target.checked)}
              />
              <label htmlFor="isFixed" style={{ fontSize: '13px', color: '#aaa', cursor: 'pointer' }}>
                🔔 This is a fixed recurring expense — remind me monthly
              </label>
            </div>
          </div>


          {amount && (
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>
              Daily impact on profit:
              <strong style={{ color: '#ff4444' }}> KES {getDailyAmount(Number(amount), frequency)}/day</strong>
            </p>
          )}

          <button className="add-btn" style={{ background: '#ff4444' }} onClick={addExpense}>
            + Record Expense
          </button>
        </div>

        <div className="recent-sales">
          <h3>Operational Expenses — Total Recorded: KES {total.toLocaleString()}</h3>
          {data.length === 0 ? <p className="empty-state">No operational expenses recorded yet.</p> : (
            <table>
              <thead>
                <tr><th>Expense</th><th>Amount (KES)</th><th>Frequency</th><th>Daily Cost</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.id}>
                    <td>{d.item}</td>
                    <td style={{ color: '#ff4444', fontWeight: 'bold' }}>KES {d.amount.toLocaleString()}</td>
                    <td>
                      <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '12px', background: '#1a1a1a', color: '#aaa' }}>
                        {d.frequency === 'daily' ? '📅 Daily'
                          : d.frequency === 'weekly' ? '📅 Weekly'
                          : d.frequency === 'monthly' ? '📅 Monthly'
                          : '📅 One time'}
                      </span>
                    </td>
                    <td style={{ color: '#aaa' }}>KES {getDailyAmount(d.amount, d.frequency)}/day</td>
                    <td>{d.date}</td>
                    <td><button className="delete-btn" onClick={() => deleteExpense(d.id)}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}