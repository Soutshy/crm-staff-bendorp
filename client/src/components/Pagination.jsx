import React from 'react'

export default function Pagination({ page, total, limit=10, onPage }) {
  const totalPages = Math.max(Math.ceil((total||0) / limit), 1)
  const canPrev = page > 1
  const canNext = page < totalPages

  function jump(p) {
    if (p < 1 || p > totalPages) return
    onPage?.(p)
  }

  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i=start;i<=end;i++) pages.push(i)

  return (
    <div className="flex items-center gap-2">
      <button className="btn-ghost" onClick={() => jump(page-1)} disabled={!canPrev}>Précédent</button>
      <div className="flex items-center gap-1">
        {pages.map(p => (
          <button key={p} className={`btn-ghost ${p===page ? 'bg-primary-600/10 text-primary-700 dark:text-primary-100' : ''}`} onClick={()=>jump(p)}>{p}</button>
        ))}
      </div>
      <button className="btn-ghost" onClick={() => jump(page+1)} disabled={!canNext}>Suivant</button>
      <div className="text-sm text-gray-500 ml-2">Page {page} / {totalPages} — {total} lignes</div>
    </div>
  )
}
