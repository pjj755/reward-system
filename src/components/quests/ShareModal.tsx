'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'

const SHARE_TEXT = `🌙 I'm earning points and exclusive rewards on Moonshot Rewards!

Complete quests, build streaks, and redeem real perks. Join me 👇`
const SHARE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://moonshot.app'

interface ShareModalProps {
  pointValue: number
  onClose: () => void
  onSuccess: () => void
}

export function ShareModal({ pointValue, onClose, onSuccess }: ShareModalProps) {
  const [phase, setPhase] = useState<'share' | 'verifying' | 'done'>('share')

  const handleShare = () => {
    const tweet = encodeURIComponent(`${SHARE_TEXT}\n${SHARE_URL}`)
    window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank', 'width=600,height=400')
    // After opening share window, show the confirm button
    setPhase('verifying')
  }

  const handleConfirm = async () => {
    setPhase('done')
    const res = await fetch('/api/quests/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questType: 'share' }),
    })
    const data = await res.json()
    setTimeout(() => {
      onSuccess()
      onClose()
    }, 1200)
    if (!data.success && !data.alreadyCompleted) {
      setPhase('verifying')
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={phase === 'done' ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-space-900 shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/60 rounded-full hover:bg-white/10 transition-all text-sm">
          ✕
        </button>

        {phase === 'done' ? (
          <div className="text-center py-4">
            <div className="relative flex items-center justify-center mb-5 h-20">
              <div className="absolute w-20 h-20 rounded-full border-2 border-aurora-400/40 animate-ping" />
              <span className="text-5xl z-10">🚀</span>
            </div>
            <div className="text-aurora-400 font-mono font-bold text-2xl mb-1">+{pointValue} pts</div>
            <div className="font-display text-lg font-bold text-white mb-1">Thanks for sharing!</div>
            <div className="text-white/40 text-sm">Reward is on its way to your inbox.</div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="font-display text-xl font-bold text-white mb-2">Share Moonshot</h3>
              <p className="text-white/40 text-sm">Post about Moonshot on Twitter/X and earn <span className="text-moon-400 font-bold">+{pointValue} pts</span>.</p>
            </div>

            {/* Preview tweet */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-nova-500/30 border border-nova-500/40 flex items-center justify-center text-xs text-nova-300 font-bold">M</div>
                <div>
                  <div className="text-white text-xs font-semibold">You</div>
                  <div className="text-white/30 text-[10px]">@you · just now</div>
                </div>
              </div>
              <p className="text-white/70 text-xs leading-relaxed whitespace-pre-line">{SHARE_TEXT}</p>
              <div className="mt-2 text-nova-400 text-xs">{SHARE_URL}</div>
            </div>

            {phase === 'share' ? (
              <button onClick={handleShare} className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on Twitter/X
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-white/40 text-xs">Shared your post? Click below to claim your reward.</p>
                <button onClick={handleConfirm} className="w-full btn-primary py-3 font-semibold">
                  ✓ I've shared it — Claim Reward
                </button>
                <button onClick={handleShare} className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-1">
                  Open share dialog again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}
