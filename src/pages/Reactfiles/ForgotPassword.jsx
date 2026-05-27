import '../CSS/Authentication.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../hooks/config'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit() {
    setError('')
    setMessage('')
    if (!email) { setError('Please enter your email address'); return }
    setLoading(true)
    try {
      const res = await fetch('${API_URL/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="logo">BizAI</span>
          <h2>Forgot Password</h2>
          <p>Enter your email and we'll send a reset link</p>
        </div>

        {message ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>📬</p>
              <p style={{ color: '#10B981', fontSize: '14px', lineHeight: '1.6' }}>{message}</p>
            </div>
            <button className="auth-btn" onClick={() => navigate('/login')}>Back to Login</button>
          </div>
        ) : (
          <>
            <div className="auth-field">
              <label>Email address</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

            <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <p style={{ cursor: 'pointer', color: '#4f46e5', marginTop: '12px', fontSize: '13px', textAlign: 'center' }}
              onClick={() => navigate('/login')}>
              ← Back to login
            </p>
          </>
        )}
      </div>
    </div>
  )
}
