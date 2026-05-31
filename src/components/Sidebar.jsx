import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Sidebar.css'

const navLinks = [
  { to: '/Dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/Stock', icon: '📦', label: 'Stock' },
  { to: '/Sales', icon: '📝', label: 'Sales' },
  { to: '/Expenses', icon: '🏠', label: 'Expenses' },
  { to: '/Reports', icon: '📄', label: 'Reports' },
  { to: '/Predictions', icon: '🤖', label: 'Predictions' },
  { to: '/Simulation', icon: '🧪', label: 'Simulation' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [collapsed, setCollapsed] = useState(false)
 

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    if (next) {
      document.body.classList.add('sidebar-collapsed')
    } else {
      document.body.classList.remove('sidebar-collapsed')
    }
  }

  function logout() {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar-top">
          <span className="logo">{collapsed ? 'B' : 'BizAI'}</span>
          <button className="collapse-btn" onClick={toggleCollapse}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <div className="sidebar-links">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-link ${isActive(link.to) ? 'sidebar-link--active' : ''}`}
              title={collapsed ? link.label : ''}
            >
              <span className="sidebar-link__icon">{link.icon}</span>
              {!collapsed && <span className="sidebar-link__label">{link.label}</span>}
            </Link>
          ))}
          {user.role === 'admin' && (
            <Link
              to="/Admin"
              className={`sidebar-link ${isActive('/Admin') ? 'sidebar-link--active' : ''}`}
              title={collapsed ? 'Admin' : ''}
            >
              <span className="sidebar-link__icon">⚙️</span>
              {!collapsed && <span className="sidebar-link__label">Admin</span>}
            </Link>
          )}
        </div>

        <button className="logout-btn" onClick={logout}>
          <span>⬅</span>
          {!collapsed && <span style={{ marginLeft: '8px' }}>Logout</span>}
        </button>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav">
        {navLinks.slice(0, 5).map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`mobile-nav__item ${isActive(link.to) ? 'mobile-nav__item--active' : ''}`}
          >
            <span className="mobile-nav__icon">{link.icon}</span>
            <span className="mobile-nav__label">{link.label}</span>
          </Link>
        ))}
        <button className="mobile-nav__item mobile-nav__item--logout" onClick={logout}>
          <span className="mobile-nav__icon">⬅</span>
          <span className="mobile-nav__label">Logout</span>
        </button>
      </nav>
    </>
  )
}