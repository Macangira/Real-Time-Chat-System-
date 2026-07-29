import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setSession } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import styles from './Auth.module.css'

export default function Auth() {
  const [tab, setTab]         = useState('login')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast    = useToast()

  // Login state
  const [loginData, setLoginData] = useState({ username: '', password: '' })

  // Register state
  const [regData, setRegData] = useState({
    first_name: '', last_name: '', username: '', email: '', password: '',
  })

  function switchTab(t) { setTab(t); setError('') }

  /* ── LOGIN ── */
  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (!loginData.username || !loginData.password) return setError('Please fill in all fields.')
    setLoading(true)
    try {
      const res  = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Login failed.'); return }

      // Backend returns: { access_token, refresh_token, user_id, username }
      const token    = data.access_token || ''
      const userId   = data.user_id || ''
      const uname    = data.username || loginData.username

      if (!token)  { setError('Server returned no token. Check your backend.'); return }
      if (!userId) { setError('Server returned no user ID. Check your backend.'); return }

      setSession({ token, userId, username: uname })
      toast('Welcome back! 🎉', 'success')
      navigate('/chat')
    } catch {
      setError('Cannot connect to server. Make sure backend is running on port 3000.')
    } finally {
      setLoading(false)
    }
  }

  /* ── REGISTER ── */
  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    const { first_name, last_name, username, email, password } = regData
    if (!first_name || !last_name || !username || !email || !password)
      return setError('Please fill in all fields.')
    if (username.length < 10 || username.length > 20)
      return setError('Username must be 10–20 characters.')
    setLoading(true)
    try {
      const res  = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(regData),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Registration failed.'); return }
      toast('Account created! Please sign in.', 'success')
      setTab('login')
      setLoginData(prev => ({ ...prev, username }))
    } catch {
      setError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.bg}>
      <div className={styles.wrap}>
        <div className={styles.card}>

          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>💬</div>
            <span className={styles.logoText}>MegaBite Chat</span>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab==='login'?styles.tabActive:''}`} onClick={() => switchTab('login')}>
              Sign In
            </button>
            <button className={`${styles.tab} ${tab==='register'?styles.tabActive:''}`} onClick={() => switchTab('register')}>
              Sign Up
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span> <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form className={styles.form} onSubmit={handleLogin}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Enter your username"
                value={loginData.username}
                onChange={e => setLoginData(p => ({ ...p, username: e.target.value }))}
                autoComplete="username"
                required
              />
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
                required
              />
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? <><span className={styles.spinner}/> Please wait…</> : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form className={styles.form} onSubmit={handleRegister}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>First Name</label>
                  <input className={styles.input} type="text" placeholder="John"
                    value={regData.first_name} onChange={e => setRegData(p => ({ ...p, first_name: e.target.value }))} required/>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Last Name</label>
                  <input className={styles.input} type="text" placeholder="Doe"
                    value={regData.last_name} onChange={e => setRegData(p => ({ ...p, last_name: e.target.value }))} required/>
                </div>
              </div>
              <label className={styles.label}>Username <small className={styles.hint}>(10–20 chars)</small></label>
              <input className={styles.input} type="text" placeholder="e.g. johndoe2024"
                minLength={10} maxLength={20} autoComplete="username"
                value={regData.username} onChange={e => setRegData(p => ({ ...p, username: e.target.value }))} required/>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" placeholder="john@example.com"
                value={regData.email} onChange={e => setRegData(p => ({ ...p, email: e.target.value }))} required/>
              <label className={styles.label}>Password</label>
              <input className={styles.input} type="password" placeholder="At least 6 characters"
                minLength={6} autoComplete="new-password"
                value={regData.password} onChange={e => setRegData(p => ({ ...p, password: e.target.value }))} required/>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? <><span className={styles.spinner}/> Creating…</> : 'Create Account'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
