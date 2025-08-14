// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { token } = useAuth()
  const [staff, setStaff] = useState([])
  const [sanctions, setSanctions] = useState([])

  useEffect(() => {
    if (!token) return
    api('/staff?page=1&limit=100', 'GET', null, token)
      .then(d => setStaff(d.items || d))
      .catch(() => {})
    api('/sanctions?page=1&limit=100', 'GET', null, token)
      .then(d => setSanctions(d.items || d))
      .catch(() => {})
  }, [token])

  const actifs = useMemo(
    () => staff.filter(s => (s.statut || '').toLowerCase().includes('actif')).length,
    [staff]
  )
  const formation = useMemo(
    () => staff.filter(s => {
      const t = (s.statut || '').toLowerCase()
      return t.includes('formation') || t.includes('test')
    }).length,
    [staff]
  )
  const absences = useMemo(
    () => staff.filter(s => (s.statut || '').toLowerCase().includes('absent')).length,
    [staff]
  )

  return (
    <div className="space-y-6">
      {/* Hero / accroche */}
      <div className="card bg-gradient-to-br from-primary-50/80 to-accent-50/80 dark:from-primary-700/10 dark:to-accent-700/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Bienvenue sur le tableau de bord</h2>
            <p className="text-sm text-gray-500 mt-1">
              Gérez votre staff, suivez les sanctions et pilotez les recrutements — simplement.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/staff" className="btn">Gérer l'effectif</Link>
              <Link to="/sanctions" className="btn-ghost">Voir les sanctions</Link>
              <Link to="/recrutement" className="btn-ghost">Recrutements</Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-[260px]">
            <div className="rounded-2xl border border-primary-200/60 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/60">
              <div className="text-xs text-gray-500">Staff Actif</div>
              <div className="text-3xl font-bold">{actifs}</div>
            </div>
            <div className="rounded-2xl border border-pink-200/60 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/60">
              <div className="text-xs text-gray-500">En Formation/Test</div>
              <div className="text-3xl font-bold">{formation}</div>
            </div>
            <div className="rounded-2xl border border-yellow-200/60 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/60">
              <div className="text-xs text-gray-500">Absences</div>
              <div className="text-3xl font-bold">{absences}</div>
            </div>
            <div className="rounded-2xl border border-primary-200/60 dark:border-white/10 p-4 bg-white/70 dark:bg-neutral-900/60">
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-3xl font-bold">{staff.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/staff" className="card hover:shadow-soft-lg transition">
          <div className="text-lg font-semibold">👥 Gestion des Effectifs</div>
          <div className="text-sm text-gray-500">Ajoutez, modifiez et suivez les rôles et statuts.</div>
        </Link>
        <Link to="/sanctions" className="card hover:shadow-soft-lg transition">
          <div className="text-lg font-semibold">⚖️ Suivi des Sanctions</div>
          <div className="text-sm text-gray-500">Proposition → avis → décision + Discord.</div>
        </Link>
        <Link to="/recrutement" className="card hover:shadow-soft-lg transition">
          <div className="text-lg font-semibold">📝 Recrutement</div>
          <div className="text-sm text-gray-500">Fiche candidat, avis, décision + Discord.</div>
        </Link>
      </div>
    </div>
  )
}
