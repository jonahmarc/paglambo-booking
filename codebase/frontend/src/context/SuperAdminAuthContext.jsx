import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const SA_ACCESS_KEY = 'sa_access_token'
const SA_REFRESH_KEY = 'sa_refresh_token'
const BASE = ''

function getSATokens() {
  return {
    access: localStorage.getItem(SA_ACCESS_KEY),
    refresh: localStorage.getItem(SA_REFRESH_KEY),
  }
}

function setSATokens(access, refresh) {
  localStorage.setItem(SA_ACCESS_KEY, access)
  if (refresh) localStorage.setItem(SA_REFRESH_KEY, refresh)
}

function clearSATokens() {
  localStorage.removeItem(SA_ACCESS_KEY)
  localStorage.removeItem(SA_REFRESH_KEY)
}

async function saFetch(path, options = {}, retry = true) {
  const { access, refresh } = getSATokens()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (access) headers['Authorization'] = `Bearer ${access}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401 && retry && refresh) {
    const refreshRes = await fetch(`${BASE}/api/superadmin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!refreshRes.ok) {
      clearSATokens()
      window.location.href = '/superadmin/login'
      throw new Error('Session expired')
    }
    const data = await refreshRes.json()
    setSATokens(data.access_token, data.refresh_token)
    return saFetch(path, options, false)
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try { const err = await res.json(); detail = err.detail || JSON.stringify(err) } catch {}
    throw new Error(detail)
  }

  return res.json()
}

const SuperAdminAuthContext = createContext(null)

export function SuperAdminAuthProvider({ children }) {
  const [superAdmin, setSuperAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { access } = getSATokens()
    if (!access) { setLoading(false); return }
    saFetch('/api/superadmin/auth/me', { method: 'GET' })
      .then(setSuperAdmin)
      .catch(() => clearSATokens())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${BASE}/api/superadmin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Login failed')
    }
    const data = await res.json()
    setSATokens(data.access_token, data.refresh_token)
    const me = await saFetch('/api/superadmin/auth/me', { method: 'GET' })
    setSuperAdmin(me)
    return me
  }, [])

  const logout = useCallback(() => {
    clearSATokens()
    setSuperAdmin(null)
  }, [])

  return (
    <SuperAdminAuthContext.Provider value={{ superAdmin, loading, login, logout, isAuthenticated: !!superAdmin }}>
      {children}
    </SuperAdminAuthContext.Provider>
  )
}

export function useSuperAdminAuth() {
  return useContext(SuperAdminAuthContext)
}

export { saFetch }
