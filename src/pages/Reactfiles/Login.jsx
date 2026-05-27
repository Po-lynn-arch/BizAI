import '../CSS/Authentication.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../hooks/config'

export function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [showResend, setShowResend] = useState(false)

  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    setInfo('')
    setShowResend(false)

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        '${API_URL/api/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      )

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem(
          'user',
          JSON.stringify(data.user)
        )

        navigate('/Dashboard')

        return
      }

      if (
        data.error &&
        data.error.includes('verify')
      ) {
        setError(data.error)
        setShowResend(true)
        return
      }

      setError(data.error || 'Login failed')
    } catch (err) {
      console.error(err)
      setError('Server error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resendVerification() {
    try {
      const res = await fetch(
        '${API_URL/api/resend-verification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        }
      )

      const data = await res.json()

      if (res.ok) {
        setInfo(
          'Verification email sent successfully.'
        )
        setError('')
      } else {
        setError(data.error || 'Failed to resend')
      }
    } catch {
      setError('Network error')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <span className="logo">BizAI</span>

          <h2>Welcome back</h2>

          <p>
            Login to manage your business
          </p>
        </div>

        <div className="auth-field">
          <label>Email address</label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e =>
              setEmail(e.target.value)
            }
          />
        </div>

        <div className="auth-field">
          <label>Password</label>

          <div style={{ position: 'relative' }}>
            <input
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              placeholder="Enter your password"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              style={{
                width: '100%',
                paddingRight: '60px',
                boxSizing: 'border-box'
              }}
            />

            <span
              onClick={() =>
                setShowPassword(!showPassword)
              }
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: '#10B981',
                fontWeight: '600'
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>
        </div>

        {error && (
          <p style={{ color: 'red' }}>
            {error}
          </p>
        )}

        {info && (
          <p style={{ color: '#10B981' }}>
            {info}
          </p>
        )}

        {showResend && (
          <button
            onClick={resendVerification}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4f46e5',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            Resend verification email
          </button>
        )}

        <button
          className="auth-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading
            ? 'Logging in...'
            : 'Login'}
        </button>

        <p
          style={{
            marginTop: '12px',
            cursor: 'pointer',
            color: '#4f46e5',
            textAlign: 'center',
            fontSize: '12px'
          }}
          onClick={() =>
            navigate('/forgot-password')
          }
        >
          Forgot password?
        </p>

        <p className="auth-switch">
          New user?{' '}

          <span
            onClick={() =>
              navigate('/register')
            }
          >
            Create an account
          </span>
        </p>
      </div>
    </div>
  )
}