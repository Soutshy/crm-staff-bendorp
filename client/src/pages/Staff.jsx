import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'

const ROLE_OPTIONS = [
  'Super-Admin',
  'Administrateur',
  'Responsable Staff',
  'Gérant',
  'Superviseur',
  'Modérateur',
  'Helpeur',
  'Support'
]

const STATUT_OPTIONS = [
  'Actif',
  'Absent',
  'En Test'
]

// (facultatif) quelques idées de pôles si tu veux une liste :
// const POLE_OPTIONS = ['Gestion Global','Pôle Staff','Pôle Légal','Pôle Illégal','Gérant Légal','Gérant Illégal']

export default function Staff() {
  const { token } = useAuth()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [form, setForm] = useState({})
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const limit = 10

  const fetchAll = async (p = page) => {
    const data = await api(`/staff?page=${p}&limit=${limit}`, 'GET', null, token)
    setRows(data.items); setTotal(data.total); setPage(data.page)
  }
  useEffect(() => { fetchAll(1) }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter(r => Object.values(r).join(' ').toLowerCase().includes(s))
  }, [q, rows])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function save(e) {
    e.preventDefault()
    setError(null); setSuccess(null); setSaving(true)
    try {
      // validation rapide côté UI
      if (!form.role_staff) throw new Error('Le rôle staff est requis')
      if (!form.statut) throw new Error('Le statut est requis')

      if (form.id) {
        await api(`/staff/${form.id}`, 'PUT', form, token)
        setSuccess('Membre mis à jour')
      } else {
        await api('/staff', 'POST', form, token)
        setSuccess('Membre ajouté')
      }
      setForm({})
      setOpen(false)
      fetchAll()
    } catch (e) {
      setError(e.message || 'Échec de l’enregistrement')
    } finally {
      setSaving(false)
    }
  }

  function startAdd() { setForm({}); setOpen(true); setError(null); setSuccess(null) }
  function startEdit(r) { setForm(r); setOpen(true); setError(null); setSuccess(null) }

  async function del(id) {
    if (!confirm('Supprimer cette fiche ?')) return
    try {
      await api(`/staff/${id}`, 'DELETE', null, token)
      fetchAll()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestion des Effectifs</h1>
        <button className="btn" onClick={startAdd}>Ajouter un membre</button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <input className="input max-w-md" placeholder="Recherche..." value={q} onChange={e => setQ(e.target.value)} />
          <div className="flex items-center gap-3">
            <div className="badge">Total (page): {filtered.length}</div>
            <Pagination page={page} total={total} limit={limit} onPage={(p) => fetchAll(p)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-black/10 dark:border-white/10">
                <th className="py-2 pr-2">Discord ID</th>
                <th className="py-2 pr-2">Pseudo Discord</th>
                <th className="py-2 pr-2">Nom</th>
                <th className="py-2 pr-2">Rôle Staff</th>
                <th className="py-2 pr-2">Pôle</th>
                <th className="py-2 pr-2">Date d'entrée</th>
                <th className="py-2 pr-2">Statut</th>
                <th className="py-2 pr-2">Rôle RP Principal</th>
                <th className="py-2 pr-2">Référent</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-2">{r.discord_id}</td>
                  <td className="py-2 pr-2">{r.pseudo_discord}</td>
                  <td className="py-2 pr-2">{r.nom}</td>
                  <td className="py-2 pr-2"><span className="badge">{r.role_staff}</span></td>
                  <td className="py-2 pr-2">{r.pole}</td>
                  <td className="py-2 pr-2">{r.date_entree?.slice(0,10)}</td>
                  <td className="py-2 pr-2">{r.statut}</td>
                  <td className="py-2 pr-2">{r.role_rp_principal}</td>
                  <td className="py-2 pr-2">{r.referent}</td>
                  <td className="py-2 pr-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <button className="btn-ghost" onClick={() => startEdit(r)}>Modifier</button>
                      <button className="btn-ghost" onClick={() => del(r.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form?.id ? 'Modifier un membre' : 'Ajouter un membre'}>
        {error && <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100 mb-3">{error}</div>}
        {success && <div className="badge !bg-green-100 !text-green-700 dark:!bg-green-900/40 dark:!text-green-100 mb-3">{success}</div>}

        <form onSubmit={save} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">discord id</label>
              <input className="input" value={form.discord_id || ''} onChange={e => update('discord_id', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">pseudo discord</label>
              <input className="input" value={form.pseudo_discord || ''} onChange={e => update('pseudo_discord', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">nom</label>
              <input className="input" value={form.nom || ''} onChange={e => update('nom', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm mb-1">role staff</label>
              <select className="select" value={form.role_staff || ''} onChange={e => update('role_staff', e.target.value)} required>
                <option value="">— choisir —</option>
                {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">pole</label>
              <input className="input" value={form.pole || ''} onChange={e => update('pole', e.target.value)} />
              {/*
              Si tu veux une liste :
              <select className="select" value={form.pole || ''} onChange={e => update('pole', e.target.value)}>
                <option value="">— choisir —</option>
                {POLE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              */}
            </div>

            <div>
              <label className="block text-sm mb-1">date entree</label>
              <input className="input" type="date" value={form.date_entree || ''} onChange={e => update('date_entree', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm mb-1">statut</label>
              <select className="select" value={form.statut || ''} onChange={e => update('statut', e.target.value)} required>
                <option value="">— choisir —</option>
                {STATUT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">role rp principal</label>
              <input className="input" value={form.role_rp_principal || ''} onChange={e => update('role_rp_principal', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">referent</label>
              <input className="input" value={form.referent || ''} onChange={e => update('referent', e.target.value)} />
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button className="btn disabled:opacity-60" disabled={saving}>{saving ? 'Enregistrement…' : (form.id ? 'Mettre à jour' : 'Ajouter')}</button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
