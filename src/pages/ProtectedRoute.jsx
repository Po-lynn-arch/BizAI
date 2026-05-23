import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}