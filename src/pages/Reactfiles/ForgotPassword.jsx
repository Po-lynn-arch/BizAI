import '../CSS/Authentication.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../hooks/config'

export function ForgotPassword() {
  const [mode, setMode] = useState('phone') // 'email' or 'phone'
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(1) // 1=enter phone, 2=enter code+password
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // ── EMAIL RESET ──────────────────────────────────────────────
  async function handleEmailSubmit() {
    setError('')
    setMessage('')
    if (!email) { setError('Please enter your email address'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
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

  // ── PHONE STEP 1 — send code ─────────────────────────────────
  async function handleSendCode() {
    setError('')
    if (!phone) { setError('Please enter your phone number'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/forgot-password-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()
      if (res.ok) {
        setStep(2)
        setMessage(data.message)
      } else {
        setError(data.error || 'Failed to send code')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── PHONE STEP 2 — verify code and reset password ────────────
  async function handleVerifyAndReset() {
    setError('')
    if (!code) { setError('Please enter the code sent to your phone'); return }
    if (!newPassword) { setError('Please enter a new password'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, password: newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        setStep(3)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setError(data.error || 'Verification failed')
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
          <p>Choose how you want to reset your password</p>
        </div>

        {/* SUCCESS STATE */}
        {step === 3 ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
              <p style={{ fontSize: '40px', marginBottom: '8px' }}>✅</p>
              <p style={{ color: '#10B981', fontSize: '15px', fontWeight: '600' }}>Password reset successfully!</p>
              <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>Redirecting to login in 3 seconds...</p>
            </div>
          </div>
        ) : message && mode === 'email' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
              <p style={{ fontSize: '40px', marginBottom: '8px' }}>📬</p>
              <p style={{ color: '#10B981', fontSize: '14px', lineHeight: '1.6' }}>{message}</p>
            </div>
            <button className="auth-btn" onClick={() => navigate('/login')}>Back to Login</button>
          </div>
        ) : (
          <>
            {/* MODE TOGGLE */}
            <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: '10px', padding: '4px', marginBottom: '24px', gap: '4px' }}>
              <button
                onClick={() => { setMode('phone'); setStep(1); setError(''); setMessage('') }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', border: 'none',
                  background: mode === 'phone' ? '#10B981' : 'transparent',
                  color: mode === 'phone' ? '#fff' : '#aaa',
                  transition: 'all 0.2s'
                }}>
                📱 Via Phone SMS
              </button>
              <button
                onClick={() => { setMode('email'); setStep(1); setError(''); setMessage('') }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', border: 'none',
                  background: mode === 'email' ? '#10B981' : 'transparent',
                  color: mode === 'email' ? '#fff' : '#aaa',
                  transition: 'all 0.2s'
                }}>
                📧 Via Email
              </button>
            </div>

            {/* EMAIL MODE */}
            {mode === 'email' && (
              <>
                <div className="auth-field">
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                  />
                </div>
                {error && <p style={{ color: '#ff4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
                <button className="auth-btn" onClick={handleEmailSubmit} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </>
            )}

            {/* PHONE MODE — STEP 1 */}
            {mode === 'phone' && step === 1 && (
              <>
                <div style={{ background: '#0d1b2b', border: '1px solid #3b82f6', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#93c5fd', fontSize: '13px' }}>
                  💡 Enter the phone number you registered with. We'll send a 6-digit code via SMS.
                </div>
                <div className="auth-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                  />
                  <p style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>Enter your number starting with 07... or +254...</p>
                </div>
                {error && <p style={{ color: '#ff4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
                <button className="auth-btn" onClick={handleSendCode} disabled={loading}>
                  {loading ? 'Sending Code...' : 'Send Code via SMS'}
                </button>
              </>
            )}

            {/* PHONE MODE — STEP 2 */}
            {mode === 'phone' && step === 2 && (
              <>
                <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#10B981', fontSize: '13px' }}>
                  ✅ Code sent to {phone}. Enter it below along with your new password.
                </div>

                <div className="auth-field">
                  <label>6-Digit Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    maxLength={6}
                    style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center' }}
                  />
                </div>

                <div className="auth-field">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={show ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ width: '100%', paddingRight: '60px', boxSizing: 'border-box' }}
                    />
                    <span
                      onClick={() => setShow(!show)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#10B981', fontWeight: '600' }}>
                      {show ? 'Hide' : 'Show'}
                    </span>
                  </div>
                </div>

                <div className="auth-field">
                  <label>Confirm New Password</label>
                  <input
                    type={show ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyAndReset()}
                  />
                </div>

                {error && <p style={{ color: '#ff4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

                <button className="auth-btn" onClick={handleVerifyAndReset} disabled={loading}>
                  {loading ? 'Verifying...' : 'Reset Password'}
                </button>

                <p
                  style={{ cursor: 'pointer', color: '#aaa', marginTop: '12px', fontSize: '13px', textAlign: 'center' }}
                  onClick={() => { setStep(1); setCode(''); setError('') }}>
                  ← Resend code
                </p>
              </>
            )}

            <p
              style={{ cursor: 'pointer', color: '#4f46e5', marginTop: '16px', fontSize: '13px', textAlign: 'center' }}
              onClick={() => navigate('/login')}>
              ← Back to login
            </p>
          </>
        )}
      </div>
    </div>
  )
}