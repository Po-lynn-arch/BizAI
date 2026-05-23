import './DataEntry.css'
import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'

export function SalesEntry() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [sales, setSales] = useState([])
  const [stock, setStock] = useState([])
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  function loadData() {
    fetch(`http://127.0.0.1:5000/api/sales?user_id=${user.id}`)
      .then(res => res.json()).then(d => setSales(d))
    fetch(`http://127.0.0.1:5000/api/stock?user_id=${user.id}`)
      .then(res => res.json()).then(d => setStock(d))
  }

  useEffect(() => { loadData() }, [])

  const selectedStock = stock.find(s => s.product === product)

  async function recordSale() {
    if (!product || !qty || !price) { setError('Please fill in all fields'); return }
    if (Number(qty) <= 0 || Number(price) <= 0) { setError('Quantity and price must be greater than zero'); return }

    const response = await fetch('http://127.0.0.1:5000/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        product,
        qty_sold: Number(qty),
        price_per_unit: Number(price),
        date: new Date().toLocaleDateString()
      })
    })

    const data = await response.json()
    if (response.ok) {
      setError('')
      loadData()
      setQty(''); setPrice('')
    } else {
      setError(data.error)
    }
  }

  async function deleteSale(id) {
    await fetch(`http://127.0.0.1:5000/api/sales/${id}`, { method: 'DELETE' })
    loadData()
  }

  const todaySales = sales.filter(s => s.date === new Date().toLocaleDateString())
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total_earned, 0)

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>📝 Record Sales</h2>
            <p>Record products you have sold today</p>
          </div>
        </header>

        <div className="entry-form">
          <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#10B981', fontSize: '14px' }}>
            💡 Select a product from your stock, enter how many you sold and at what price. The system will automatically deduct from your stock and calculate your profit.
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Product</label>
              <select value={product} onChange={e => setProduct(e.target.value)}>
                <option value="">-- Select product --</option>
                {stock.map(s => (
                  <option key={s.id} value={s.product}>
                    {s.product} ({s.qty_remaining} units available)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Quantity Sold</label>
              <input type="number" placeholder="e.g. 45" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Selling Price per Unit (KES)</label>
              <input type="number" placeholder="e.g. 80" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>

          {selectedStock && qty && price && (
            <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '13px' }}>
              <p style={{ color: '#10B981' }}>✅ Total earned: KES {(Number(qty) * Number(price)).toLocaleString()}</p>
              <p style={{ color: '#FFA500' }}>📦 Stock cost: KES {(selectedStock.cost_per_unit * Number(qty)).toLocaleString()}</p>
              <p style={{ color: '#fff' }}>💰 Profit from this sale: KES {((Number(price) - selectedStock.cost_per_unit) * Number(qty)).toLocaleString()}</p>
              <p style={{ color: '#aaa' }}>📊 Remaining after sale: {selectedStock.qty_remaining - Number(qty)} units</p>
            </div>
          )}

          {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '8px' }}>{error}</p>}
          <button className="add-btn" onClick={recordSale}>+ Record Sale</button>
        </div>

        {/* TODAY'S SUMMARY */}
        {todaySales.length > 0 && (
          <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
            <p className="card-label">Today's Total Sales</p>
            <p className="card-value" style={{ color: '#10B981' }}>KES {todayTotal.toLocaleString()}</p>
            <p style={{ fontSize: '12px', color: '#666' }}>{todaySales.length} transactions today</p>
          </div>
        )}

        <div className="recent-sales">
          <h3>All Sales ({sales.length})</h3>
          {sales.length === 0 ? <p className="empty-state">No sales recorded yet.</p> : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty Sold</th>
                  <th>Price/Unit</th>
                  <th>Total Earned</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id}>
                    <td>{s.product}</td>
                    <td>{s.qty_sold}</td>
                    <td>KES {s.price_per_unit.toLocaleString()}</td>
                    <td style={{ color: '#10B981', fontWeight: 'bold' }}>KES {s.total_earned.toLocaleString()}</td>
                    <td>{s.date}</td>
                    <td><button className="delete-btn" onClick={() => deleteSale(s.id)}>🗑</button></td>
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