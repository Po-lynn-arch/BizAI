import './Dashboard.css'
import './Reports.css'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Sidebar } from '../components/Sidebar'

export function Reports() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [summary, setSummary] = useState({
    total_income: 0, total_stock_cost: 0, total_operational: 0,
    net_profit: 0, today_income: 0, today_profit: 0,
    daily_stock_cost: 0, daily_operational: 0
  })
  const [sales, setSales] = useState([])
  const [stock, setStock] = useState([])
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/summary?user_id=${user.id}`)
      .then(res => res.json()).then(d => setSummary(d))
    fetch(`http://127.0.0.1:5000/api/sales?user_id=${user.id}`)
      .then(res => res.json()).then(d => setSales(d))
    fetch(`http://127.0.0.1:5000/api/stock?user_id=${user.id}`)
      .then(res => res.json()).then(d => setStock(d))
    fetch(`http://127.0.0.1:5000/api/operational-expenses?user_id=${user.id}`)
      .then(res => res.json()).then(d => setExpenses(d))
  }, [])

  const today = new Date().toLocaleDateString()
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)

  const todaySales = sales.filter(s => s.date === today)
  const weeklySales = sales.filter(s => new Date(s.date) >= weekAgo)
  const weeklyIncome = weeklySales.reduce((sum, s) => sum + s.total_earned, 0)

  const pieData = [
    { name: 'Income', value: summary.total_income },
    { name: 'Stock Cost', value: summary.total_stock_cost },
    { name: 'Operational', value: summary.total_operational }
  ]
  const COLORS = ['#10B981', '#FFA500', '#ff4444']

  const productSales = {}
  sales.forEach(s => {
    if (!productSales[s.product]) productSales[s.product] = 0
    productSales[s.product] += s.total_earned
  })
  const barData = Object.entries(productSales).map(([product, revenue]) => ({ product, revenue }))

  const profitColor = summary.net_profit >= 0 ? '#10B981' : '#ff4444'
  const todayProfitColor = summary.today_profit >= 0 ? '#10B981' : '#ff4444'

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div><h2>📄 Reports</h2><p>Your complete business performance summary</p></div>
        </header>

        {/* UNDERSTANDING BOX */}
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '14px', color: '#aaa' }}>
          <strong style={{ color: '#fff' }}>📚 Understanding your numbers:</strong>
          <br /><br />
          📈 <span style={{ color: '#10B981' }}>Income</span> — Money earned from selling products.
          <br />
          📦 <span style={{ color: '#FFA500' }}>Stock Cost</span> — Money spent buying products to sell. Spread over the stock duration.
          <br />
          🏠 <span style={{ color: '#ff4444' }}>Operational Costs</span> — Rent, transport, electricity etc.
          <br />
          💰 <span style={{ color: profitColor }}>Net Profit = Income - Stock Cost - Operational Costs.</span>
          {summary.net_profit >= 0
            ? <span style={{ color: '#10B981' }}> You are making a profit! ✅</span>
            : <span style={{ color: '#ff4444' }}> You are spending more than you earn. ⚠️ Review your costs.</span>
          }
        </div>

        {/* SUMMARY CARDS */}
        <div className="feature-cards">
          <div className="card">
            <div className="card-icon">📈</div>
            <p className="card-label">Total Income</p>
            <p className="card-value" style={{ color: '#10B981' }}>KES {summary.total_income.toLocaleString()}</p>
          </div>
          <div className="card">
            <div className="card-icon">📦</div>
            <p className="card-label">Stock Investment</p>
            <p className="card-value" style={{ color: '#FFA500' }}>KES {summary.total_stock_cost.toLocaleString()}</p>
          </div>
          <div className="card">
            <div className="card-icon">🏠</div>
            <p className="card-label">Operational Costs</p>
            <p className="card-value" style={{ color: '#ff4444' }}>KES {summary.total_operational.toLocaleString()}</p>
          </div>
          <div className="card">
            <div className="card-icon">💰</div>
            <p className="card-label">Net Profit</p>
            <p className="card-value" style={{ color: profitColor }}>KES {summary.net_profit.toLocaleString()}</p>
          </div>
          <div className="card">
            <div className="card-icon">☀️</div>
            <p className="card-label">Today's Income</p>
            <p className="card-value" style={{ color: '#10B981' }}>KES {summary.today_income.toLocaleString()}</p>
          </div>
          <div className="card">
            <div className="card-icon">💡</div>
            <p className="card-label">Today's Profit</p>
            <p className="card-value" style={{ color: todayProfitColor }}>KES {summary.today_profit.toLocaleString()}</p>
            <p style={{ fontSize: '11px', color: '#666' }}>After daily stock + ops costs</p>
          </div>

          {/* PIE CHART */}
          <div className="chart-card">
            <h3>Income vs Costs Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* BAR CHART */}
          {barData.length > 0 && (
            <div className="chart-card">
              <h3>Revenue by Product</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="product" stroke="#aaaaaa" fontSize={12} />
                  <YAxis stroke="#aaaaaa" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* STOCK STATUS */}
        <div className="recent-sales" style={{ marginBottom: '24px' }}>
          <h3>📦 Current Stock Status</h3>
          {stock.length === 0 ? <p className="empty-state">No stock added yet.</p> : (
            <table>
              <thead>
                <tr><th>Product</th><th>Bought</th><th>Remaining</th><th>% Left</th><th>Daily Cost</th></tr>
              </thead>
              <tbody>
                {stock.map(s => {
                  const percent = Math.round((s.qty_remaining / s.qty_bought) * 100)
                  const color = percent <= 10 ? '#ff4444' : percent <= 30 ? '#FFA500' : '#10B981'
                  const dailyCost = (s.total_cost / s.duration_days).toFixed(0)
                  return (
                    <tr key={s.id}>
                      <td>{s.product}</td>
                      <td>{s.qty_bought} units</td>
                      <td style={{ color, fontWeight: 'bold' }}>{s.qty_remaining} units</td>
                      <td>
                        <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '12px', background: '#1a1a1a', color }}>
                          {percent}%
                        </span>
                      </td>
                      <td style={{ color: '#FFA500' }}>KES {dailyCost}/day</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="reports-grid">
          {/* TODAY'S SALES */}
          <div className="recent-sales">
            <h3>Today's Sales — {today}</h3>
            {todaySales.length === 0 ? <p className="empty-state">No sales today.</p> : (
              <table>
                <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Earned</th></tr></thead>
                <tbody>
                  {todaySales.map((s, i) => (
                    <tr key={i}>
                      <td>{s.product}</td><td>{s.qty_sold}</td>
                      <td>KES {s.price_per_unit}</td>
                      <td style={{ color: '#10B981' }}>KES {s.total_earned.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid #2a2a2a' }}>
                    <td colSpan="3"><strong>Total</strong></td>
                    <td><strong style={{ color: '#10B981' }}>KES {todaySales.reduce((s, r) => s + r.total_earned, 0).toLocaleString()}</strong></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* WEEKLY SALES */}
          <div className="recent-sales">
            <h3>Weekly Sales</h3>
            {weeklySales.length === 0 ? <p className="empty-state">No sales this week.</p> : (
              <table>
                <thead><tr><th>Product</th><th>Qty</th><th>Earned</th><th>Date</th></tr></thead>
                <tbody>
                  {weeklySales.map((s, i) => (
                    <tr key={i}>
                      <td>{s.product}</td><td>{s.qty_sold}</td>
                      <td style={{ color: '#10B981' }}>KES {s.total_earned.toLocaleString()}</td>
                      <td>{s.date}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid #2a2a2a' }}>
                    <td colSpan="2"><strong>Weekly Total</strong></td>
                    <td><strong style={{ color: '#10B981' }}>KES {weeklyIncome.toLocaleString()}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* OPERATIONAL EXPENSES */}
          <div className="recent-sales">
            <h3>🏠 Operational Expenses</h3>
            {expenses.length === 0 ? <p className="empty-state">No operational expenses recorded.</p> : (
              <table>
                <thead><tr><th>Expense</th><th>Amount</th><th>Frequency</th><th>Daily Cost</th></tr></thead>
                <tbody>
                  {expenses.map((e, i) => {
                    const daily = e.frequency === 'daily' ? e.amount
                      : e.frequency === 'weekly' ? (e.amount / 7).toFixed(0)
                      : e.frequency === 'monthly' ? (e.amount / 30).toFixed(0)
                      : 'One time'
                    return (
                      <tr key={i}>
                        <td>{e.item}</td>
                        <td style={{ color: '#ff4444' }}>KES {e.amount.toLocaleString()}</td>
                        <td style={{ color: '#aaa', fontSize: '12px' }}>{e.frequency}</td>
                        <td style={{ color: '#aaa' }}>KES {daily}/day</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}