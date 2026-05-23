import './Dashboard.css'
import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

import { Sidebar } from '../components/Sidebar'

export function Dashboard() {

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    net_profit: 0,
    total_transactions: 0,
    total_stock_cost: 0,
    total_operational: 0,
    today_income: 0,
    today_profit: 0
  })

  const [income, setIncome] = useState([])
  const [alerts, setAlerts] = useState([])
  const [reminders, setReminders] = useState([])


  useEffect(() => {

    if (!user.id) {
      console.log('No user found')
      return
    }

    fetch(`http://127.0.0.1:5000/api/summary?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setSummary({
          total_income: data.total_income || 0,
          total_expenses: data.total_expenses || 0,
          net_profit: data.net_profit || 0,
          total_transactions: data.total_transactions || 0,
          total_stock_cost: data.total_stock_cost || 0,
          total_operational: data.total_operational || 0,
          today_income: data.today_income || 0,
          today_profit: data.today_profit || 0
        })
      })
      .catch(err => console.log('Summary fetch error:', err))

    fetch(`http://127.0.0.1:5000/api/sales?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setIncome(Array.isArray(data) ? data : [])
      })
      .catch(err => console.log('Sales fetch error:', err))

    fetch(`http://127.0.0.1:5000/api/alerts?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setAlerts(Array.isArray(data) ? data : [])
      })
      .catch(err => console.log('Alerts fetch error:', err))

    fetch(`http://127.0.0.1:5000/api/reminders?user_id=${user.id}`)
    .then(res => res.json()).then(d => setReminders(d))

  }, [])

  // REVENUE CHART DATA
  const revenueByDate = {}

  income.forEach(s => {
    const date = s.date || 'Unknown'

    if (!revenueByDate[date]) {
      revenueByDate[date] = 0
    }

    revenueByDate[date] += Number(s.total_earned || 0)
  })

  const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
    date,
    revenue
  }))

  // TOP PRODUCT
  const productTotals = {}

  income.forEach(s => {
    const item = s.item || 'Unknown'

    if (!productTotals[item]) {
      productTotals[item] = 0
    }

    productTotals[item] += Number(s.total_earned || 0)
  })

  const topProduct =
    Object.keys(productTotals).length > 0
      ? Object.keys(productTotals).reduce((a, b) =>
          productTotals[a] > productTotals[b] ? a : b
        )
      : 'No data yet'

  const profitColor =
    summary.net_profit >= 0 ? '#10B981' : '#ff4444'

  return (
    <div className="dashboard">

      <Sidebar />

      <div className="main-content-area">

        <header className="topbar">
          <div>
            <h2>Good Morning, {user.name || 'User'} 👋</h2>
            <p>{new Date().toDateString()}</p>
          </div>
        </header>

        <div className="feature-cards">

          <div className="card">
            <div className="card-icon">📈</div>
            <p className="card-label">Total Income</p>
            <p
              className="card-value"
              style={{ color: '#10B981' }}
            >
              KES {summary.total_income.toLocaleString()}
            </p>
            <p style={{ fontSize: '11px', color: '#666' }}>
              All sales revenue
            </p>
          </div>

          <div className="card">
            <div className="card-icon">📦</div>
            <p className="card-label">Stock Investment</p>
            <p
              className="card-value"
              style={{ color: '#FFA500' }}
            >
              KES {summary.total_stock_cost.toLocaleString()}
            </p>
            <p style={{ fontSize: '11px', color: '#666' }}>
              Total stock purchased
            </p>
          </div>

          <div className="card">
            <div className="card-icon">🏠</div>
            <p className="card-label">Operational Costs</p>
            <p
              className="card-value"
              style={{ color: '#ff4444' }}
            >
              KES {summary.total_operational.toLocaleString()}
            </p>
            <p style={{ fontSize: '11px', color: '#666' }}>
              Rent, transport etc
            </p>
          </div>

          <div className="card">
            <div className="card-icon">💰</div>
            <p className="card-label">Net Profit</p>
            <p
              className="card-value"
              style={{ color: profitColor }}
            >
              KES {summary.net_profit.toLocaleString()}
            </p>
            <p style={{ fontSize: '11px', color: '#666' }}>
              Income minus all costs
            </p>
          </div>

          <div className="card">
            <div className="card-icon">☀️</div>
            <p className="card-label">Today's Income</p>
            <p
              className="card-value"
              style={{ color: '#10B981' }}
            >
              KES {summary.today_income.toLocaleString()}
            </p>
            <p style={{ fontSize: '11px', color: '#666' }}>
              Sales recorded today
            </p>
          </div>

          <div className="card">
            <div className="card-icon">💡</div>
            <p className="card-label">Top Product</p>
            <p
              className="card-value"
              style={{ color: '#4F46E5' }}
            >
              {topProduct}
            </p>
            <p style={{ fontSize: '11px', color: '#666' }}>
              Highest earning product
            </p>
          </div>

        </div>

        {/* CHART */}

        <div className="recent-sales" style={{ marginTop: '24px' }}>

          <h3>Revenue Overview</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="date" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="revenue"
                fill="#10B981"
                radius={[8, 8, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* STOCK ALERTS */}

        {alerts.length > 0 && (
          <div
            className="recent-sales"
            style={{ marginTop: '24px' }}
          >

            <h3>⚠️ Stock Alerts</h3>

            <p
              style={{
                fontSize: '13px',
                color: '#aaa',
                marginBottom: '12px'
              }}
            >
              These are your fast-selling products.
            </p>

            <table>

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total Units Sold</th>
                  <th>Status</th>
                  <th>What to do</th>
                </tr>
              </thead>

              <tbody>

                {alerts.map((a, i) => (

                  <tr key={i}>

                    <td>{a.product}</td>
                    <td>{a.qty_remaining}</td>

                    <td>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: 'white',
                          backgroundColor:
                            a.level === 'red'
                              ? '#ff4444'
                              : a.level === 'orange'
                              ? '#FFA500'
                              : '#10B981'
                        }}
                      >
                        {a.level === 'red'
                          ? '🔴 URGENT'
                          : a.level === 'orange'
                          ? '🟠 MODERATE'
                          : '🟢 NORMAL'}
                      </span>
                    </td>

                    <td>{a.alert}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

        {reminders.length > 0 && (
          <div className="recent-sales" style={{ marginTop: '24px' }}>
            <h3>🔔 Expense Reminders</h3>
            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>
              These are your fixed recurring expenses. Remember to record them when due.
            </p>
            {reminders.map((r, i) => (
              <div key={i} style={{
                background: '#111', border: '1px solid #2a2a2a',
                borderRadius: '8px', padding: '12px 16px',
                marginBottom: '8px', fontSize: '14px', color: '#aaa',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span>🔔 {r.reminder}</span>
                <span style={{ color: '#ff4444', fontWeight: 'bold' }}>
                  KES {r.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* RECENT INCOME */}

        <div className="recent-sales">

          <h3>Recent Income</h3>

          {income.length === 0 ? (

            <p className="empty-state">
              No income recorded yet.
            </p>

          ) : (

            <table>

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {income.slice(0, 5).map((s, i) => (

                  <tr key={i}>
                    <td>{s.product}</td>
                    <td>{s.qty_sold}</td>
                    <td>KES {s.price_per_unit.toLocaleString()}</td>
                    <td style={{ color: '#10B981' }}>KES {s.total_earned.toLocaleString()}</td>
                    <td>{s.date}</td>
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

