import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import { ForgotPassword } from './pages/Reactfiles/ForgotPassword'
import { ResetPassword } from './pages/Reactfiles/ResetPassword'
import { WeeklyReport } from './pages/Reactfiles/WeeklyReport'

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
        <Route path="/VerifyEmail" element={<ProtectedRoute><VerifyEmail/></ProtectedRoute>}/>
        <Route path='/forgot-password' element={<ProtectedRoute><ForgotPassword/></ProtectedRoute>}></Route>
        <Route path='/reset-password/:token' element={<ProtectedRoute><ResetPassword/></ProtectedRoute>}></Route>
        <Route path="/WeeklyReport" element={<WeeklyReport />} />
      </Routes>
  )
}