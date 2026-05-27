import '../CSS/Dashboard.css'
import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { Sidebar } from '../../components/Sidebar'
import { API_URL } from '../../hooks/config'


export function Reports() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])
  const [weekly, setWeekly] = useState(null)
  const [tab, setTab] = useState('overview') // 'overview' or 'weekly'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/sales?user_id=${user.id}`).then(r => r.json()),
      fetch(`${API_URL}/api/operational-expenses?user_id=${user.id}`).then(r => r.json()),
      fetch(`${API_URL}/api/weekly-report?user_id=${user.id}`).then(r => r.json())
    ]).then(([salesData, expensesData, weeklyData]) => {
      setSales(Array.isArray(salesData) ? salesData : [])
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
      setWeekly(weeklyData)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load reports:', err)
      setLoading(false)
    })
  }, [])

  const today = new Date().toLocaleDateString()
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)

  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0)
  const todayProfit = sales.filter(s => s.date === today).reduce((sum, s) => sum + (s.profit || 0), 0)
  const weeklyProfit = sales.filter(s => new Date(s.date) >= weekAgo).reduce((sum, s) => sum + (s.profit || 0), 0)
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_earned || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const productMap = {}
  sales.forEach(s => {
    if (!productMap[s.product]) productMap[s.product] = { revenue: 0, profit: 0, qty: 0 }
    productMap[s.product].revenue += s.total_earned || 0
    productMap[s.product].profit += s.profit || 0
    productMap[s.product].qty += s.qty_sold || 0
  })
  const barData = Object.entries(productMap).map(([product, v]) => ({ product, revenue: v.revenue, profit: v.profit }))

  const pieData = [
    { name: 'Gross Profit', value: Math.max(0, totalProfit) },
    { name: 'Operational Expenses', value: totalExpenses }
  ]
  const COLORS = ['#10B981', '#ff4444']

  const bestDay = weekly?.daily?.reduce((best, d) => d.profit > (best?.profit || -Infinity) ? d : best, null)

  if (loading) return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Loading reports...</p>
      </div>
    </div>
  )

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <h2>📄 Reports</h2>
          <p>Business performance overview</p>
        </header>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[['overview', '📊 Overview'], ['weekly', '📅 Weekly']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              background: tab === t ? '#10B981' : 'transparent',
              color: tab === t ? '#fff' : '#aaa',
              border: tab === t ? 'none' : '1px solid #2a2a2a'
            }}>{label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="feature-cards">
              <div className="card">
                <p className="card-label">Today's Profit</p>
                <p className="card-value" style={{ color: todayProfit >= 0 ? '#10B981' : '#ff4444' }}>KES {todayProfit.toLocaleString()}</p>
              </div>
              <div className="card">
                <p className="card-label">Weekly Profit</p>
                <p className="card-value" style={{ color: weeklyProfit >= 0 ? '#10B981' : '#ff4444' }}>KES {weeklyProfit.toLocaleString()}</p>
              </div>
              <div className="card">
                <p className="card-label">Total Profit</p>
                <p className="card-value" style={{ color: totalProfit >= 0 ? '#10B981' : '#ff4444' }}>KES {totalProfit.toLocaleString()}</p>
              </div>
              <div className="card">
                <p className="card-label">Total Revenue</p>
                <p className="card-value" style={{ color: '#3b82f6' }}>KES {totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="chart-card">
              <h3>Gross Profit vs Operational Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={100}
                    label={({ name, value }) => `${name}: KES ${value.toLocaleString()}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `KES ${val.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Revenue & Profit by Product</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip formatter={(val) => `KES ${val.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#10B981" name="Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="recent-sales">
              <h3>All Sales</h3>
              {sales.length === 0 ? <p className="empty-state">No sales recorded yet</p> : (
                <table>
                  <thead>
                    <tr><th>Product</th><th>Qty</th><th>Revenue</th><th>Profit</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {sales.map(s => (
                      <tr key={s.id}>
                        <td>{s.product}</td>
                        <td>{s.qty_sold}</td>
                        <td>KES {s.total_earned?.toLocaleString()}</td>
                        <td style={{ color: s.profit >= 0 ? '#10B981' : '#ff4444', fontWeight: 'bold' }}>KES {s.profit?.toLocaleString()}</td>
                        <td>{s.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {tab === 'weekly' && weekly && (
          <>
            <div className="feature-cards">
              <div className="card">
                <p className="card-label">Week Revenue</p>
                <p className="card-value" style={{ color: '#3b82f6' }}>KES {weekly.week_revenue?.toLocaleString()}</p>
              </div>
              <div className="card">
                <p className="card-label">Week Profit</p>
                <p className="card-value" style={{ color: weekly.week_profit >= 0 ? '#10B981' : '#ff4444' }}>
                  KES {weekly.week_profit?.toLocaleString()}
                </p>
              </div>
              <div className="card">
                <p className="card-label">Transactions</p>
                <p className="card-value">{weekly.week_transactions}</p>
              </div>
              {bestDay && bestDay.profit > 0 && (
                <div className="card">
                  <p className="card-label">Best Day</p>
                  <p className="card-value" style={{ color: '#10B981', fontSize: '16px' }}>{bestDay.date}</p>
                  <p style={{ color: '#aaa', fontSize: '12px' }}>KES {bestDay.profit.toLocaleString()} profit</p>
                </div>
              )}
            </div>

            <div className="chart-card">
              <h3>Daily Revenue & Profit This Week</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekly.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(val) => `KES ${val.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#10B981" name="Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {weekly.top_products?.length > 0 && (
              <div className="recent-sales">
                <h3>Top Products This Week</h3>
                <table>
                  <thead>
                    <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>Profit</th></tr>
                  </thead>
                  <tbody>
                    {weekly.top_products.map((p, i) => (
                      <tr key={i}>
                        <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.product}</td>
                        <td>{p.qty}</td>
                        <td>KES {p.revenue?.toLocaleString()}</td>
                        <td style={{ color: p.profit >= 0 ? '#10B981' : '#ff4444', fontWeight: 'bold' }}>KES {p.profit?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="recent-sales" style={{ marginTop: '20px' }}>
              <h3>Daily Breakdown</h3>
              <table>
                <thead>
                  <tr><th>Date</th><th>Revenue</th><th>Profit</th><th>Transactions</th></tr>
                </thead>
                <tbody>
                  {weekly.daily?.map((d, i) => (
                    <tr key={i} style={{ opacity: d.transactions === 0 ? 0.4 : 1 }}>
                      <td>{d.date}</td>
                      <td>KES {d.revenue?.toLocaleString()}</td>
                      <td style={{ color: d.profit > 0 ? '#10B981' : d.profit < 0 ? '#ff4444' : '#aaa', fontWeight: d.profit !== 0 ? 'bold' : 'normal' }}>
                        {d.profit !== 0 ? `KES ${d.profit?.toLocaleString()}` : '—'}
                      </td>
                      <td>{d.transactions || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
