'use client'
import { useState } from 'react'

export default function EditNameForm({ currentName }: { currentName: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ text: string; bonus?: number } | null>(null)

  const handleSave = async () => {
    if (!name.trim() || name.trim() === currentName) { setEditing(false); return }
    setLoading(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok) {
        const msg = data.bonusQuest
          ? 'Name saved! 🎉 Go to home to claim your reward!'
          : 'Name saved!'
        setToast({ text: msg })
        setTimeout(() => { setToast(null); window.location.reload() }, 2000)
      }
    } finally {
      setLoading(false)
      setEditing(false)
    }
  }

  return (
    <div className="mt-3">
      {toast && (
        <div className="mb-3 text-sm text-aurora-400 bg-aurora-500/10 border border-aurora-500/20 rounded-lg px-3 py-2 text-center">
          {toast.text}
        </div>
      )}
      {editing ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            className="input flex-1 text-sm py-1.5"
            placeholder="Your name"
            maxLength={40}
          />
          <button onClick={handleSave} disabled={loading} className="btn-primary text-xs px-3 py-1.5">
            {loading ? '...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-nova-400 hover:text-nova-300 transition-colors"
        >
          ✏️ Edit name
        </button>
      )}
    </div>
  )
}
