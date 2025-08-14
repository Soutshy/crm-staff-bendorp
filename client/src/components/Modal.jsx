import React, { useEffect } from 'react'

export default function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') onClose?.() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-soft p-5 m-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
