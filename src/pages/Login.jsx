import './Authentication.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields'); return }

    const response = await fetch('http://127.0.0.1:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/Dashboard')
    } else {
      setError(data.error)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="logo">BizAI</span>
          <h2>Welcome back</h2>
          <p>Login to manage your business</p>
        </div>
        <div className="auth-field">
          <label>Email address</label>
          <input placeholder="you@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '16px', userSelect: 'none' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>
        </div>
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
        <button className="auth-btn" onClick={handleLogin}>Login</button>
        <p className="auth-switch">New user?{' '}<span onClick={() => navigate('/Register')}>Create an account</span></p>
      </div>
    </div>
  )
}