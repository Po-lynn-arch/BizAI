import '../CSS/Dashboard.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

export function AdminPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function loadUsers() {
    Promise.all([
      fetch(`${API_URL}/api/admin/users/${user.id}`).then(r => r.json())
    ]).then(([usersData]) => {
      if (Array.isArray(usersData)) {
        setUsers(usersData)
      } else {
        setUsers([])
        if (usersData.error) setError(usersData.error)
      }
    }).catch(() => setUsers([]))
  }

  useEffect(() => {
    if (user.role !== 'admin') { navigate('/Dashboard'); return }
    loadUsers()
  }, [])

  async function addUser() {
    setError(''); setSuccess('')
    if (!name || !email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id, name, email, password })
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess('User added successfully')
        setName(''); setEmail(''); setPassword('')
        loadUsers()
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to add user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function removeUser(userId) {
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id })
      })
      loadUsers()
    } catch {
      setError('Failed to remove user.')
    }
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <header className="topbar">
          <div>
            <h2>⚙️ Admin Panel</h2>
            <p>Manage users for your business</p>
          </div>
        </header>

        <div className="entry-form">
          <h3>Add a Second User</h3>
          <div style={{ background: '#0d1b2b', border: '1px solid #3b82f6', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#93c5fd', fontSize: '14px' }}>
            💡 You can add one more user to your business. They will have access to all your business data. Maximum 2 users per business.
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Full Name</label>
              <input placeholder="Enter name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input placeholder="Enter email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Password</label>
              <input placeholder="Enter password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
          {success && <p style={{ color: '#10B981', fontSize: '14px' }}>{success}</p>}
          <button className="add-btn" onClick={addUser} disabled={loading}>
            {loading ? 'Adding...' : '+ Add User'}
          </button>
        </div>

        <div className="recent-sales">
          <h3>Business Users ({users.length}/2)</h3>
          {users.length === 0 ? (
            <p className="empty-state">No users found.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={u.role === 'admin' ? 'badge-income' : 'badge-expense'}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button className="delete-btn" onClick={() => removeUser(u.id)}>🗑</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
