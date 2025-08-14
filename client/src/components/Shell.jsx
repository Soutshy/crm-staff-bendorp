import React from 'react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { Outlet } from 'react-router-dom'

export default function Shell() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="hidden md:block sidebar p-4">
        <div className="mb-4 px-2">
          <div className="text-lg font-bold">BendoRP • Staff</div>
          <div className="text-xs text-white/60">CRM interne</div>
        </div>
        <Sidebar />
      </aside>
      <main className="flex flex-col">
        <Topbar />
        <div className="p-4 md:p-6 space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
