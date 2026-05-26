import '../CSS/DataEntry.css'
import { useState, useEffect } from 'react'
import { Sidebar } from '../../components/Sidebar'

export function Stock() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [stock, setStock] = useState([])
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [cost, setCost] = useState('')
  const [duration, setDuration] = useState('30')
  const [suggestedPrice, setSuggestedPrice] = useState('')
  const [stockType, setStockType] = useState('new')
  

  function loadStock() {
    fetch(`http://127.0.0.1:5000/api/stock?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => setStock(data))
      .catch(err => console.error('Failed to load stock:', err))
  }

  useEffect(() => {
    loadStock()
  }, [])

  async function addStock() {
    // Validation
    if (!product || !qty) {
      alert('Please fill in all required fields')
      return
    }

    if (stockType === 'new' && !cost) {
      alert('Please enter cost per unit')
      return
    }

    try {
      await fetch('http://127.0.0.1:5000/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          product,
          qty_bought: Number(qty),
          cost_per_unit:
            stockType === 'new' ? Number(cost) : 0,
          suggested_price:
            stockType === 'new'
              ? Number(suggestedPrice) || 0
              : 0,
          duration_days: Number(duration),
          stock_type: stockType,
          date: new Date().toLocaleDateString()
        })
      })

      loadStock()

      // Reset form
      setProduct('')
      setQty('')
      setCost('')
      setSuggestedPrice('')
      setDuration('30')
      setStockType('new')
    } catch (err) {
      console.error('Failed to add stock:', err)
      alert('Failed to add stock')
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

        

        {/* ROW 1 */}
        <div className="form-row" style={{ marginBottom: '16px' }}>
          <div className="form-field">
            <label>Stock Type</label>

            <select
              value={stockType}
              onChange={e => setStockType(e.target.value)}
            >
              <option value="new">
                🛒 New Purchase — buying today
              </option>

              <option value="existing">
                📋 Existing Stock — already had this
              </option>
            </select>
          </div>
        </div>

        {/* INFO BOX */}
        <div
          style={{
            background:
              stockType === 'new'
                ? '#1a1a0d'
                : '#0d1b2b',

            border: `1px solid ${
              stockType === 'new'
                ? '#FFA500'
                : '#3b82f6'
            }`,

            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',

            color:
              stockType === 'new'
                ? '#FFA500'
                : '#93c5fd',

            fontSize: '14px'
          }}
        >
          {stockType === 'new'
            ? '🛒 New Purchase — stock you are buying today. Cost will be tracked and used in your profit calculations.'
            : '📋 Existing Stock — stock you already had before using BizAI. Only the quantity will be tracked. No cost will be recorded so it does not affect your profit.'}
        </div>

        {/* ROW 2 */}
        <div className="form-row">

          <div className="form-field">
            <label>Product Name</label>

            <input
              placeholder="e.g. Milk, Bread, Sugar"
              value={product}
              onChange={e => setProduct(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Quantity Bought</label>

            <input
              type="number"
              placeholder="e.g. 700"
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </div>

          {stockType === 'new' && (
            <>
              <div className="form-field">
                <label>Cost per Unit (KES)</label>

                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                />
              </div>

              

              <div className="form-field">
                <label>Suggested Selling Price (KES)</label>

                <input
                  type="number"
                  placeholder="e.g. 80"
                  value={suggestedPrice}
                  onChange={e =>
                    setSuggestedPrice(e.target.value)
                  }
                />
              </div>
            </>
          )}

          
          <div className="form-field">
            <label>This stock is for</label>

            <select
              value={duration}
              onChange={e => setDuration(e.target.value)}
            >
              <option value="1">
                Today only (1 day)
              </option>

              <option value="7">
                This week (7 days)
              </option>

              <option value="30">
                This month (30 days)
              </option>
            </select>
          </div>

  </div>
          {/* SUMMARY */}
          {stockType === 'new' &&
            qty &&
            cost &&
            suggestedPrice && (
              <div
                style={{
                  background: '#111',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  fontSize: '13px'
                }}
              >
                <p style={{ color: '#FFA500' }}>
                  💰 Total investment: KES{' '}
                  {(
                    Number(qty) * Number(cost)
                  ).toLocaleString()}
                </p>

                <p style={{ color: '#aaa' }}>
                  📅 Daily cost: KES{' '}
                  {(
                    (Number(qty) * Number(cost)) /
                    Number(duration)
                  ).toFixed(0)}
                </p>

                <p style={{ color: '#10B981' }}>
                  📈 Expected revenue if all sold: KES{' '}
                  {(
                    Number(qty) *
                    Number(suggestedPrice)
                  ).toLocaleString()}
                </p>

                <p style={{ color: '#fff' }}>
                  💡 Expected profit: KES{' '}
                  {(
                    (Number(suggestedPrice) -
                      Number(cost)) *
                    Number(qty)
                  ).toLocaleString()}
                </p>
              </div>
            )}

          {/* BUTTON */}
          <button
            className="add-btn"
            style={{ background: '#FFA500' }}
            onClick={addStock}
          >
            + Add Stock
          </button>
        </div>

        {/* STOCK TABLE */}
        <div className="recent-sales">
          <h3>
            Current Stock ({stock.length} products)
          </h3>

          {stock.length === 0 ? (
            <p className="empty-state">
              No stock added yet.
            </p>
          ) : (
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
                  const percent = Math.round(
                    (s.qty_remaining / s.qty_bought) * 100
                  )

                  const color =
                    percent <= 10
                      ? '#ff4444'
                      : percent <= 30
                      ? '#FFA500'
                      : '#10B981'

                  return (
                    <tr key={s.id}>
                      <td>{s.product}</td>

                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',

                            background:
                              s.stock_type === 'new'
                                ? '#2b2000'
                                : '#0d1b2b',

                            color:
                              s.stock_type === 'new'
                                ? '#FFA500'
                                : '#93c5fd'
                          }}
                        >
                          {s.stock_type === 'new'
                            ? '🛒 New'
                            : '📋 Existing'}
                        </span>
                      </td>

                      <td>{s.qty_bought} units</td>

                      <td
                        style={{
                          color,
                          fontWeight: 'bold'
                        }}
                      >
                        {s.qty_remaining} units
                      </td>

                      <td>
                        KES {s.cost_per_unit}
                      </td>

                      <td>
                        KES {s.suggested_price || '—'}
                      </td>

                      <td>
                        {s.duration_days === 1
                          ? 'Daily'
                          : s.duration_days === 7
                          ? 'Weekly'
                          : 'Monthly'}
                      </td>

                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',

                            background:
                              percent <= 10
                                ? '#2b0d0d'
                                : percent <= 30
                                ? '#2b2000'
                                : '#0d2b1f',

                            color
                          }}
                        >
                          {percent}% remaining
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}