import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Users() {
  const { token, user } = useAuth()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ role: 'GERANT' })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return
    api('/users','GET', null, token).then(setRows).catch(e => setError(e.message))
  }, [])

  function update(field, value) { setForm(f => ({ ...f, [field]: value })) }
  async function save(e) {
    e.preventDefault()
    setError(null)
    try {
      await api('/users', 'POST', form, token)
      setForm({ role: 'GERANT' })
      const data = await api('/users', 'GET', null, token)
      setRows(data)
    } catch (e) { setError(e.message) }
  }

  if (user?.role !== 'SUPER_ADMIN') return <div className="card">Accès réservé aux Super-Admins.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Comptes CRM</h1>

      <form onSubmit={save} className="card">
        {error && <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-200 mb-3">{error}</div>}
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="input" value={form.email||''} onChange={e=>update('email', e.target.value)} type="email" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Mot de passe</label>
            <input className="input" value={form.password||''} onChange={e=>update('password', e.target.value)} type="password" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Nom affiché</label>
            <input className="input" value={form.display_name||''} onChange={e=>update('display_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Rôle</label>
            <select className="select" value={form.role} onChange={e=>update('role', e.target.value)}>
              {['GERANT','RESPONSABLE_STAFF','ADMINISTRATEUR','SUPER_ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button className="btn">Créer le compte</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-2">Email</th>
              <th className="py-2 pr-2">Nom</th>
              <th className="py-2 pr-2">Rôle</th>
              <th className="py-2 pr-2">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-2">{u.email}</td>
                <td className="py-2 pr-2">{u.display_name}</td>
                <td className="py-2 pr-2"><span className="badge">{u.role}</span></td>
                <td className="py-2 pr-2">{new Date(u.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
