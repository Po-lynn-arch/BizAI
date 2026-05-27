import '../CSS/Dashboard.css'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Sidebar } from '../../components/Sidebar'
import { useSessionExpiry } from '../../hooks/useSessionExpiry'
import { API_URL } from '../../hooks/config'

export function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  useSessionExpiry(30)

  const [sales, setSales] = useState([])
  const [reminders, setReminders] = useState([])

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/sales?user_id=${user.id}`).then(res => res.json()),

      fetch(`${API_URL}/api/reminders?user_id=${user.id}`).then(res => res.json())
    ]).then(([salesData, remindersData]) => {
      setSales(salesData),
      setReminders(remindersData)
    })
   
  }, [])

  const today = new Date().toLocaleDateString()
  const todaySales = sales.filter(s => s.date === today)

  // profit is stored per sale row: (selling_price - cost_per_unit) * qty
  // just sum it up — no stock cost subtraction needed here
  const todayProfit = todaySales.reduce((sum, s) => sum + (s.profit || 0), 0)
  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total_earned || 0), 0)
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0)
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_earned || 0), 0)

  // Group by date for chart
  const chartMap = {}
  sales.forEach(s => {
    if (!chartMap[s.date]) chartMap[s.date] = { date: s.date, profit: 0, revenue: 0 }
    chartMap[s.date].profit += s.profit || 0
    chartMap[s.date].revenue += s.total_earned || 0
  })
  const chartData = Object.values(chartMap).slice(-14) // last 14 days

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>📊 Dashboard</h2>
            <p>Welcome back, {user.name}!</p>
          </div>
        </header>

        {reminders.length > 0 && (
          <div style={{ background: '#1a1a0d', border: '1px solid #FFA500', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
            <p style={{ color: '#FFA500', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>🔔 Reminders</p>
            {reminders.map((r, i) => (
              <p key={i} style={{ color: '#aaa', fontSize: '13px', marginBottom: '4px' }}>• {r.reminder}</p>
            ))}
          </div>
        )}

        <div className="feature-cards">
          <div className="card">
            <div className="card-icon">📊</div>
            <p className="card-label">Today's Profit</p>
            <p className="card-value" style={{ color: summary.today_profit >= 0 ? '#10B981' : '#ff4444' }}>
              KES {summary.today_profit.toLocaleString()}
            </p>
            <p style={{ fontSize: '11px', color: summary.today_profit >= 0 ? '#10B981' : '#ff4444' }}>
              {summary.today_profit >= 0 ? '✅ Profitable today' : '⚠️ Not profitable today'}
            </p>
          </div>

          <div className="card">
            <p className="card-label">Total Profit (All Time)</p>
            <p className="card-value" style={{ color: totalProfit >= 0 ? '#10B981' : '#ff4444' }}>
              KES {totalProfit.toLocaleString()}
            </p>
            <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>Revenue: KES {totalRevenue.toLocaleString()}</p>
          </div>

          <div className="card">
            <p className="card-label">Total Transactions</p>
            <p className="card-value">{sales.length}</p>
          </div>

          <div className="card">
            <p className="card-label">Today's Sales</p>
            <p className="card-value">{todaySales.length}</p>
          </div>
        </div>

        <div className="chart-card">
          <h3>Profit Trend (Last 14 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(val) => `KES ${val.toLocaleString()}`} />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Profit" dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={1.5} name="Revenue" dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{
          background: summary.total_profit >= 0 ? '#0d2b1f' : '#2b0d0d',
          border: `1px solid ${summary.total_profit >= 0 ? '#10B981' : '#ff4444'}`,
          borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '14px'
        }}>
          {summary.total_profit >= 0 ? (
            <p style={{ color: '#10B981' }}>
              ✅ <strong>Your business is profitable!</strong> You have made KES {summary.total_profit.toLocaleString()} profit from your sales so far.
              {summary.today_profit > 0 && ` Today alone you made KES ${summary.today_profit.toLocaleString()}.`}
            </p>
          ) : (
            <p style={{ color: '#ff4444' }}>
              ⚠️ <strong>Your costs are exceeding your sales profit.</strong> Review your stock costs and operational expenses to improve profitability.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
