import '../CSS/DataEntry.css'
import { useState, useEffect } from 'react'
import { Sidebar } from '../../components/Sidebar'
import { API_URL } from '../../hooks/config'
import { BottomNavBar } from '../../components/BottomNavBar'

export function SalesEntry() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [sales, setSales] = useState([])
  const [stock, setStock] = useState([])
  const [product, setProduct] = useState('')
  const [mode, setMode] = useState('single')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState([{ qty_sold: '', price_per_unit: '' }])

  function loadData() {
    Promise.all([
      fetch(`${API_URL}/api/sales?user_id=${user.id}`).then(r => r.json()),
      fetch(`${API_URL}/api/stock?user_id=${user.id}`).then(r => r.json())
    ]).then(([salesData, stockData]) => {
      setSales(Array.isArray(salesData) ? salesData : [])
      setStock(Array.isArray(stockData) ? stockData : [])
    }).catch(() => {})
  }

  useEffect(() => { loadData() }, [])

  const selectedStock = stock.find(s => s.product === product)
  const today = new Date().toLocaleDateString()
  const todaySales = sales.filter(s => s.date === today)
  const todayProfit = todaySales.reduce((sum, s) => sum + (s.profit || 0), 0)
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0)

  function addEntry() { setEntries([...entries, { qty_sold: '', price_per_unit: '' }]) }
  function removeEntry(idx) {
    if (entries.length === 1) return
    setEntries(entries.filter((_, i) => i !== idx))
  }
  function updateEntry(idx, field, value) {
    const updated = [...entries]
    updated[idx][field] = value
    setEntries(updated)
  }

  const multiTotals = entries.reduce((acc, e) => {
    const q = Number(e.qty_sold) || 0
    const p = Number(e.price_per_unit) || 0
    const cost = selectedStock?.cost_per_unit || 0
    acc.qty += q; acc.revenue += q * p; acc.profit += (p - cost) * q
    return acc
  }, { qty: 0, revenue: 0, profit: 0 })

  async function recordSingleSale() {
    setError(''); setSuccess('')
    if (!product || !qty || !price) { setError('Fill all fields'); return }

    const qtyNum = Number(qty)
    const priceNum = Number(price)
    const cost = selectedStock?.cost_per_unit || 0

    // ✅ Optimistic update
    const tempSale = {
      id: `temp_${Date.now()}`,
      product, qty_sold: qtyNum,
      price_per_unit: priceNum,
      cost_per_unit: cost,
      total_earned: qtyNum * priceNum,
      profit: (priceNum - cost) * qtyNum,
      date: today
    }
    setSales(prev => [tempSale, ...prev])
    setStock(prev => prev.map(s =>
      s.product === product
        ? { ...s, qty_remaining: s.qty_remaining - qtyNum }
        : s
    ))
    setQty(''); setPrice('')
    setSaving(true)

    try {
      const res = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id, product,
          qty_sold: qtyNum, price_per_unit: priceNum,
          date: today
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Sale recorded!')
        loadData() // refresh to get real ids
      } else {
        setError(data.error)
        // Revert on error
        setSales(prev => prev.filter(s => s.id !== tempSale.id))
        setStock(prev => prev.map(s =>
          s.product === product
            ? { ...s, qty_remaining: s.qty_remaining + qtyNum }
            : s
        ))
      }
    } catch {
      setError('Failed to record sale. Please try again.')
      setSales(prev => prev.filter(s => s.id !== tempSale.id))
    } finally {
      setSaving(false)
    }
  }

  async function recordMultiSale() {
    setError(''); setSuccess('')
    if (!product) { setError('Select a product'); return }
    const validEntries = entries.filter(e => Number(e.qty_sold) > 0 && Number(e.price_per_unit) > 0)
    if (validEntries.length === 0) { setError('Add at least one entry with qty and price'); return }

    const cost = selectedStock?.cost_per_unit || 0
    const totalQty = validEntries.reduce((sum, e) => sum + Number(e.qty_sold), 0)

    // ✅ Optimistic update
    const tempSales = validEntries.map(e => ({
      id: `temp_${Date.now()}_${Math.random()}`,
      product,
      qty_sold: Number(e.qty_sold),
      price_per_unit: Number(e.price_per_unit),
      cost_per_unit: cost,
      total_earned: Number(e.qty_sold) * Number(e.price_per_unit),
      profit: (Number(e.price_per_unit) - cost) * Number(e.qty_sold),
      date: today
    }))
    setSales(prev => [...tempSales, ...prev])
    setStock(prev => prev.map(s =>
      s.product === product
        ? { ...s, qty_remaining: s.qty_remaining - totalQty }
        : s
    ))
    setEntries([{ qty_sold: '', price_per_unit: '' }])
    setSaving(true)

    try {
      const res = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id, product,
          entries: validEntries.map(e => ({
            qty_sold: Number(e.qty_sold),
            price_per_unit: Number(e.price_per_unit)
          })),
          date: today
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`${validEntries.length} sale entries recorded!`)
        loadData()
      } else {
        setError(data.error)
        setSales(prev => prev.filter(s => !String(s.id).startsWith('temp_')))
        loadData()
      }
    } catch {
      setError('Failed to record sales. Please try again.')
      setSales(prev => prev.filter(s => !String(s.id).startsWith('temp_')))
    } finally {
      setSaving(false)
    }
  }

  async function deleteSale(id) {
    if (!window.confirm('Are you sure you want to delete this sale? Stock will be restored.')) return
    await fetch(`${API_URL}/api/sales/${id}`, { method: 'DELETE' })
    loadData()
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <h2>📝 Sales</h2>
          <p>Record sales — profit calculated automatically from your stock cost</p>
        </header>

        <div className="entry-form">
          <div className="form-row">
            <div className="form-field">
              <label>Product</label>
              <select value={product} onChange={e => setProduct(e.target.value)}>
                <option value="">-- Select product --</option>
                {stock.map(s => (
                  <option key={s.id} value={s.product}>
                    {s.product} ({s.qty_remaining} units left)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedStock && (
            <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#aaa' }}>
              Cost per unit: <strong style={{ color: '#FFA500' }}>KES {selectedStock.cost_per_unit}</strong> &nbsp;|&nbsp;
              In stock: <strong style={{ color: '#10B981' }}>{selectedStock.qty_remaining} units</strong>
              {selectedStock.suggested_price > 0 && <>&nbsp;|&nbsp; Suggested price: <strong style={{ color: '#3b82f6' }}>KES {selectedStock.suggested_price}</strong></>}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[['single', '📝 Single Price'], ['multi', '🗂 Multiple Prices']].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                background: mode === m ? '#10B981' : 'transparent',
                color: mode === m ? '#fff' : '#aaa',
                border: mode === m ? 'none' : '1px solid #2a2a2a'
              }}>{label}</button>
            ))}
          </div>

          {mode === 'single' ? (
            <>
              <div className="form-row">
                <div className="form-field">
                  <label>Qty Sold</label>
                  <input type="number" placeholder="e.g. 5" value={qty} onChange={e => setQty(e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Selling Price per Unit (KES)</label>
                  <input type="number" placeholder="e.g. 150" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
              </div>
              {selectedStock && qty && price && (
                <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px' }}>
                  <p style={{ color: '#10B981' }}>Revenue: KES {(Number(qty) * Number(price)).toLocaleString()}</p>
                  <p style={{ color: '#fff' }}>Profit: KES {((Number(price) - selectedStock.cost_per_unit) * Number(qty)).toLocaleString()}</p>
                  <p style={{ color: '#aaa' }}>Remaining after sale: {selectedStock.qty_remaining - Number(qty)} units</p>
                </div>
              )}
              <button className="add-btn" onClick={recordSingleSale} disabled={saving}>
                {saving ? 'Saving...' : '+ Record Sale'}
              </button>
            </>
          ) : (
            <>
              <div style={{ background: '#0d1b2b', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#93c5fd' }}>
                💡 Use this when you sold the same product at different prices.
              </div>
              {entries.map((entry, idx) => (
                <div key={idx} className="form-row" style={{ alignItems: 'flex-end', marginBottom: '10px' }}>
                  <div className="form-field">
                    <label>Qty Sold (Price {idx + 1})</label>
                    <input type="number" placeholder="e.g. 3" value={entry.qty_sold}
                      onChange={e => updateEntry(idx, 'qty_sold', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Price per Unit (KES)</label>
                    <input type="number" placeholder="e.g. 900" value={entry.price_per_unit}
                      onChange={e => updateEntry(idx, 'price_per_unit', e.target.value)} />
                  </div>
                  {entry.qty_sold && entry.price_per_unit && selectedStock && (
                    <div style={{ padding: '8px', fontSize: '12px', color: '#10B981', minWidth: '140px' }}>
                      Profit: KES {((Number(entry.price_per_unit) - selectedStock.cost_per_unit) * Number(entry.qty_sold)).toLocaleString()}
                    </div>
                  )}
                  <button onClick={() => removeEntry(idx)} style={{ background: '#2b0d0d', border: '1px solid #ff4444', color: '#ff4444', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', marginBottom: '4px' }}>✕</button>
                </div>
              ))}
              <button onClick={addEntry} style={{ background: 'transparent', border: '1px dashed #3b82f6', color: '#3b82f6', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', marginBottom: '16px', fontSize: '13px' }}>
                + Add Another Price
              </button>
              {multiTotals.qty > 0 && (
                <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px' }}>
                  <p style={{ color: '#10B981' }}>Total qty: {multiTotals.qty} units &nbsp;|&nbsp; Total revenue: KES {multiTotals.revenue.toLocaleString()}</p>
                  <p style={{ color: '#fff' }}>Total profit: KES {multiTotals.profit.toLocaleString()}</p>
                </div>
              )}
              <button className="add-btn" onClick={recordMultiSale} disabled={saving}>
                {saving ? 'Saving...' : '+ Record All Sales'}
              </button>
            </>
          )}

          {error && <p style={{ color: 'red', fontSize: '14px', marginTop: '8px' }}>{error}</p>}
          {success && <p style={{ color: '#10B981', fontSize: '14px', marginTop: '8px' }}>✅ {success}</p>}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div className="card" style={{ flex: 1 }}>
            <p className="card-label">Today's Profit</p>
            <p className="card-value" style={{ color: todayProfit >= 0 ? '#10B981' : 'red' }}>KES {todayProfit.toLocaleString()}</p>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <p className="card-label">Total Profit (All Time)</p>
            <p className="card-value" style={{ color: totalProfit >= 0 ? '#10B981' : 'red' }}>KES {totalProfit.toLocaleString()}</p>
          </div>
        </div>

        <div className="recent-sales">
          <h3>Sales History</h3>
          {sales.length === 0 ? <p className="empty-state">No sales recorded yet.</p> : (
            <table>
              <thead>
                <tr><th>Product</th><th>Qty</th><th>Price/Unit</th><th>Cost/Unit</th><th>Revenue</th><th>Profit</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} style={{ opacity: String(s.id).startsWith('temp_') ? 0.6 : 1 }}>
                    <td>{s.product}</td>
                    <td>{s.qty_sold}</td>
                    <td>KES {s.price_per_unit?.toLocaleString()}</td>
                    <td style={{ color: '#aaa' }}>KES {s.cost_per_unit?.toLocaleString()}</td>
                    <td>KES {s.total_earned?.toLocaleString()}</td>
                    <td style={{ color: s.profit >= 0 ? '#10B981' : 'red', fontWeight: 'bold' }}>KES {s.profit?.toLocaleString()}</td>
                    <td>{s.date}</td>
                    <td>
                      {!String(s.id).startsWith('temp_') && (
                        <button className="delete-btn" onClick={() => deleteSale(s.id)}>🗑</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <BottomNavBar/>
    </div>
  )
}