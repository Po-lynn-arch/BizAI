import './Dashboard.css'
import './Predictions.css'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Sidebar } from '../components/Sidebar'

export function Predictions() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/predictions?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => setPredictions(data))
  }, [])

  const medals = ['🥇', '🥈', '🥉']
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
  const hasMetrics = predictions.length > 0 && predictions[0].confidence !== 'N/A'

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>🤖 AI Predictions</h2>
            <p>Machine learning powered demand forecast for next month</p>
          </div>
        </header>

        {/* ML EXPLANATION */}
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '14px', color: '#aaa' }}>
          <strong style={{ color: '#fff' }}>🧠 How this works:</strong>
          <br /><br />
          "Based on your sales history, here are the products your business is expected to sell the most next month. Stock up on these to meet demand and maximise your revenue."
          {hasMetrics && (
            <>
              <br /><br />
              <strong style={{ color: '#fff' }}>📊 Model Performance: </strong>
              <span style={{ color: '#10B981' }}>{predictions[0].confidence}</span>
              <br />
              
              <span style={{ fontSize: '12px' }}>F1 Score measures how accurately the model identifies high-demand products. Closer to 1.0 is better.</span>
            </>
          )}
        </div>

        {predictions.length === 0 ? (
          <div className="recent-sales">
            <p className="empty-state">No income data yet. Add at least 5 income entries.</p>
          </div>
        ) : (
          <div className="predictions-grid">
            {predictions.map((p, index) => (
              <div className="prediction-card" key={index} style={{ borderColor: medalColors[index] }}>
                <div className="medal">{medals[index]}</div>
                <h3 className="product-name">{p.product}</h3>
                <p className="product-revenue">KES {p.revenue.toLocaleString()}</p>
                <p className="product-label">Total Revenue Earned</p>
                <p className="prediction-note">{p.prediction}</p>
                {p.confidence !== 'N/A' && (
                  <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>{p.confidence}</p>
                )}
              </div>
            ))}
            <div className="chart-card">
              <h3>Top Products Revenue Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictions.map(p => ({ product: p.product, revenue: p.revenue }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="product" stroke="#aaaaaa" fontSize={12} />
                  <YAxis stroke="#aaaaaa" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}