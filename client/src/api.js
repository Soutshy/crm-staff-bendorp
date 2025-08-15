// client/src/api.js
const RAW = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const BASE = RAW.replace(/\/+$/, '') // enlève les / finaux

export async function api(path, method = 'GET', body, token) {
  const url = `${BASE}/api${path.startsWith('/') ? path : '/' + path}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let payload = null
    try { payload = await res.json() } catch {}
    if (res.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    throw new Error(payload?.error || `Erreur API (${res.status})`)
  }

  return res.json()
}
