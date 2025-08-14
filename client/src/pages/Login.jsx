// client/src/pages/Login.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Login(){
  const { login, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // si déjà connecté, évite de rester sur /login
  useEffect(() => {
    if (token) {
      const dest = location.state?.from?.pathname || '/'
      navigate(dest, { replace: true })
    }
  }, [token, navigate, location.state])

  async function submit(e){
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password) // AuthContext met token + user
      const dest = location.state?.from?.pathname || '/'
      navigate(dest, { replace: true }) // redirection immédiate
    } catch (e) {
      setError(e.message || 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-900">
      <div className="w-[92%] max-w-md card bg-white/90 dark:bg-neutral-900/80 backdrop-blur border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500"></div>
          <div>
            <div className="font-semibold">BendoRP • Staff CRM</div>
            <div className="text-xs text-gray-500">Connexion</div>
          </div>
        </div>

        {error && (
          <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100 mb-3">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            className="input"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="username"
            required
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="Mot de passe"
            autoComplete="current-password"
            required
          />
          <button className="btn w-full disabled:opacity-60" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
