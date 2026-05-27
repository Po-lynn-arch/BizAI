import './Dashboard.css'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Sidebar } from '../components/Sidebar'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

export function Predictions() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/predictions?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => { setPredictions(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const medals = ['🥇', '🥈', '🥉']
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

  if (loading) return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Loading predictions...</p>
      </div>
    </div>
  )

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>🤖 AI Predictions</h2>
            <p>Products ranked by units sold — your real bestsellers</p>
          </div>
        </header>

        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '14px', color: '#aaa' }}>
          <strong style={{ color: '#fff' }}>🧠 How this works:</strong>
          <br /><br />
          These are your top products ranked by <strong style={{ color: '#10B981' }}>quantity sold</strong> — not revenue. This tells you what your customers actually buy the most, so you know what to stock up on next month.
        </div>

        {predictions.length === 0 ? (
          <div className="recent-sales">
            <p className="empty-state">No sales data yet. Record some sales first.</p>
          </div>
        ) : (
          <>
            <div className="predictions-grid">
              {predictions.map((p, index) => (
                <div className="prediction-card" key={index} style={{ borderColor: medalColors[index] || '#2a2a2a' }}>
                  <div className="medal">{medals[index] || '🏅'}</div>
                  <h3 className="product-name">{p.product}</h3>
                  <p className="product-revenue" style={{ color: '#10B981' }}>{p.total_qty?.toLocaleString()} units sold</p>
                  <p className="product-label">Total Units Sold</p>
                  <p style={{ color: '#aaa', fontSize: '13px', marginTop: '4px' }}>Revenue: KES {p.revenue?.toLocaleString()}</p>
                  <p className="prediction-note">{p.prediction}</p>
                </div>
              ))}
            </div>

            <div className="chart-card" style={{ marginTop: '24px' }}>
              <h3>Top Products — Units Sold</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictions.map(p => ({ product: p.product, units: p.total_qty, revenue: p.revenue }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="product" stroke="#aaaaaa" fontSize={12} />
                  <YAxis stroke="#aaaaaa" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff' }}
                    formatter={(val, name) => [name === 'units' ? `${val} units` : `KES ${val?.toLocaleString()}`, name === 'units' ? 'Units Sold' : 'Revenue']}
                  />
                  <Bar dataKey="units" fill="#10B981" radius={[4, 4, 0, 0]} name="units" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
