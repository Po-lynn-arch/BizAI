import '../CSS/Authentication.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../hooks/config'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(1)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  // Step 1 — get the security question for this email
  async function handleGetQuestion() {
    setError('')
    if (!email) { setError('Please enter your email'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok) {
        setQuestion(data.question)
        setStep(2)
      } else {
        setError(data.error || 'Email not found')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 — verify answer and get reset token
  async function handleVerifyAnswer() {
    setError('')
    if (!answer) { setError('Please enter your answer'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answer })
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.token)
        setStep(3)
      } else {
        setError(data.error || 'Incorrect answer')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3 — reset password using token
  async function handleReset() {
    setError('')
    if (!newPassword) { setError('Enter a new password'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setDone(true)
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

  if (done) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <span className="logo">BizAI</span>
        <div style={{ background: '#0d2b1f', border: '1px solid #10B981', borderRadius: '12px', padding: '24px', marginTop: '20px' }}>
          <p style={{ fontSize: '40px' }}>✅</p>
          <p style={{ color: '#10B981', fontSize: '15px', fontWeight: '600' }}>Password reset successfully!</p>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>Redirecting to login...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="logo">BizAI</span>
          <h2>Reset Password</h2>
          <p>
            {step === 1 && 'Enter your email to find your account'}
            {step === 2 && 'Answer your security question'}
            {step === 3 && 'Choose a new password'}
          </p>
        </div>

        {/* STEP INDICATOR */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: s <= step ? '#10B981' : '#2a2a2a',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {/* STEP 1 — EMAIL */}
        {step === 1 && (
          <>
            <div className="auth-field">
              <label>Email Address</label>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGetQuestion()} />
            </div>
            {error && <p style={{ color: '#ff4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
            <button className="auth-btn" onClick={handleGetQuestion} disabled={loading}>
              {loading ? 'Looking up...' : 'Continue'}
            </button>
          </>
        )}

        {/* STEP 2 — SECURITY QUESTION */}
        {step === 2 && (
          <>
            <div style={{ background: '#0d1b2b', border: '1px solid #3b82f6', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Security Question:</p>
              <p style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '600' }}>{question}</p>
            </div>
            <div className="auth-field">
              <label>Your Answer</label>
              <input type="text" placeholder="Type your answer" value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerifyAnswer()} />
              <p style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>Answers are not case-sensitive</p>
            </div>
            {error && <p style={{ color: '#ff4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
            <button className="auth-btn" onClick={handleVerifyAnswer} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Answer'}
            </button>
            <p style={{ cursor: 'pointer', color: '#aaa', marginTop: '12px', fontSize: '13px', textAlign: 'center' }}
              onClick={() => { setStep(1); setError('') }}>← Back</p>
          </>
        )}

        {/* STEP 3 — NEW PASSWORD */}
        {step === 3 && (
          <>
            <div className="auth-field">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} placeholder="At least 6 characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '60px', boxSizing: 'border-box' }} />
                <span onClick={() => setShow(!show)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#10B981', fontWeight: '600' }}>
                  {show ? 'Hide' : 'Show'}
                </span>
              </div>
            </div>
            <div className="auth-field">
              <label>Confirm New Password</label>
              <input type={show ? 'text' : 'password'} placeholder="Repeat new password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()} />
            </div>
            {error && <p style={{ color: '#ff4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
            <button className="auth-btn" onClick={handleReset} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        )}

        <p style={{ cursor: 'pointer', color: '#4f46e5', marginTop: '16px', fontSize: '13px', textAlign: 'center' }}
          onClick={() => navigate('/login')}>← Back to login</p>
      </div>
    </div>
  )
}