import { getDevSession } from '@/lib/dev-session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import CheckInCalendar from '@/components/profile/CheckInCalendar'
import EditNameForm from '@/components/profile/EditNameForm'

export default async function ProfilePage() {
  const session = await getDevSession()
  if (!session) redirect('/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, image: true, pointsBalance: true,
      totalEarned: true, totalSpent: true, currentStreak: true,
      longestStreak: true, lastCheckinAt: true, createdAt: true,
      transactions: {
        orderBy: { createdAt: 'desc' }, take: 15,
        select: { id: true, amount: true, type: true, description: true, createdAt: true },
      },
      redemptions: {
        orderBy: { redeemedAt: 'desc' }, take: 5,
        include: { reward: { select: { title: true, iconEmoji: true } } },
      },
      questCompletions: {
        orderBy: { completedAt: 'desc' },
        take: 365,
        include: { quest: { select: { title: true, iconEmoji: true, type: true } } },
      },
    },
  })
  if (!user) redirect('/auth')

  const checkinDates = user.questCompletions
    .filter(c => c.quest.type === 'daily_checkin')
    .map(c => format(new Date(c.completedAt), 'yyyy-MM-dd'))

  const claimedQuests = user.questCompletions.filter(c => c.claimed)

  const displayName = user.name ?? user.email?.split('@')[0] ?? 'Explorer'
  const initials = displayName.slice(0, 2).toUpperCase()

  const level = user.totalEarned >= 5000 ? { label: 'Legend', icon: '🌟', color: 'text-moon-400' }
    : user.totalEarned >= 2000 ? { label: 'Explorer', icon: '🚀', color: 'text-nova-400' }
    : user.totalEarned >= 500 ? { label: 'Pioneer', icon: '⚡', color: 'text-aurora-400' }
    : { label: 'Recruit', icon: '🌱', color: 'text-white/60' }

  const nextLevel = user.totalEarned >= 5000 ? null
    : user.totalEarned >= 2000 ? { label: 'Legend', threshold: 5000 }
    : user.totalEarned >= 500 ? { label: 'Explorer', threshold: 2000 }
    : { label: 'Pioneer', threshold: 500 }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-4xl font-bold text-white mb-8">👤 Profile</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: User Info */}
        <div className="space-y-6">
          {/* Avatar & Name */}
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-nova-500/20 border-2 border-nova-500/30 flex items-center justify-center text-2xl font-bold text-nova-300 mx-auto mb-4">
              {user.image ? (
                <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
              ) : initials}
            </div>
            <h2 className="font-display text-xl font-bold text-white">{displayName}</h2>
            <p className="text-white/40 text-sm">{user.email}</p>
            <EditNameForm currentName={user.name ?? ''} />
            <div className={cn('flex items-center justify-center gap-2 mt-3', level.color)}>
              <span>{level.icon}</span>
              <span className="font-medium">{level.label}</span>
            </div>
            {nextLevel && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>{user.totalEarned.toLocaleString()} pts</span>
                  <span>{nextLevel.threshold.toLocaleString()} pts</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-nova-500 to-aurora-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (user.totalEarned / nextLevel.threshold) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-white/30 mt-1">
                  {(nextLevel.threshold - user.totalEarned).toLocaleString()} pts to {nextLevel.label}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card space-y-4">
            <h3 className="font-display text-lg font-bold text-white">Stats</h3>
            {[
              { label: 'Points Balance', value: user.pointsBalance.toLocaleString(), color: 'text-moon-400', icon: '⭐' },
              { label: 'Total Earned', value: user.totalEarned.toLocaleString(), color: 'text-aurora-400', icon: '📈' },
              { label: 'Total Spent', value: user.totalSpent.toLocaleString(), color: 'text-nova-400', icon: '🎁' },
              { label: 'Current Streak', value: `${user.currentStreak} days`, color: 'text-orange-400', icon: '🔥' },
              { label: 'Best Streak', value: `${user.longestStreak} days`, color: 'text-white/70', icon: '🏆' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-white/50 text-sm flex items-center gap-2">
                  <span>{s.icon}</span>{s.label}
                </span>
                <span className={cn('font-mono font-bold', s.color)}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Recent Redemptions */}
          {user.redemptions.length > 0 && (
            <div className="card">
              <h3 className="font-display text-lg font-bold text-white mb-4">Recent Redemptions</h3>
              <div className="space-y-3">
                {user.redemptions.map(r => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="text-xl">{r.reward.iconEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{r.reward.title}</div>
                      <div className="text-xs text-white/30">{format(new Date(r.redeemedAt), 'MMM d, yyyy')}</div>
                    </div>
                    <span className="text-red-400 font-mono text-xs">-{r.pointsSpent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Calendar + Transaction History */}
        <div className="lg:col-span-2 space-y-6">
          <CheckInCalendar checkinDates={checkinDates} currentStreak={user.currentStreak} />
          {/* Quest Claim History */}
          {claimedQuests.length > 0 && (
            <div className="card">
              <h3 className="font-display text-xl font-bold text-white mb-6">Quest Rewards Claimed</h3>
              <div className="space-y-3">
                {claimedQuests.slice(0, 10).map(c => (
                  <div key={c.id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                    <div className="w-9 h-9 rounded-xl bg-aurora-500/10 border border-aurora-500/20 flex items-center justify-center text-lg flex-shrink-0">
                      {c.quest.iconEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{c.quest.title}</div>
                      <div className="text-xs text-white/30">{format(new Date(c.completedAt), 'MMM d, yyyy · h:mm a')}</div>
                    </div>
                    <div className="text-aurora-400 font-mono font-bold text-sm flex-shrink-0">
                      +{c.pointsEarned} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-display text-xl font-bold text-white mb-6">Transaction History</h3>
            {user.transactions.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <div className="text-4xl mb-3">📋</div>
                <p>No transactions yet. Complete a quest to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {user.transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                      tx.amount > 0 ? 'bg-aurora-500/20 text-aurora-400' : tx.amount < 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'
                    )}>
                      {tx.amount > 0 ? '↑' : tx.amount < 0 ? '↓' : '•'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{tx.description}</div>
                      <div className="text-xs text-white/30">{format(new Date(tx.createdAt), 'MMM d, yyyy · h:mm a')}</div>
                    </div>
                    {tx.amount !== 0 && (
                      <div className={cn('font-mono font-bold text-sm flex-shrink-0', tx.amount > 0 ? 'text-aurora-400' : 'text-red-400')}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
