import '../CSS/Authentication.css'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../../hooks/config'

export function VerifyEmail() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('Verifying your email...')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetch(`https://bizai-backend-z4dh.onrender.com/api/verify-email/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setMessage(data.message)
          setSuccess(true)
          setTimeout(() => navigate('/login'), 3000)
        } else {
          setMessage(data.error || 'Verification failed')
          setSuccess(false)
        }
      })
      .catch(() => {
        setMessage('Network error. Please try again.')
        setSuccess(false)
      })
  }, [token, navigate])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <span className="logo">BizAI</span>
        <div style={{ fontSize: '48px', margin: '20px 0' }}>
          {success === null ? '⏳' : success ? '✅' : '❌'}
        </div>
        <p style={{ color: success === null ? '#aaa' : success ? '#10B981' : '#ff4444', fontSize: '15px', lineHeight: '1.6' }}>
          {message}
        </p>
        {success && (
          <p style={{ color: '#666', fontSize: '13px', marginTop: '12px' }}>Redirecting to login in 3 seconds...</p>
        )}
        {success === false && (
          <button className="auth-btn" style={{ marginTop: '20px' }} onClick={() => navigate('/Register')}>
            Register Again
          </button>
        )}
      </div>
    </div>
  )
}
