import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Reports } from './pages/Reports'
import { Predictions } from './pages/Predictions'
import { Simulation } from './pages/Simulation'
import { AdminPage } from './pages/AdminPage'
import { Stock } from './pages/Stock'
import { SalesEntry } from './pages/SalesEntry'
import { OperationalExpenses } from './pages/OperationalExpenses'
import { ProtectedRoute } from './pages/ProtectedRoute'

export function App() {
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
      </Routes>
  )
}