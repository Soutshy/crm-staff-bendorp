import React from 'react'
import { Routes, Route } from 'react-router-dom'

import Shell from './components/Shell.jsx'
import RequireAuth from './components/RequireAuth.jsx' // <= nouveau

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Staff from './pages/Staff.jsx'
import Sanctions from './pages/Sanctions.jsx'
import Recruitment from './pages/Recruitment.jsx'
import Accounts from './pages/Accounts.jsx' // retire cette ligne si tu n'as pas la page

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* layout protégé */}
      <Route element={<RequireAuth><Shell /></RequireAuth>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/sanctions" element={<Sanctions />} />
        <Route path="/recrutement" element={<Recruitment />} />
        <Route path="/comptes" element={<Accounts />} />
      </Route>

      <Route path="*" element={<Dashboard />} />
    </Routes>
  )
}
