import '../CSS/Authentication.css'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setError('')
    setMessage('')
    if (!password) { setError('Enter a new password'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setError(data.error || 'Reset failed')
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
          <h2>Reset Password</h2>
          <p>Enter your new password below</p>
        </div>

        {message ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>✅</p>
              <p style={{ color: '#10B981', fontSize: '14px' }}>{message}</p>
              <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>Redirecting to login in 3 seconds...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="auth-field">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} placeholder="At least 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '60px', boxSizing: 'border-box' }} />
                <span onClick={() => setShow(!show)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#10B981', fontWeight: '600' }}>
                  {show ? 'Hide' : 'Show'}
                </span>
              </div>
            </div>

            <div className="auth-field">
              <label>Confirm New Password</label>
              <input type={show ? 'text' : 'password'} placeholder="Repeat your new password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()} />
            </div>

            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

            <button className="auth-btn" onClick={handleReset} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
