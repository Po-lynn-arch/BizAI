import '../CSS/Dashboard.css'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Sidebar } from '../../components/Sidebar'

export function Reports() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    fetch(`https://bizai-backend-z4dh.onrender.com/api/sales?user_id=${user.id}`).then(res => res.json()).then(setSales)
    fetch(`https://bizai-backend-z4dh.onrender.com/api/operational-expenses?user_id=${user.id}`).then(res => res.json()).then(setExpenses)
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
    if (!productMap[s.product]) productMap[s.product] = { revenue: 0, profit: 0 }
    productMap[s.product].revenue += s.total_earned || 0
    productMap[s.product].profit += s.profit || 0
  })
  const barData = Object.entries(productMap).map(([product, v]) => ({ product, revenue: v.revenue, profit: v.profit }))

  const pieData = [
    { name: 'Gross Profit', value: Math.max(0, totalProfit) },
    { name: 'Operational Expenses', value: totalExpenses }
  ]
  const COLORS = ['#10B981', '#ff4444']

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <h2>📄 Reports</h2>
          <p>Business performance overview</p>
        </header>

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
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: KES ${value.toLocaleString()}`}>
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
      </div>
    </div>
  )
}