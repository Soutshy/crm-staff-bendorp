// client/src/pages/Accounts.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'

const ROLES = ['GERANT', 'RESPONSABLE_STAFF', 'ADMINISTRATEUR', 'SUPER_ADMIN']
const limit = 10

export default function Accounts() {
  const { token, user } = useAuth()
  const [rows, setRows] = useState([])      // liste des comptes
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function fetchAll(p = page) {
    if (!token) return
    setError(null)
    try {
      const data = await api(`/users?page=${p}&limit=${limit}`, 'GET', null, token)
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
      setRows(items)
      setTotal(Number.isFinite(data?.total) ? data.total : items.length)
      setPage(Number.isFinite(data?.page) ? data.page : 1)
    } catch (e) {
      // ex: 401/403 si pas SUPER_ADMIN, ou erreur serveur
      setRows([])
      setTotal(0)
      setError(e.message || 'Erreur chargement comptes')
    }
  }

  useEffect(() => { if (token) fetchAll(1) }, [token])

  const rowsSafe = Array.isArray(rows) ? rows : []
  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim()
    if (!s) return rowsSafe
    return rowsSafe.filter(r => (`${r.email} ${r.display_name} ${r.role}`).toLowerCase().includes(s))
  }, [q, rowsSafe])

  function startAdd() { setForm({ role: 'GERANT' }); setOpen(true); setError(null) }
  function startEdit(u) {
    setForm({ id: u.id, email: u.email, display_name: u.display_name, role: u.role })
    setOpen(true); setError(null)
  }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      if (form.id) {
        await api(`/users/${form.id}`, 'PUT', {
          display_name: form.display_name ?? null,
          role: form.role,
          ...(form.password ? { password: form.password } : {})
        }, token)
      } else {
        if (!form.email || !form.password) throw new Error('Email et mot de passe requis')
        await api('/users', 'POST', {
          email: form.email,
          password: form.password,
          display_name: form.display_name ?? null,
          role: form.role
        }, token)
      }
      setOpen(false); setForm({})
      fetchAll()
    } catch (e) {
      setError(e.message || 'Erreur enregistrement')
    } finally {
      setSaving(false)
    }
  }

  async function del(id) {
    if (!confirm('Supprimer ce compte ?')) return
    setError(null)
    try {
      await api(`/users/${id}`, 'DELETE', null, token)
      fetchAll()
    } catch (e) {
      setError(e.message || 'Suppression impossible')
    }
  }

  // si pas super-admin, on affiche une alerte simple (au cas où l’API renvoie 403)
  const isSuperAdmin = (user?.role === 'SUPER_ADMIN')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Comptes CRM</h1>
        <button className="btn" onClick={startAdd} disabled={!isSuperAdmin}>Créer un compte</button>
      </div>

      {!isSuperAdmin && (
        <div className="badge !bg-yellow-100 !text-yellow-700 dark:!bg-yellow-900/40 dark:!text-yellow-100">
          Accès réservé aux SUPER_ADMIN
        </div>
      )}

      {error && (
        <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100">
          {error}
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <input className="input max-w-md" placeholder="Recherche..." value={q} onChange={e => setQ(e.target.value)} />
          <Pagination page={Number.isFinite(page) ? page : 1} total={Number.isFinite(total) ? total : 0} limit={limit} onPage={(p) => fetchAll(p)} />
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Nom affiché</th>
                <th className="py-2 pr-2">Rôle</th>
                <th className="py-2 pr-2">Créé le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(filtered || []).map(u => (
                <tr key={u.id}>
                  <td className="py-2 pr-2">{u.email}</td>
                  <td className="py-2 pr-2">{u.display_name}</td>
                  <td className="py-2 pr-2"><span className="badge">{u.role}</span></td>
                  <td className="py-2 pr-2">{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</td>
                  <td className="py-2 pr-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <button className="btn-ghost" onClick={() => startEdit(u)} disabled={!isSuperAdmin}>Modifier</button>
                      {(isSuperAdmin && user?.id !== u.id) && (
                        <button className="btn-ghost" onClick={() => del(u.id)}>Supprimer</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!filtered || filtered.length === 0) && (
                <tr><td className="py-6 text-center text-gray-500" colSpan={5}>Aucun compte</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Modifier le compte' : 'Créer un compte'}>
        {error && <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100 mb-3">{error}</div>}
        <form onSubmit={save} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {!form.id && (
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input className="input" type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            )}
            <div>
              <label className="block text-sm mb-1">Nom affiché</label>
              <input className="input" value={form.display_name || ''} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Rôle</label>
              <select className="select" value={form.role || 'GERANT'} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">{form.id ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}</label>
              <input className="input" type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} {...(form.id ? {} : { required: true })} />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn disabled:opacity-60" disabled={saving || !isSuperAdmin}>{form.id ? 'Mettre à jour' : 'Créer'}</button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
