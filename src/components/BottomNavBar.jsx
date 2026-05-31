import { Link, useLocation } from 'react-router-dom'

export function BottomNavBar(){
  const location = useLocation()

  return(
    <nav className="mobile-nav">
  {[
    { to: '/Dashboard', icon: '📊', label: 'Home' },
    { to: '/Stock', icon: '📦', label: 'Stock' },
    { to: '/Sales', icon: '📝', label: 'Sales' },
    { to: '/Expenses', icon: '🏠', label: 'Costs' },
    { to: '/Reports', icon: '📄', label: 'Reports' },
  ].map(link => (
    <Link key={link.to} to={link.to} className={location.pathname === link.to ? 'active' : ''}>
      <span className="icon">{link.icon}</span>
      <span>{link.label}</span>
    </Link>
  ))}
</nav>

  )
}

