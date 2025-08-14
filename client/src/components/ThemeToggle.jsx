import React, { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle(){
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(()=>{ document.documentElement.classList.toggle('dark', dark) },[dark])
  return (
    <button className="btn-ghost" onClick={()=>setDark(d=>!d)} aria-label="Toggle theme">
      {dark ? <Sun size={16}/> : <Moon size={16}/> }
      <span className="text-sm">{dark?'Clair':'Sombre'}</span>
    </button>
  )
}
