import '../CSS/Dashboard.css'
import '../CSS/Predictions.css'
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Sidebar } from '../../components/Sidebar'
import { useBusinessData } from '../../hooks/useBusinessData'

export function Predictions() {
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), [])
  const { predictions, loading } = useBusinessData(user.id)

  const medals = ['🥇', '🥈', '🥉']
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

  if (loading) return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area loading-state">
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
            <p>Sell-through analysis — know what to restock before you run out</p>
          </div>
        </header>

        <div className="prediction-disclaimer">
          <strong style={{ color: '#fff' }}>🧠 How this works:</strong>
          <br /><br />
          Products are ranked by <strong style={{ color: '#10B981' }}>sell-through rate</strong> — the percentage of your stock that has been sold. A product with 90% sold needs restocking urgently even if it sells in small quantities. This is more useful than ranking by volume alone.
        </div>

        {predictions.length === 0 ? (
          <div className="recent-sales">
            <p className="empty-state">No sales data yet. Record some sales first.</p>
          </div>
        ) : (
          <>
            <div className="predictions-grid">
              {predictions.map((p, index) => (
                <div
                  key={index}
                  className="prediction-card"
                  style={{ borderColor: medalColors[index] || '#2a2a2a' }}
                >
                  <div className="medal">{medals[index] || '🏅'}</div>
                  <h3 className="product-name">{p.product}</h3>

                  <p className="product-revenue">{p.total_qty?.toLocaleString()}</p>
                  <p className="product-label">units sold</p>

                  {/* Sell-through progress bar */}
                  {p.sell_through !== undefined && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        background: '#1a1a1a', borderRadius: '999px',
                        height: '6px', overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(p.sell_through, 100)}%`,
                          background: p.sell_through >= 80 ? '#10B981'
                            : p.sell_through >= 50 ? '#FFA500' : '#ff4444',
                          borderRadius: '999px',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <p style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                        {p.sell_through}% sold through
                      </p>
                    </div>
                  )}

                  <p style={{ color: '#10B981', fontSize: '13px', marginBottom: '4px' }}>
                    KES {p.revenue?.toLocaleString()}
                  </p>
                  <p style={{ color: '#666', fontSize: '11px', marginBottom: '12px' }}>
                    total revenue
                  </p>

                  <p className="prediction-note">{p.prediction}</p>
                </div>
              ))}
            </div>

            <div className="chart-card">
              <h3>Top Products — Units Sold</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictions.map(p => ({
                  product: p.product,
                  units: p.total_qty,
                  revenue: p.revenue
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="product" stroke="#aaaaaa" fontSize={12} />
                  <YAxis stroke="#aaaaaa" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(val, name) => [
                      name === 'units' ? `${val} units` : `KES ${val?.toLocaleString()}`,
                      name === 'units' ? 'Units Sold' : 'Revenue'
                    ]}
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