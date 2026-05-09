'use client'
import { useAppSession } from '@/lib/use-app-session'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { getCategoryColor, cn } from '@/lib/utils'
import { RedeemModal } from '@/components/rewards/RedeemModal'

interface Reward {
  id: string; title: string; description: string; pointCost: number;
  category: string; isFunctional: boolean; stock: number; iconEmoji: string;
  canAfford: boolean; inStock: boolean; isOneTime: boolean; alreadyClaimed: boolean
}

const CATEGORIES = ['all', 'voucher', 'digital', 'exclusive', 'physical']

export default function RewardsPage() {
  const { data: session } = useAppSession()
  const router = useRouter()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Reward | null>(null)

  const fetchRewards = useCallback(async () => {
    const res = await fetch('/api/rewards')
    const data = await res.json()
    setRewards(data.rewards || [])
    setBalance(data.balance ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { fetchRewards() }, [fetchRewards])

  const sortRewards = (list: Reward[]) =>
    [...list].sort((a, b) => {
      const rank = (r: Reward) =>
        r.alreadyClaimed ? 3 : !r.inStock ? 2 : !r.canAfford ? 1 : 0
      return rank(a) - rank(b)
    })
  const filtered = sortRewards(filter === 'all' ? rewards : rewards.filter(r => r.category === filter))

  const handleCardClick = (reward: Reward) => {
    if (!session) { router.push('/auth'); return }
    if (reward.alreadyClaimed) return
    setSelected(reward)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-white mb-2">🎁 Rewards</h1>
          <p className="text-white/50">Spend your points on exclusive rewards and real-world perks.</p>
        </div>
        <div className="glass rounded-2xl px-5 py-3 text-right flex-shrink-0">
          <div className="text-xs text-white/40 mb-1">Your Balance</div>
          <div className="text-2xl font-mono font-bold text-moon-400">{session ? balance.toLocaleString() : '—'}</div>
          <div className="text-xs text-white/30">{session ? 'points' : 'sign in to earn'}</div>
        </div>
      </div>

      {/* Featured Reward (functional) */}
      {rewards.filter(r => r.isFunctional).map(reward => (
        <div key={reward.id} className="mb-10">
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-4">Featured Reward</h2>
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 group',
              reward.alreadyClaimed
                ? 'border-aurora-500/20 bg-aurora-500/5'
                : reward.canAfford
                ? 'border-aurora-500/30 bg-aurora-500/5 hover:border-aurora-400/50 hover:shadow-aurora cursor-pointer'
                : 'border-white/10 bg-white/2 opacity-60'
            )}
            onClick={() => !reward.alreadyClaimed && handleCardClick(reward)}
          >
            {!reward.alreadyClaimed && <div className="absolute inset-0 bg-aurora-glow opacity-0 group-hover:opacity-100 transition-opacity" />}
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
              <div className={cn('text-5xl', reward.alreadyClaimed && 'opacity-50')}>{reward.iconEmoji}</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className={cn('font-display text-2xl font-bold', reward.alreadyClaimed ? 'text-white/50' : 'text-white')}>{reward.title}</h3>
                  <span className={cn('badge', getCategoryColor(reward.category), 'border-current/20 bg-current/10')}>
                    {reward.category}
                  </span>
                  {reward.isOneTime && !reward.alreadyClaimed && (
                    <span className="badge border-moon-500/30 text-moon-400 bg-moon-500/10">One-time only</span>
                  )}
                </div>
                <p className="text-white/50 text-sm mb-4 max-w-lg">{reward.description}</p>
                {!reward.alreadyClaimed && (
                  <div className="flex items-center gap-3">
                    <span className="text-moon-400 font-mono font-bold text-xl">{reward.pointCost.toLocaleString()}</span>
                    <span className="text-white/30 text-sm">pts</span>
                    {!reward.canAfford && (
                      <span className="text-red-400 text-xs">Need {(reward.pointCost - balance).toLocaleString()} more pts</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {reward.alreadyClaimed ? (
                  <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl bg-aurora-500/10 border border-aurora-500/20">
                    <span className="text-2xl">✓</span>
                    <span className="text-aurora-400 font-semibold text-sm">Already Claimed</span>
                    <span className="text-white/30 text-xs">One-time reward</span>
                  </div>
                ) : (
                  <button
                    className={cn(
                      'px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                      reward.canAfford ? 'btn-primary group-hover:scale-105' : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                    )}
                    onClick={e => { e.stopPropagation(); if (reward.canAfford) handleCardClick(reward) }}
                  >
                    {reward.canAfford ? '🎁 Redeem Now' : '🔒 Insufficient Points'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all',
              filter === cat
                ? 'bg-nova-500/20 text-nova-300 border border-nova-500/30'
                : 'text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-56 shimmer-bg" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(reward => (
            <RewardCard key={reward.id} reward={reward} balance={balance} onClick={() => handleCardClick(reward)} />
          ))}
        </div>
      )}

      {selected && (
        <RedeemModal
          reward={selected}
          balance={balance}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); window.location.reload() }}
        />
      )}
    </div>
  )
}

function RewardCard({ reward, balance, onClick }: { reward: Reward; balance: number; onClick: () => void }) {
  const affordable = reward.canAfford && reward.inStock && !reward.alreadyClaimed

  return (
    <div
      onClick={affordable ? onClick : undefined}
      className={cn(
        'relative overflow-hidden transition-all duration-200 flex flex-col rounded-2xl border p-5',
        reward.alreadyClaimed
          ? 'border-aurora-500/20 bg-aurora-500/5 cursor-not-allowed opacity-70'
          : affordable
          ? 'border-white/10 bg-white/3 hover:border-moon-500/30 hover:shadow-moon cursor-pointer hover:bg-white/5'
          : 'border-white/5 bg-white/2 cursor-not-allowed opacity-50'
      )}
    >
      {/* Status badges */}
      {reward.isFunctional && !reward.alreadyClaimed && (
        <div className="absolute top-3 left-3 bg-aurora-500/20 border border-aurora-500/30 text-aurora-400 text-xs px-2 py-0.5 rounded-full">
          ✓ Live
        </div>
      )}
      {!reward.alreadyClaimed && reward.isOneTime && (
        <div className="absolute top-3 right-3 bg-moon-500/20 border border-moon-500/30 text-moon-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
          One-time
        </div>
      )}
      {!reward.alreadyClaimed && !reward.inStock && (
        <div className="absolute top-3 right-3 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] px-2 py-0.5 rounded-full">
          Out of Stock
        </div>
      )}

      <div className="text-4xl mb-3 mt-1">{reward.iconEmoji}</div>
      <h3 className="font-display text-lg font-bold text-white mb-2 leading-tight">{reward.title}</h3>
      <p className="text-white/50 text-xs mb-4 flex-1 line-clamp-2">{reward.description}</p>

      {/* Bottom: price + action */}
      <div className="mt-auto">
        {reward.alreadyClaimed ? (
          <div className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-aurora-500/10 border border-aurora-500/20 text-aurora-400 text-sm font-medium">
            <span>✓</span> Already Claimed
          </div>
        ) : (
          <div className="flex items-end justify-between">
            <div>
              <span className="text-moon-400 font-mono font-bold text-lg">{reward.pointCost.toLocaleString()}</span>
              <span className="text-white/30 text-xs ml-1">pts</span>
              {!reward.canAfford && reward.inStock && (
                <div className="text-red-400/70 text-xs font-mono mt-0.5">
                  Need {(reward.pointCost - balance).toLocaleString()} more
                </div>
              )}
            </div>
            <span className={cn('text-xs capitalize', getCategoryColor(reward.category))}>
              {reward.category}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
