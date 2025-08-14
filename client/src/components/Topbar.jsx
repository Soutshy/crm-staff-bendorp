import React from 'react'
import ThemeToggle from './ThemeToggle.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { LogOut } from 'lucide-react'

export default function Topbar(){
  const auth = useAuth()
  const user = auth?.user

  return (
    <div className="topbar">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="hidden md:flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500"></div>
          <div className="text-sm text-gray-500 dark:text-gray-400">BendoRP Staff CRM</div>
        </div>

        <div className="flex-1 flex justify-center">
          <input className="input max-w-md" placeholder="Recherche rapide (Ctrl+/)" />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl border border-black/10 dark:border-white/10">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary-600 to-accent-500"></div>
            <div className="text-sm">{user?.display_name || user?.email || 'Utilisateur'}</div>
          </div>
          <button
            className="btn-ghost"
            onClick={() => auth?.logout?.()}
            title="Se déconnecter"
          >
            <LogOut size={16} />
            <span className="text-sm hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  )
}
