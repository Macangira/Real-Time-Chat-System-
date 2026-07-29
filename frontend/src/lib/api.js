// Central API config — all requests go through Vite proxy → localhost:3000
export const API_BASE = '/api'
export const WS_BASE  = `ws://localhost:8000`

// Auth helpers
export const getToken    = () => sessionStorage.getItem('chatflow_token') || ''
export const getUserId   = () => sessionStorage.getItem('chatflow_userId') || ''
export const getUsername = () => sessionStorage.getItem('chatflow_username') || ''

export const setSession = ({ token, userId, username }) => {
  sessionStorage.setItem('chatflow_token',    token)
  sessionStorage.setItem('chatflow_userId',   userId)
  sessionStorage.setItem('chatflow_username', username)
}

export const clearSession = () => {
  sessionStorage.removeItem('chatflow_token')
  sessionStorage.removeItem('chatflow_userId')
  sessionStorage.removeItem('chatflow_username')
}

export const isLoggedIn = () => Boolean(getToken())

// Fetch wrapper
export async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  const res = await fetch(API_BASE + path, { ...options, headers })
  return res
}
