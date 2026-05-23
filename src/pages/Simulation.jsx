import './Dashboard.css'
import './Simulation.css'
import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'

export function Simulation() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [income, setIncome] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newQty, setNewQty] = useState('')
  const [result, setResult] = useState(null)
  const [messages, setMessages] = useState([
    { from: 'bot', text: "👋 Hello! I'm your Business Advisor. Select a product and enter new price and quantity to see how it affects your revenue." }
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/sales?user_id=${user.id}`)
    .then(res => res.json()).then(d => setIncome(d))
  }, [])

  const products = [...new Set(income.map(s => s.product))]

  async function simulate() {
    if (!selectedProduct || !newPrice || !newQty) {
      alert('Please fill in all fields')
      return
    }

    const userMsg = `What if I sell ${selectedProduct} at KES ${newPrice} with ${newQty} units?`
    setMessages(prev => [...prev, { from: 'user', text: userMsg }])
    setLoading(true)

    const response = await fetch('http://127.0.0.1:5000/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        product: selectedProduct,
        new_price: Number(newPrice),
        new_qty: Number(newQty)
      })
    })
    const data = await response.json()
    setResult(data)
    setLoading(false)
    setMessages(prev => [...prev, { from: 'bot', text: data.verdict }])
    setSelectedProduct(''); setNewPrice(''); setNewQty('')
  }

  function reset() {
    setMessages([{ from: 'bot', text: "👋 Hello! I'm your Business Advisor. Select a product and enter new price and quantity to see how it affects your revenue." }])
    setResult(null)
    setSelectedProduct(''); setNewPrice(''); setNewQty('')
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>🧪 Business Simulation</h2>
            <p>Ask your AI advisor how price and stock changes affect your revenue</p>
          </div>
        </header>

        {/* CHAT WINDOW */}
        <div style={{
          background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px',
          padding: '20px', marginBottom: '24px', minHeight: '300px',
          maxHeight: '400px', overflowY: 'auto', display: 'flex',
          flexDirection: 'column', gap: '12px'
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '70%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px',
                background: msg.from === 'user' ? '#10B981' : '#1a1a1a',
                color: msg.from === 'user' ? '#fff' : '#ddd',
                borderBottomRightRadius: msg.from === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: msg.from === 'bot' ? '4px' : '12px',
              }}>
                {msg.from === 'bot' && <span style={{ marginRight: '8px' }}>🤖</span>}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ color: '#666', fontSize: '13px' }}>🤖 Analyzing...</div>
          )}
        </div>

        {/* SIMULATION FORM */}
        <div className="sim-form">
          <h3>Configure Simulation</h3>
          <div className="form-row">
            <div className="form-field">
              <label>Select Product</label>
              <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                <option value="">-- Choose a product --</option>
                {products.map((p, i) => <option key={i} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>New Price (KES)</label>
              <input type="number" placeholder="e.g. 60" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
            </div>
            <div className="form-field">
              <label>New Quantity</label>
              <input type="number" placeholder="e.g. 100" value={newQty} onChange={e => setNewQty(e.target.value)} />
            </div>
          </div>
          
          {result && (
            <div className="results-grid" style={{ marginBottom: '16px' }}>
              <div className="result-card">
                <p className="result-label">Original Revenue</p>
                <p className="result-value">KES {result.original_revenue.toLocaleString()}</p>
              </div>
              <div className="result-card">
                <p className="result-label">Projected Revenue</p>
                <p className="result-value">KES {result.projected_revenue.toLocaleString()}</p>
              </div>
              <div className="result-card">
                <p className="result-label">Projected Profit</p>
                <p className="result-value" style={{ color: result.projected_profit >= 0 ? '#10B981' : '#ff4444' }}>
                  KES {result.projected_profit.toLocaleString()}
                </p>
              </div>
              <div className={`result-card ${result.difference >= 0 ? 'positive' : 'negative'}`}>
                <p className="result-label">Profit Difference</p>
                <p className="result-value">{result.difference >= 0 ? '+' : ''}KES {result.difference.toLocaleString()}</p>
                <p className="result-note">{result.percent}% {result.difference >= 0 ? 'increase' : 'decrease'}</p>
              </div>
            </div>
          )}

          <div className="sim-buttons">
            <button className="add-btn" onClick={simulate}>▶ Run Simulation</button>
            <button className="reset-btn" onClick={reset}>↺ Reset Chat</button>
          </div>
        </div>

        {products.length === 0 && (
          <div className="recent-sales" style={{ marginTop: '24px' }}>
            <p className="empty-state">No products found. Add income entries first.</p>
          </div>
        )}
      </div>
    </div>
  )
}