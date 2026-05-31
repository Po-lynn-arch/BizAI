import '../CSS/Dashboard.css'
import { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Sidebar } from '../../components/Sidebar'
import { useSessionExpiry } from '../../hooks/useSessionExpiry'
import { API_URL } from '../../hooks/config'

export function Dashboard() {
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), [])
  useSessionExpiry(30)

  const [sales, setSales] = useState([])
  const [reminders, setReminders] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user.id) return
    Promise.all([
      fetch(`${API_URL}/api/sales?user_id=${user.id}`).then(r => r.json()),
      fetch(`${API_URL}/api/reminders?user_id=${user.id}`).then(r => r.json()),
      fetch(`${API_URL}/api/alerts?user_id=${user.id}`).then(r => r.json()),
    ]).then(([salesData, remindersData, alertsData]) => {
      setSales(Array.isArray(salesData) ? salesData : [])
      setReminders(Array.isArray(remindersData) ? remindersData : [])
      setAlerts(Array.isArray(alertsData) ? alertsData.filter(a => a.level !== 'green') : [])
    }).catch(() => {
      setSales([]); setReminders([]); setAlerts([])
    }).finally(() => setLoading(false))
  }, [user.id])

  const today = useMemo(() => {
    const now = new Date()
    return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`
  }, [])

  const { todaySales, todayProfit, totalProfit, totalRevenue, chartData } = useMemo(() => {
    const todaySales = sales.filter(s => s.date === today)
    const todayProfit = todaySales.reduce((sum, s) => sum + (s.profit || 0), 0)
    const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0)
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total_earned || 0), 0)
    const chartMap = {}
    sales.forEach(s => {
      if (!chartMap[s.date]) chartMap[s.date] = { date: s.date, profit: 0, revenue: 0 }
      chartMap[s.date].profit += s.profit || 0
      chartMap[s.date].revenue += s.total_earned || 0
    })
    const chartData = Object.values(chartMap).slice(-14)
    return { todaySales, todayProfit, totalProfit, totalRevenue, chartData }
  }, [sales, today])

  if (loading) return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <div className="loading-state">
          <p style={{ color: '#aaa' }}>Loading dashboard...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">

        <header className="topbar topbar--centered">
          <div className="date-badge date-badge--top">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="topbar__hero">
            {user.business_name && (
              <h2 className="topbar__business">🏪 {user.business_name}</h2>
            )}
            <p className="topbar__operator">
              Operator: <strong style={{ color: '#10B981' }}>{user.name}</strong>
            </p>
          </div>
        </header>

        {/* LOW STOCK ALERTS */}
        {alerts.length > 0 && (
          <div className="alert-banner alert-banner--stock">
            <p className="alert-banner__title">⚠️ Low Stock Alerts</p>
            {alerts.map((a, i) => (
              <p key={i} className={`alert-banner__item ${a.level === 'red' ? 'alert-banner__item--red' : 'alert-banner__item--orange'}`}>
                • {a.product}: {a.alert}
              </p>
            ))}
          </div>
        )}

        {/* REMINDERS */}
        {reminders.length > 0 && (
          <div className="alert-banner alert-banner--reminder">
            <p className="alert-banner__title">🔔 Reminders</p>
            {reminders.map((r, i) => (
              <p key={i} className="alert-banner__item">{r.reminder}</p>
            ))}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="feature-cards">
          <div className="card">
            <div className="card-icon">📊</div>
            <p className="card-label">Today's Profit</p>
            <p className="card-value" style={{ color: todayProfit >= 0 ? '#10B981' : '#ff4444' }}>
              KES {todayProfit.toLocaleString()}
            </p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {todaySales.length} sale{todaySales.length !== 1 ? 's' : ''} today
            </p>
          </div>
          <div className="card">
            <div className="card-icon">💰</div>
            <p className="card-label">All-Time Profit</p>
            <p className="card-value" style={{ color: totalProfit >= 0 ? '#10B981' : '#ff4444' }}>
              KES {totalProfit.toLocaleString()}
            </p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Revenue: KES {totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="card">
            <div className="card-icon">🧾</div>
            <p className="card-label">Total Transactions</p>
            <p className="card-value" style={{ color: '#3b82f6' }}>{sales.length}</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>all time</p>
          </div>
          <div className="card">
            <div className="card-icon">🛒</div>
            <p className="card-label">Today's Sales</p>
            <p className="card-value" style={{ color: '#a78bfa' }}>{todaySales.length}</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {todaySales.length > 0
                ? `KES ${todaySales.reduce((s, x) => s + (x.total_earned || 0), 0).toLocaleString()} revenue`
                : 'No sales recorded'}
            </p>
          </div>
        </div>

        {/* CHART */}
        {sales.length > 0 ? (
          <div className="chart-card">
            <h3>Profit Trend <span style={{ color: '#666', fontSize: '13px', fontWeight: 400 }}>— Last 14 days</span></h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} width={60}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '13px' }}
                  labelStyle={{ color: '#aaa' }}
                  formatter={(val) => [`KES ${val.toLocaleString()}`, undefined]}
                />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Profit" dot={false} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={1.5} name="Revenue" dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', fontSize: '12px', color: '#666', marginTop: '8px' }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10B981', marginRight: 4 }} />Profit</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', marginRight: 4 }} />Revenue</span>
            </div>
          </div>
        ) : (
          <div className="recent-sales" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>📈</p>
            <p style={{ color: '#fff', fontWeight: '600', marginBottom: '8px' }}>No sales data yet</p>
            <p className="empty-state">Record your first sale to start seeing profit trends here.</p>
          </div>
        )}

        {/* PROFIT SUMMARY */}
        {sales.length > 0 && (
          <div style={{
            background: totalProfit >= 0 ? '#0d2b1f' : '#2b0d0d',
            border: `1px solid ${totalProfit >= 0 ? '#10B981' : '#ff4444'}`,
            borderRadius: '12px', padding: '16px', marginBottom: '24px',
            display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px'
          }}>
            <span style={{ fontSize: '18px' }}>{totalProfit >= 0 ? '✅' : '⚠️'}</span>
            <p style={{ color: totalProfit >= 0 ? '#10B981' : '#ff4444', margin: 0 }}>
              {totalProfit >= 0 ? (
                <><strong>Your business is profitable!</strong> Total profit of KES {totalProfit.toLocaleString()}.
                  {todayProfit > 0 && ` Today alone: KES ${todayProfit.toLocaleString()}.`}</>
              ) : (
                <><strong>Costs are exceeding revenue.</strong> Review your stock costs and operational expenses.</>
              )}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}