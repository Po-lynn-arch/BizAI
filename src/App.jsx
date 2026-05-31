import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/Reactfiles/LandingPage'
import { Login } from './pages/Reactfiles/Login'
import { Register } from './pages/Reactfiles/Register'
import { Dashboard } from './pages/Reactfiles/Dashboard'
import { Reports } from './pages/Reactfiles/Reports'
import { Predictions } from './pages/Reactfiles/Predictions'
import { Simulation } from './pages/Reactfiles/Simulation'
import { AdminPage } from './pages/Reactfiles/AdminPage'
import { Stock } from './pages/Reactfiles/Stock'
import { SalesEntry } from './pages/Reactfiles/SalesEntry'
import { OperationalExpenses } from './pages/Reactfiles/OperationalExpenses'
import { ProtectedRoute } from './pages/Reactfiles/ProtectedRoute'
import { VerifyEmail } from './pages/Reactfiles/VerifyEmail'
// import { ForgotPassword } from './pages/Reactfiles/ForgotPassword'
// import { ResetPassword } from './pages/Reactfiles/ResetPassword'
import { API_URL } from './hooks/config'

export function App() {
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let tries = 0
    const maxTries = 10

    async function ping() {
      try {
        const res = await fetch(`${API_URL}/api/test`)
        if (res.ok) {
          setReady(true)
          return
        }
      } catch {
        // backend still sleeping
      }
      tries++
      setAttempt(tries)
      if (tries < maxTries) {
        setTimeout(ping, 4000) // retry every 4 seconds
      } else {
        setReady(true) // give up after 40 seconds and show app anyway
      }
    }

    ping()
  }, [])

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'sans-serif'
      }}>
        <p style={{ fontSize: '36px', margin: 0 }}>⚡</p>
        <p style={{ color: '#10B981', fontWeight: '700', fontSize: '22px', margin: 0 }}>BizAI</p>
        <p style={{ color: '#aaa', fontSize: '14px', margin: 0 }}>Starting up server...</p>
        <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
          {attempt === 0
            ? 'Connecting...'
            : `Still waking up... (${attempt * 4}s)`}
        </p>

        {/* Animated progress bar */}
        <div style={{
          width: '220px',
          height: '4px',
          background: '#1a1a1a',
          borderRadius: '999px',
          overflow: 'hidden',
          marginTop: '8px'
        }}>
          <div style={{
            height: '100%',
            width: '40%',
            background: '#10B981',
            borderRadius: '999px',
            animation: 'slide 1.5s ease-in-out infinite'
          }} />
        </div>

        <p style={{ color: '#333', fontSize: '11px', margin: 0, maxWidth: '260px', textAlign: 'center' }}>
          Free hosting sleeps after inactivity. First load may take up to 50 seconds.
        </p>

        <style>{`
          @keyframes slide {
            0% { transform: translateX(-200%) }
            100% { transform: translateX(600%) }
          }
        `}</style>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/Reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/Predictions" element={<ProtectedRoute><Predictions /></ProtectedRoute>} />
      <Route path="/Simulation" element={<ProtectedRoute><Simulation /></ProtectedRoute>} />
      <Route path="/Admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/Stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
      <Route path="/Sales" element={<ProtectedRoute><SalesEntry /></ProtectedRoute>} />
      <Route path="/Expenses" element={<ProtectedRoute><OperationalExpenses /></ProtectedRoute>} />
      <Route path="/VerifyEmail" element={<VerifyEmail />} />
      {/*<Route path="/forgot-password" element={<ForgotPassword />} /> */}
      {/*<Route path="/reset-password/:token" element={<ResetPassword />} />*/}
    </Routes>
  )
}