import '../CSS/DataEntry.css'
import { useState, useEffect } from 'react'
import { Sidebar } from '../../components/Sidebar'
import { API_URL } from '../../hooks/config'
import { BottomNavBar } from '../../components/BottomNavBar'


export function Stock() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [stock, setStock] = useState([])
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [cost, setCost] = useState('')
  const [duration, setDuration] = useState('30')
  const [suggestedPrice, setSuggestedPrice] = useState('')
  const [stockType, setStockType] = useState('new')
  const [mode, setMode] = useState('single')
  const [entries, setEntries] = useState([{ qty_bought: '', cost_per_unit: '', suggested_price: '' }])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [durationWarning, setDurationWarning] = useState('')

  function loadStock() {
    fetch(`${API_URL}/api/stock?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => setStock(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  useEffect(() => { loadStock() }, [])

  // Duration warning logic
  function handleDurationChange(val) {
    setDuration(val)
    const days = Number(val)
    if (days >= 90) {
      setDurationWarning('⚠️ Stocking for 90+ days is risky — products may expire, go out of season, or tie up capital unnecessarily. Consider smaller, more frequent restocks.')
    } else if (days >= 60) {
      setDurationWarning('⚠️ 60+ days is a long time to hold stock. Make sure this product has a long shelf life and consistent demand before committing.')
    } else if (days >= 45) {
      setDurationWarning('💡 45+ days of stock is on the higher end. Ensure demand is consistent before purchasing this quantity.')
    } else {
      setDurationWarning('')
    }
  }

  function addEntry() { setEntries([...entries, { qty_bought: '', cost_per_unit: '', suggested_price: '' }]) }
  function removeEntry(idx) {
    if (entries.length === 1) return
    setEntries(entries.filter((_, i) => i !== idx))
  }
  function updateEntry(idx, field, value) {
    const updated = [...entries]
    updated[idx][field] = value
    setEntries(updated)
  }

  async function addStock() {
    setError(''); setSuccess('')
    if (!product) { setError('Please enter a product name'); return }

    // Confirm if duration is risky
    const days = Number(duration)
    if (days >= 90) {
      const confirmed = window.confirm(
        `⚠️ You are stocking for ${days} days (${Math.round(days/30)} months). This is considered high-risk as products may expire, go out of season, or tie up capital. Are you sure you want to continue?`
      )
      if (!confirmed) return
    }

    setLoading(true)

    try {
      if (mode === 'single') {
        if (!qty) { setError('Please enter quantity'); setLoading(false); return }
        if (stockType === 'new' && !cost) { setError('Please enter cost per unit'); setLoading(false); return }

        const tempStock = {
          id: `temp_${Date.now()}`,
          product, qty_bought: Number(qty),
          qty_remaining: Number(qty),
          cost_per_unit: stockType === 'new' ? Number(cost) : 0,
          suggested_price: Number(suggestedPrice) || 0,
          total_cost: stockType === 'new' ? Number(qty) * Number(cost) : 0,
          duration_days: Number(duration),
          stock_type: stockType,
          date_added: new Date().toLocaleDateString()
        }
        setStock(prev => [tempStock, ...prev])
        setProduct(''); setQty(''); setCost(''); setSuggestedPrice(''); setDuration('30'); setDurationWarning('')

        const res = await fetch(`${API_URL}/api/stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id, product,
            qty_bought: Number(qty),
            cost_per_unit: stockType === 'new' ? Number(cost) : 0,
            suggested_price: Number(suggestedPrice) || 0,
            duration_days: Number(duration),
            stock_type: stockType,
            date: new Date().toLocaleDateString()
          })
        })
        const data = await res.json()
        if (res.ok) {
          setSuccess('Stock added successfully!')
          loadStock()
        } else {
          setError(data.error)
          setStock(prev => prev.filter(s => s.id !== tempStock.id))
        }
      } else {
        const validEntries = entries.filter(e => Number(e.qty_bought) > 0)
        if (validEntries.length === 0) { setError('Add at least one entry with quantity'); setLoading(false); return }

        for (const e of validEntries) {
          await fetch(`${API_URL}/api/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id, product,
              qty_bought: Number(e.qty_bought),
              cost_per_unit: stockType === 'new' ? Number(e.cost_per_unit) : 0,
              suggested_price: Number(e.suggested_price) || 0,
              duration_days: Number(duration),
              stock_type: stockType,
              date: new Date().toLocaleDateString()
            })
          })
        }
        setSuccess('All stock entries added!')
        setEntries([{ qty_bought: '', cost_per_unit: '', suggested_price: '' }])
        setProduct(''); setDurationWarning('')
        loadStock()
      }
    } catch {
      setError('Failed to add stock. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>📦 Stock Management</h2>
            <p>Record products you have bought to sell</p>
          </div>
        </header>

        <div className="entry-form">
          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-field">
              <label>Stock Type</label>
              <select value={stockType} onChange={e => setStockType(e.target.value)}>
                <option value="new">🛒 New Purchase — buying today</option>
                <option value="existing">📋 Existing Stock — already had this</option>
              </select>
            </div>
          </div>

          <div style={{
            background: stockType === 'new' ? '#1a1a0d' : '#0d1b2b',
            border: `1px solid ${stockType === 'new' ? '#FFA500' : '#3b82f6'}`,
            borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
            color: stockType === 'new' ? '#FFA500' : '#93c5fd', fontSize: '14px'
          }}>
            {stockType === 'new'
              ? '🛒 New Purchase — cost will be tracked for profit calculations.'
              : '📋 Existing Stock — only quantity tracked. No cost recorded.'}
          </div>

          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-field">
              <label>Product Name</label>
              <input
                placeholder="e.g. Milk, Bread, Trousers"
                value={product}
                onChange={e => setProduct(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Duration (days)</label>
              <input
                type="number"
                placeholder="e.g. 30"
                min="1"
                value={duration}
                onChange={e => handleDurationChange(e.target.value)}
              />
              <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                How many days will this stock last?
              </p>
            </div>
          </div>

          {/* Duration warning */}
          {durationWarning && (
            <div style={{
              background: Number(duration) >= 90 ? '#2b0d0d' : '#1a1400',
              border: `1px solid ${Number(duration) >= 90 ? '#ff4444' : '#FFA500'}`,
              borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
              color: Number(duration) >= 90 ? '#ff4444' : '#FFA500',
              fontSize: '13px'
            }}>
              {durationWarning}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[['single', '📦 Single Entry'], ['multi', '🗂 Multiple Entries']].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                background: mode === m ? '#FFA500' : 'transparent',
                color: mode === m ? '#000' : '#aaa',
                border: mode === m ? 'none' : '1px solid #2a2a2a'
              }}>{label}</button>
            ))}
          </div>

          {mode === 'single' ? (
            <div className="form-row">
              <div className="form-field">
                <label>Quantity</label>
                <input type="number" placeholder="e.g. 100" value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              {stockType === 'new' && (
                <>
                  <div className="form-field">
                    <label>Cost per Unit (KES)</label>
                    <input type="number" placeholder="e.g. 50" value={cost} onChange={e => setCost(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Suggested Selling Price (KES)</label>
                    <input type="number" placeholder="e.g. 80" value={suggestedPrice} onChange={e => setSuggestedPrice(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div style={{ background: '#0d1b2b', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#93c5fd' }}>
                💡 Use this when you bought the same product in batches at different costs.
              </div>
              {entries.map((entry, idx) => (
                <div key={idx} className="form-row" style={{ alignItems: 'flex-end', marginBottom: '10px' }}>
                  <div className="form-field">
                    <label>Qty (Batch {idx + 1})</label>
                    <input type="number" placeholder="e.g. 50" value={entry.qty_bought}
                      onChange={e => updateEntry(idx, 'qty_bought', e.target.value)} />
                  </div>
                  {stockType === 'new' && (
                    <>
                      <div className="form-field">
                        <label>Cost/Unit (KES)</label>
                        <input type="number" placeholder="e.g. 50" value={entry.cost_per_unit}
                          onChange={e => updateEntry(idx, 'cost_per_unit', e.target.value)} />
                      </div>
                      <div className="form-field">
                        <label>Sell Price (KES)</label>
                        <input type="number" placeholder="e.g. 80" value={entry.suggested_price}
                          onChange={e => updateEntry(idx, 'suggested_price', e.target.value)} />
                      </div>
                    </>
                  )}
                  <button onClick={() => removeEntry(idx)} style={{
                    background: '#2b0d0d', border: '1px solid #ff4444', color: '#ff4444',
                    borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', marginBottom: '4px'
                  }}>✕</button>
                </div>
              ))}
              <button onClick={addEntry} style={{
                background: 'transparent', border: '1px dashed #FFA500', color: '#FFA500',
                borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', marginBottom: '16px', fontSize: '13px'
              }}>+ Add Another Batch</button>
            </>
          )}

          {error && <p style={{ color: 'red', fontSize: '14px', marginTop: '8px' }}>{error}</p>}
          {success && <p style={{ color: '#10B981', fontSize: '14px', marginTop: '8px' }}>✅ {success}</p>}

          <button className="add-btn" style={{ background: loading ? '#555' : '#FFA500', color: '#000' }} onClick={addStock} disabled={loading}>
            {loading ? 'Adding...' : '+ Add Stock'}
          </button>
        </div>

        <div className="recent-sales">
          <h3>Current Stock ({stock.length} products)</h3>
          {stock.length === 0 ? <p className="empty-state">No stock added yet.</p> : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Bought</th>
                  <th>Remaining</th>
                  <th>Cost/Unit</th>
                  <th>Sell Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(s => {
                  const percent = Math.round((s.qty_remaining / s.qty_bought) * 100)
                  const color = percent <= 10 ? '#ff4444' : percent <= 30 ? '#FFA500' : '#10B981'
                  return (
                    <tr key={s.id} style={{ opacity: String(s.id).startsWith('temp_') ? 0.6 : 1 }}>
                      <td>{s.product}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: '8px', fontSize: '12px',
                          background: s.stock_type === 'new' ? '#2b2000' : '#0d1b2b',
                          color: s.stock_type === 'new' ? '#FFA500' : '#93c5fd'
                        }}>
                          {s.stock_type === 'new' ? '🛒 New' : '📋 Existing'}
                        </span>
                      </td>
                      <td>{s.qty_bought} units</td>
                      <td style={{ color, fontWeight: 'bold' }}>{s.qty_remaining} units</td>
                      <td>KES {s.cost_per_unit}</td>
                      <td>KES {s.suggested_price || '—'}</td>
                      <td>{s.duration_days} days</td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: '8px', fontSize: '12px',
                          background: percent <= 10 ? '#2b0d0d' : percent <= 30 ? '#2b2000' : '#0d2b1f',
                          color
                        }}>{percent}% remaining</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <BottomNavBar/>
    </div>
  )
}