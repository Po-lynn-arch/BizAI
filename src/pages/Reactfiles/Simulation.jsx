import '../CSS/Dashboard.css'
import '../CSS/Simulation.css'
import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from '../../components/Sidebar'
import { API_URL } from '../../hooks/config'
import {BottomNavBar} from '../../components/BottomNavBar'

const SCENARIOS = [
  { label: '📈 Raise price by 10%', apply: (price, qty) => ({ price: Math.round(price * 1.1), qty }) },
  { label: '📉 Lower price by 10%', apply: (price, qty) => ({ price: Math.round(price * 0.9), qty }) },
  { label: '🛒 Double the stock quantity', apply: (price, qty) => ({ price, qty: qty * 2 }) },
  { label: '✂️ Halve the stock quantity', apply: (price, qty) => ({ price, qty: Math.round(qty / 2) }) },
  { label: '🔥 Flash sale — 20% off', apply: (price, qty) => ({ price: Math.round(price * 0.8), qty: Math.round(qty * 1.5) }) },
  { label: '💰 Premium pricing — 25% up', apply: (price, qty) => ({ price: Math.round(price * 1.25), qty: Math.round(qty * 0.8) }) },
]

export function Simulation() {
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), [])

  const [income, setIncome] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newQty, setNewQty] = useState('')
  const [result, setResult] = useState(null)
  const [messages, setMessages] = useState([
    { from: 'bot', text: "👋 Hello! I'm your Business Advisor. Select a product and enter new price and quantity — or choose a preset scenario — to see how it affects your revenue." }
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/sales?user_id=${user.id}`)
      .then(res => res.json())
      .then(d => setIncome(Array.isArray(d) ? d : []))
      .catch(() => setIncome([]))
  }, [user.id])

  const products = useMemo(() => [...new Set(income.map(s => s.product))], [income])

  // Get average price and qty for selected product to use with scenarios
  const productStats = useMemo(() => {
    if (!selectedProduct) return { avgPrice: 0, totalQty: 0 }
    const productSales = income.filter(s => s.product === selectedProduct)
    if (productSales.length === 0) return { avgPrice: 0, totalQty: 0 }
    const avgPrice = Math.round(productSales.reduce((sum, s) => sum + s.price_per_unit, 0) / productSales.length)
    const totalQty = productSales.reduce((sum, s) => sum + s.qty_sold, 0)
    return { avgPrice, totalQty }
  }, [income, selectedProduct])

  function applyScenario(scenario) {
    if (!selectedProduct) {
      alert('Please select a product first')
      return
    }
    const { price, qty } = scenario.apply(productStats.avgPrice || 100, productStats.totalQty || 10)
    setNewPrice(String(price))
    setNewQty(String(qty))
  }

  async function simulate() {
    if (!selectedProduct || !newPrice || !newQty) {
      alert('Please fill in all fields')
      return
    }

    const userMsg = `What if I sell ${selectedProduct} at KES ${newPrice} with ${newQty} units?`
    setMessages(prev => [...prev, { from: 'user', text: userMsg }])
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/simulate`, {
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
      setMessages(prev => [...prev, { from: 'bot', text: data.verdict }])
      setSelectedProduct(''); setNewPrice(''); setNewQty('')
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: '⚠️ Failed to run simulation. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMessages([{ from: 'bot', text: "👋 Hello! I'm your Business Advisor. Select a product and enter new price and quantity — or choose a preset scenario — to see how it affects your revenue." }])
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
            <p>Test business scenarios before committing real money</p>
          </div>
        </header>

        {/* CHAT WINDOW */}
        <div style={{
          background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px',
          padding: '20px', marginBottom: '24px', minHeight: '240px',
          maxHeight: '360px', overflowY: 'auto', display: 'flex',
          flexDirection: 'column', gap: '12px'
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px',
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
          {loading && <div style={{ color: '#666', fontSize: '13px' }}>🤖 Analyzing...</div>}
        </div>

        <div className="sim-form">
          {/* PRODUCT SELECTOR */}
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-field">
              <label>Select Product</label>
              <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                <option value="">-- Choose a product --</option>
                {products.map((p, i) => <option key={i} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* PRESET SCENARIOS */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '10px', fontWeight: '600' }}>
              ⚡ Quick Scenarios — select a product first, then click a scenario:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SCENARIOS.map((s, i) => (
                <button key={i} onClick={() => applyScenario(s)} style={{
                  padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '600',
                  background: 'transparent', color: '#aaa',
                  border: '1px solid #2a2a2a',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.target.style.borderColor = '#10B981'; e.target.style.color = '#10B981' }}
                  onMouseLeave={e => { e.target.style.borderColor = '#2a2a2a'; e.target.style.color = '#aaa' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* MANUAL INPUTS */}
          <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '10px', fontWeight: '600' }}>
            ✏️ Or enter custom values:
          </p>
          <div className="form-row">
            <div className="form-field">
              <label>New Price (KES)</label>
              <input type="number" placeholder="e.g. 60" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
            </div>
            <div className="form-field">
              <label>New Quantity</label>
              <input type="number" placeholder="e.g. 100" value={newQty} onChange={e => setNewQty(e.target.value)} />
            </div>
          </div>

          {/* RESULTS */}
          {result && (
            <div className="results-grid" style={{ marginBottom: '16px' }}>
              <div className="result-card">
                <p className="result-label">Original Revenue</p>
                <p className="result-value">KES {result.original_revenue?.toLocaleString()}</p>
              </div>
              <div className="result-card">
                <p className="result-label">Projected Revenue</p>
                <p className="result-value">KES {result.projected_revenue?.toLocaleString()}</p>
              </div>
              <div className="result-card">
                <p className="result-label">Projected Profit</p>
                <p className="result-value" style={{ color: result.projected_profit >= 0 ? '#10B981' : '#ff4444' }}>
                  KES {result.projected_profit?.toLocaleString()}
                </p>
              </div>
              <div className={`result-card ${result.difference >= 0 ? 'positive' : 'negative'}`}>
                <p className="result-label">Profit Difference</p>
                <p className="result-value">{result.difference >= 0 ? '+' : ''}KES {result.difference?.toLocaleString()}</p>
                <p className="result-note">{result.percent}% {result.difference >= 0 ? 'increase' : 'decrease'}</p>
              </div>
            </div>
          )}

          <div className="sim-buttons">
            <button className="add-btn" onClick={simulate} disabled={loading}>
              {loading ? 'Analyzing...' : '▶ Run Simulation'}
            </button>
            <button className="reset-btn" onClick={reset}>↺ Reset Chat</button>
          </div>
        </div>

        {products.length === 0 && (
          <div className="recent-sales" style={{ marginTop: '24px' }}>
            <p className="empty-state">No products found. Record some sales first to use the simulator.</p>
          </div>
        )}
      </div>
      <BottomNavBar/>
    </div>
  )
}