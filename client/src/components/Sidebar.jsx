import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Gavel, UserPlus, Settings } from 'lucide-react'

const items = [
  { to:'/', label:'Dashboard', icon: LayoutDashboard },
  { to:'/staff', label:'Effectifs', icon: Users },
  { to:'/sanctions', label:'Sanctions', icon: Gavel },
  { to:'/recrutement', label:'Recrutement', icon: UserPlus },
  { to:'/comptes', label:'Comptes CRM', icon: Settings },
]

export default function Sidebar() {
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({to,label,icon:Icon})=>(
        <NavLink key={to} to={to} className={({isActive})=>` ${isActive?'active':''}`}>
          <Icon size={18}/><span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
