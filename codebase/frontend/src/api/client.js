const BASE = ''  // Vite proxy forwards /api → localhost:8000

function getTokens() {
  return {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
  }
}

function setTokens(access, refresh) {
  localStorage.setItem('access_token', access)
  if (refresh) localStorage.setItem('refresh_token', refresh)
}

function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

async function refreshAccessToken() {
  const { refresh } = getTokens()
  if (!refresh) throw new Error('No refresh token')
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!res.ok) {
    clearTokens()
    throw new Error('Session expired')
  }
  const data = await res.json()
  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

async function apiFetch(path, options = {}, retry = true) {
  const { access } = getTokens()
  const headers = { ...options.headers }
  if (access) headers['Authorization'] = `Bearer ${access}`
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401 && retry) {
    try {
      const newToken = await refreshAccessToken()
      return apiFetch(path, options, false)
    } catch {
      clearTokens()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || JSON.stringify(err)
    } catch {}
    throw new Error(detail)
  }

  if (res.status === 204) return null
  return res.json()
}

// Unauthenticated client for public booking page — no token injection, no /login redirect
async function publicFetch(path, options = {}) {
  const headers = { ...options.headers }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || JSON.stringify(err)
    } catch {}
    throw new Error(detail)
  }
  if (res.status === 204) return null
  return res.json()
}

export const publicApi = {
  get: (path) => publicFetch(path, { method: 'GET' }),
  post: (path, body) => publicFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: (path, formData) => publicFetch(path, { method: 'POST', body: formData }),
}

export const api = {
  get: (path) => apiFetch(path, { method: 'GET' }),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
  postForm: (path, formData) => apiFetch(path, { method: 'POST', body: formData }),
}

export { setTokens, clearTokens, getTokens }
