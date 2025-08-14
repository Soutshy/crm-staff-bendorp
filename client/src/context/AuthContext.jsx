import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function safeParseJSON(raw) {
  if (raw == null) return null
  if (raw === '' || raw === 'undefined' || raw === 'null') return null
  try { return JSON.parse(raw) } catch { return null }
}

export function AuthProvider({ children }) {
  // token: on accepte uniquement une string non vide et non "undefined"/"null"
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token')
    return (t && t !== 'undefined' && t !== 'null') ? t : null
  })

  // user: JSON sûr
  const [user, setUser] = useState(() => safeParseJSON(localStorage.getItem('user')))

  // au montage, on purge les valeurs pourries si besoin
  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u === '' || u === 'undefined' || u === 'null') localStorage.removeItem('user')
    const t = localStorage.getItem('token')
    if (t === '' || t === 'undefined' || t === 'null') localStorage.removeItem('token')
  }, [])

  // persistance
  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  // actions
  async function login(email, password) {
    const data = await api('/auth/login', 'POST', { email, password })
    if (!data?.token) throw new Error('Réponse login invalide : token manquant')
    setToken(data.token)
    setUser(data.user || null)
    return data
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const value = useMemo(() => ({ token, user, login, logout }), [token, user])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
