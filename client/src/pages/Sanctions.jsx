import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'

const limit = 10
const TYPE_OPTIONS = ['Avertissement', 'Derank', 'Expulsion', 'Blacklist',]

export default function Sanctions() {
  const { token } = useAuth()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const [staff, setStaff] = useState([])
  const [form, setForm] = useState({})
  const [openForm, setOpenForm] = useState(false)

  const [current, setCurrent] = useState(null)
  const [openReview, setOpenReview] = useState(false)
  const [review, setReview] = useState({ vote: 'up', comment: '' })

  const [openDecision, setOpenDecision] = useState(false)
  const [decision, setDecision] = useState({ decision: 'approved', note: '' })

  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function fetchAll(p = page) {
    const s = await api(`/sanctions?page=${p}&limit=${limit}`, 'GET', null, token)
    setRows(s.items); setTotal(s.total); setPage(s.page)
    const st = await api('/staff?page=1&limit=10000', 'GET', null, token)
    setStaff(st.items || st)
  }
  useEffect(() => { if (token) fetchAll(1) }, [token])

  function staffLabel(s) {
    const base = s.nom || s.pseudo_discord || s.discord_id || '—'
    return `${base}${s.discord_id ? ' — ' + s.discord_id : ''}`
  }

  function startAdd() { setForm({}); setOpenForm(true); setError(null) }
  function startEdit(r) { setForm(r); setOpenForm(true); setError(null) }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      if (!form.staff_id) throw new Error('Staff requis')
      if (!form.type) throw new Error('Type requis')
      if (!form.reason) throw new Error('Raison requise')

      if (form.id) await api(`/sanctions/${form.id}`,'PUT', form, token)
      else await api('/sanctions','POST', form, token)
      setOpenForm(false); setForm({}); fetchAll()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  function startReview(r) { setCurrent(r); setReview({ vote: 'up', comment: '' }); setOpenReview(true) }
  async function submitReview(e) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      await api(`/sanctions/${current.id}/reviews`, 'POST', review, token)
      setOpenReview(false)
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  function startDecision(r) { setCurrent(r); setDecision({ decision: 'approved', note: '' }); setOpenDecision(true); setError(null) }
  async function submitDecision(e) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      await api(`/sanctions/${current.id}/decide`, 'POST', decision, token)
      setOpenDecision(false); fetchAll()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function notify(id) {
    setSaving(true); setError(null)
    try {
      await api(`/sanctions/${id}/notify`, 'POST', {}, token)
      // pas de changement local, c'est juste un renvoi d'embed
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Supprimer cette sanction ?')) return
    setSaving(true); setError(null)
    try {
      await api(`/sanctions/${id}`,'DELETE', null, token)
      fetchAll()
    } catch (e) {
      setError(e.message) // affichée en haut de page
    } finally { setSaving(false) }
  }

  const statusBadge = (s) => {
    const map = {
      proposed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-100',
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-100',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-100'
    }
    return `badge ${map[s] || ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sanctions</h1>
        <button className="btn" onClick={startAdd}>Proposer une sanction</button>
      </div>

      {error && <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100">{error}</div>}

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-end mb-3">
          <Pagination page={page} total={total} limit={limit} onPage={(p)=>fetchAll(p)} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-2">Staff</th>
              <th className="py-2 pr-2">Type</th>
              <th className="py-2 pr-2">Raison</th>
              <th className="py-2 pr-2">Début</th>
              <th className="py-2 pr-2">Fin</th>
              <th className="py-2 pr-2">Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-2">
                  {s.staff_nom || s.staff_pseudo || s.staff_discord_id}
                  {s.staff_discord_id ? <span className="text-xs text-gray-500"> — {s.staff_discord_id}</span> : null}
                </td>
                <td className="py-2 pr-2"><span className="badge">{s.type}</span></td>
                <td className="py-2 pr-2">{s.reason}</td>
                <td className="py-2 pr-2">{s.start_date?.slice(0,10)}</td>
                <td className="py-2 pr-2">{s.end_date?.slice(0,10)}</td>
                <td className="py-2 pr-2"><span className={statusBadge(s.status)}>{s.status}</span></td>
                <td className="py-2 pr-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <button className="btn-ghost" onClick={()=>startEdit(s)}>Modifier</button>
                    <button className="btn-ghost" onClick={()=>startReview(s)}>Avis</button>
                    <button className="btn-ghost" onClick={()=>startDecision(s)}>Décider</button>
                    {(s.status === 'Approuvée' || s.status === 'Rejetée') && (
                      <button className="btn-ghost" onClick={()=>notify(s.id)}>Relancer l’embed</button>
                    )}
                    <button className="btn-ghost" onClick={()=>del(s.id)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modale proposition / édition */}
      <Modal open={openForm} onClose={()=>setOpenForm(false)} title={form?.id ? 'Modifier la sanction' : 'Proposer une sanction'}>
        {error && <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100 mb-3">{error}</div>}
        <form onSubmit={save} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Staff (Discord)</label>
              <select className="select" value={form.staff_id || ''} onChange={e=>setForm(f=>({...f, staff_id:e.target.value}))} required>
                <option value="">— choisir —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{staffLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Type</label>
              <select className="select" value={form.type || ''} onChange={e=>setForm(f=>({...f, type:e.target.value}))} required>
                <option value="">— choisir —</option>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Raison</label>
              <input className="input" value={form.reason || ''} onChange={e=>setForm(f=>({...f, reason:e.target.value}))} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Début</label>
              <input type="date" className="input" value={form.start_date || ''} onChange={e=>setForm(f=>({...f, start_date:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Fin</label>
              <input type="date" className="input" value={form.end_date || ''} onChange={e=>setForm(f=>({...f, end_date:e.target.value}))} />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn disabled:opacity-60" disabled={saving}>{form.id ? 'Mettre à jour' : 'Proposer'}</button>
            <button type="button" className="btn-ghost" onClick={()=>setOpenForm(false)}>Annuler</button>
          </div>
        </form>
      </Modal>

      {/* Modale avis */}
      <Modal open={openReview} onClose={()=>setOpenReview(false)} title={`Avis — sanction #${current?.id || ''}`}>
        {error && <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100 mb-3">{error}</div>}
        <form onSubmit={submitReview} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Vote</label>
              <select className="select" value={review.vote} onChange={e=>setReview(r=>({...r, vote:e.target.value}))}>
                <option value="up">👍 Favorable</option>
                <option value="down">👎 Défavorable</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Commentaire</label>
              <textarea className="input" rows="3" value={review.comment} onChange={e=>setReview(r=>({...r, comment:e.target.value}))} />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn disabled:opacity-60" disabled={saving}>Envoyer l’avis</button>
            <button type="button" className="btn-ghost" onClick={()=>setOpenReview(false)}>Fermer</button>
          </div>
        </form>
      </Modal>

      {/* Modale décision */}
      <Modal open={openDecision} onClose={()=>setOpenDecision(false)} title={`Décider — sanction #${current?.id || ''}`}>
        {error && <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100 mb-3">{error}</div>}
        <form onSubmit={submitDecision} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Décision</label>
              <select className="select" value={decision.decision} onChange={e=>setDecision(d=>({...d, decision:e.target.value}))}>
                <option value="approved">✅ Approuver</option>
                <option value="rejected">❌ Rejeter</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Note</label>
              <textarea className="input" rows="3" value={decision.note} onChange={e=>setDecision(d=>({...d, note:e.target.value}))} placeholder="Pourquoi cette décision ?" />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn disabled:opacity-60" disabled={saving}>Confirmer</button>
            <button type="button" className="btn-ghost" onClick={()=>setOpenDecision(false)}>Annuler</button>
          </div>
        </form>
        <div className="text-xs text-gray-500 mt-2">
          Un <b>embed Discord</b> sera posté avec le ping du membre si son <i>Discord ID</i> est renseigné dans l’effectif.
        </div>
      </Modal>
    </div>
  )
}
