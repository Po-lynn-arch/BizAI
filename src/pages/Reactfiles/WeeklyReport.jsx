import '../CSS/Dashboard.css'
import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts'
import { Sidebar } from '../../components/Sidebar'

export function WeeklyReport() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`https://bizai-backend-z4dh.onrender.com/api/weekly-report?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => { setReport(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Loading weekly report...</p>
      </div>
    </div>
  )

  if (!report) return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <p style={{ color: '#ff4444' }}>Failed to load report.</p>
      </div>
    </div>
  )

  const bestDay = report.daily.reduce((best, d) => d.profit > (best?.profit || -Infinity) ? d : best, null)

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>📅 Weekly Report</h2>
            <p>Your performance over the last 7 days</p>
          </div>
        </header>

        {/* Summary cards */}
        <div className="feature-cards">
          <div className="card">
            <p className="card-label">Week Revenue</p>
            <p className="card-value" style={{ color: '#3b82f6' }}>KES {report.week_revenue.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="card-label">Week Profit</p>
            <p className="card-value" style={{ color: report.week_profit >= 0 ? '#10B981' : '#ff4444' }}>
              KES {report.week_profit.toLocaleString()}
            </p>
          </div>
          <div className="card">
            <p className="card-label">Transactions</p>
            <p className="card-value">{report.week_transactions}</p>
          </div>
          {bestDay && bestDay.profit > 0 && (
            <div className="card">
              <p className="card-label">Best Day</p>
              <p className="card-value" style={{ color: '#10B981', fontSize: '16px' }}>{bestDay.date}</p>
              <p style={{ color: '#aaa', fontSize: '12px' }}>KES {bestDay.profit.toLocaleString()} profit</p>
            </div>
          )}
        </div>

        {/* Daily bar chart */}
        <div className="chart-card">
          <h3>Daily Revenue & Profit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={report.daily}>
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

        {/* Top products */}
        {report.top_products.length > 0 && (
          <div className="recent-sales">
            <h3>Top Products This Week</h3>
            <table>
              <thead>
                <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>Profit</th></tr>
              </thead>
              <tbody>
                {report.top_products.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ marginRight: '8px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      {p.product}
                    </td>
                    <td>{p.qty}</td>
                    <td>KES {p.revenue.toLocaleString()}</td>
                    <td style={{ color: p.profit >= 0 ? '#10B981' : '#ff4444', fontWeight: 'bold' }}>
                      KES {p.profit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Daily breakdown table */}
        <div className="recent-sales" style={{ marginTop: '20px' }}>
          <h3>Daily Breakdown</h3>
          <table>
            <thead>
              <tr><th>Date</th><th>Revenue</th><th>Profit</th><th>Transactions</th></tr>
            </thead>
            <tbody>
              {report.daily.map((d, i) => (
                <tr key={i} style={{ opacity: d.transactions === 0 ? 0.4 : 1 }}>
                  <td>{d.date}</td>
                  <td>KES {d.revenue.toLocaleString()}</td>
                  <td style={{ color: d.profit > 0 ? '#10B981' : d.profit < 0 ? '#ff4444' : '#aaa', fontWeight: d.profit !== 0 ? 'bold' : 'normal' }}>
                    {d.profit !== 0 ? `KES ${d.profit.toLocaleString()}` : '—'}
                  </td>
                  <td>{d.transactions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
