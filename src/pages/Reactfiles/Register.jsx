import '../CSS/Authentication.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../hooks/config'

function PasswordInput({ value, onChange, placeholder, show, setShow }) {
  return (
    <div style={{ position: 'relative' }}>
      <input placeholder={placeholder} type={show ? 'text' : 'password'} value={value} onChange={onChange}
        style={{ width: '100%', paddingRight: '60px', boxSizing: 'border-box' }} />
      <span onClick={() => setShow(!show)}
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#10B981', userSelect: 'none', fontWeight: '600' }}>
        {show ? 'Hide' : 'Show'}
      </span>
    </div>
  )
}

export function Register() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('new')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setError('')
    if (!name || !email || !password || !confirm) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (mode === 'new' && !businessName) { setError('Please enter your business name'); return }
    if (mode === 'join' && !code) { setError('Please enter your business code'); return }

    setLoading(true)
    const endpoint = mode === 'new' ? '/api/register' : '/api/join-business'
    const body = mode === 'new'
      ? { name, email, password, business_name: businessName }
      : { name, email, password, code }

    try {
      const response = await fetch(`${API_URL$}{endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await response.json()
      if (response.ok) {
        if (mode === 'new') {
          setSuccess(`Your account has been created successfully.Please check your email inbox and click the verification link before logging in.If you don't see the email, check your spam folder.\n\nYour business code is: ${data.business_code}\n\nShare this code with your second user to let them join.`)
        } else {
          navigate('/login')
        }
      } else {
        setError(data.error)
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
          <h2>Create your account</h2>
          <p>Start making smarter business decisions</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['new', 'join'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              background: mode === m ? '#10B981' : 'transparent',
              color: mode === m ? '#fff' : '#aaa',
              border: mode === m ? 'none' : '1px solid #2a2a2a'
            }}>
              {m === 'new' ? '🏪 New Business' : '🤝 Join Business'}
            </button>
          ))}
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ color: '#10B981', fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-line' }}>✅ {success}</p>
            </div>
            <button className="auth-btn" onClick={() => navigate('/login')}>Go to Login</button>
          </div>
        ) : (
          <>
            <div className="auth-field">
              <label>Your Full Name</label>
              <input placeholder="Enter your name" type="text" value={name} onChange={e => setName(e.target.value)} />
            </div>

            {mode === 'new' ? (
              <div className="auth-field">
                <label>Business Name</label>
                <input placeholder="e.g. Mama Njeri's Shop" type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} />
              </div>
            ) : (
              <div className="auth-field">
                <label>Business Code</label>
                <input placeholder="e.g. BIZAI-4821" type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Ask your business owner for this code</p>
              </div>
            )}

            <div className="auth-field">
              <label>Email Address</label>
              <input placeholder="your@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password (min 6 chars)" show={showPassword} setShow={setShowPassword} />
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" show={showConfirm} setShow={setShowConfirm} />
            </div>

            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
            <button className="auth-btn" onClick={handleRegister} disabled={loading}>
              {loading ? 'Please wait...' : (mode === 'new' ? 'Create Business Account' : 'Join Business')}
            </button>
            <p className="auth-switch">Already have an account? <span onClick={() => navigate('/login')}>Login</span></p>
          </>
        )}
      </div>
    </div>
  )
}
