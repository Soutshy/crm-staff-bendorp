import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'

const limit = 10

export default function Recruitment() {
  const { token, user } = useAuth()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const [q, setQ] = useState('')

  const [form, setForm] = useState({})
  const [openForm, setOpenForm] = useState(false)

  const [openReview, setOpenReview] = useState(false)
  const [review, setReview] = useState({ vote: 'up', comment: '' })
  const [current, setCurrent] = useState(null)

  const [openDecision, setOpenDecision] = useState(false)
  const [decision, setDecision] = useState({ decision: 'accepted', entry_date: '', note: '' })

  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function fetchAll(p = page) {
    const data = await api(`/recruitments?page=${p}&limit=${limit}`, 'GET', null, token)
    setRows(data.items); setTotal(data.total); setPage(data.page)
  }
  useEffect(() => { if (token) fetchAll(1) }, [token])

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    if (!s) return rows
    return rows.filter(r => Object.values(r).join(' ').toLowerCase().includes(s))
  }, [q, rows])

  function startAdd() { setForm({}); setOpenForm(true); setError(null) }
  function startEdit(r) { setForm(r); setOpenForm(true); setError(null) }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      if (!form.candidate_name) throw new Error('Nom du candidat requis')
      if (!form.poste_souhaite) throw new Error('Poste souhaité requis')

      if (form.id) await api(`/recruitments/${form.id}`, 'PUT', form, token)
      else await api('/recruitments', 'POST', form, token)

      setOpenForm(false); setForm({}); fetchAll()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  function startReview(r) { setCurrent(r); setReview({ vote: 'up', comment: '' }); setOpenReview(true) }
  async function submitReview(e) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      await api(`/recruitments/${current.id}/reviews`, 'POST', review, token)
      setOpenReview(false)
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  function startDecision(r) {
    setCurrent(r)
    setDecision({ decision: 'accepted', entry_date: '', note: '' })
    setOpenDecision(true); setError(null)
  }
  async function submitDecision(e) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      await api(`/recruitments/${current.id}/decide`, 'POST', decision, token)
      setOpenDecision(false); fetchAll()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Supprimer ce candidat ?')) return
    await api(`/recruitments/${id}`, 'DELETE', null, token)
    fetchAll()
  }

  const statusBadge = (s) => {
    const map = {
      applied: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-100',
      review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-100',
      accepted: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-100',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-100'
    }
    return `badge ${map[s] || ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recrutement</h1>
        <button className="btn" onClick={startAdd}>Ajouter un candidat</button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <input className="input max-w-md" placeholder="Recherche..." value={q} onChange={e=>setQ(e.target.value)} />
          <Pagination page={page} total={total} limit={limit} onPage={(p)=>fetchAll(p)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-black/10 dark:border-white/10">
                <th className="py-2 pr-2">Nom</th>
                <th className="py-2 pr-2">Pseudo</th>
                <th className="py-2 pr-2">Discord ID</th>
                <th className="py-2 pr-2">Poste souhaité</th>
                <th className="py-2 pr-2">Statut</th>
                <th className="py-2 pr-2">Notes</th>
                <th className="py-2 pr-2">MAJ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-2">{r.candidate_name}</td>
                  <td className="py-2 pr-2">{r.pseudo_discord}</td>
                  <td className="py-2 pr-2">{r.discord_id}</td>
                  <td className="py-2 pr-2">{r.poste_souhaite}</td>
                  <td className="py-2 pr-2"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="py-2 pr-2">{r.notes}</td>
                  <td className="py-2 pr-2">{new Date(r.updated_at).toLocaleDateString()}</td>
                  <td className="py-2 pr-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <button className="btn-ghost" onClick={()=>startEdit(r)}>Modifier</button>
                      <button className="btn-ghost" onClick={()=>startReview(r)}>Avis</button>
                      <button className="btn-ghost" onClick={()=>startDecision(r)}>Décider</button>
                      <button className="btn-ghost" onClick={()=>del(r.id)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE FICHE CANDIDAT */}
      <Modal open={openForm} onClose={()=>setOpenForm(false)} title={form?.id ? 'Modifier le candidat' : 'Ajouter un candidat'}>
        {error && <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100 mb-3">{error}</div>}
        <form onSubmit={save} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Nom</label>
              <input className="input" value={form.candidate_name||''} onChange={e=>setForm(f=>({...f, candidate_name:e.target.value}))} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Pseudo Discord</label>
              <input className="input" value={form.pseudo_discord||''} onChange={e=>setForm(f=>({...f, pseudo_discord:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Discord ID</label>
              <input className="input" value={form.discord_id||''} onChange={e=>setForm(f=>({...f, discord_id:e.target.value}))} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Poste souhaité</label>
              <input className="input" value={form.poste_souhaite||''} onChange={e=>setForm(f=>({...f, poste_souhaite:e.target.value}))} required />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Notes</label>
              <textarea className="input" rows="3" value={form.notes||''} onChange={e=>setForm(f=>({...f, notes:e.target.value}))} />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn disabled:opacity-60" disabled={saving}>{form.id ? 'Mettre à jour' : 'Ajouter'}</button>
            <button type="button" className="btn-ghost" onClick={()=>setOpenForm(false)}>Annuler</button>
          </div>
        </form>
      </Modal>

      {/* MODALE AVIS */}
      <Modal open={openReview} onClose={()=>setOpenReview(false)} title={`Avis — ${current?.candidate_name || ''}`}>
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

      {/* MODALE DÉCISION + WEBHOOK */}
      <Modal open={openDecision} onClose={()=>setOpenDecision(false)} title={`Décider — ${current?.candidate_name || ''}`}>
        {error && <div className="badge !bg-red-100 !text-red-700 dark:!bg-red-900/40 dark:!text-red-100 mb-3">{error}</div>}
        <form onSubmit={submitDecision} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Décision</label>
              <select className="select" value={decision.decision} onChange={e=>setDecision(d=>({...d, decision:e.target.value}))}>
                <option value="accepted">✅ Accepter</option>
                <option value="rejected">❌ Refuser</option>
              </select>
            </div>
            {decision.decision === 'accepted' && (
              <div>
                <label className="block text-sm mb-1">Date d'entrée</label>
                <input type="date" className="input" value={decision.entry_date} onChange={e=>setDecision(d=>({...d, entry_date:e.target.value}))} required />
              </div>
            )}
            <div className={decision.decision === 'accepted' ? 'md:col-span-3' : 'md:col-span-3'}>
              <label className="block text-sm mb-1">Note</label>
              <textarea className="input" rows="3" value={decision.note} onChange={e=>setDecision(d=>({...d, note:e.target.value}))} placeholder="Petite note sur lui/elle" />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn disabled:opacity-60" disabled={saving}>Confirmer</button>
            <button type="button" className="btn-ghost" onClick={()=>setOpenDecision(false)}>Annuler</button>
          </div>
        </form>
        <div className="text-xs text-gray-500 mt-2">
          En cas d’acceptation, un <b>embed Discord</b> sera posté (ping du candidat si son <i>Discord ID</i> est renseigné).
        </div>
      </Modal>
    </div>
  )
}
