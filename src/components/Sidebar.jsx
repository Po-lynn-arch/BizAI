import { Link, useNavigate } from 'react-router-dom'
import './Sidebar.css'

export function Sidebar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="sidebar">
      <span className="logo">BizAI</span>
      <div className="sidebar-links">
        <Link to="/Dashboard">📊 Dashboard</Link>
        <Link to="/Stock">📦 Stock</Link>
        <Link to="/Sales">📝 Record Sales</Link>
        <Link to="/Expenses">🏠 Expenses</Link>
        <Link to="/Reports">📄 Reports</Link>
        <Link to="/Predictions">🤖 Predictions</Link>
        <Link to="/Simulation">🧪 Simulation</Link>
        {user.role === 'admin' && <Link to="/Admin">⚙️ Admin</Link>}
      </div>
      <button className="logout-btn" onClick={logout}>⬅ Logout</button>
    </div>
  )
}
