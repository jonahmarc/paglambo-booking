import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearTokens, getTokens, setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { access } = getTokens()
    if (!access) { setLoading(false); return }
    api.get('/api/auth/me')
      .then(setBusiness)
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    // Use raw fetch so a 401 (wrong credentials) doesn't trigger the
    // retry-on-401 refresh flow and show a misleading "Session expired".
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Invalid email or password')
    }
    const data = await res.json()
    setTokens(data.access_token, data.refresh_token)
    const me = await api.get('/api/auth/me')
    setBusiness(me)
    return me
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setBusiness(null)
  }, [])

  return (
    <AuthContext.Provider value={{ business, loading, login, logout, isAuthenticated: !!business }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
