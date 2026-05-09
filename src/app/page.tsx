import Link from 'next/link'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'
import { isToday } from '@/lib/utils'
import WelcomeBonusBanner from '@/components/WelcomeBonusBanner'

export default async function HomePage() {
  const session = await getDevSession()

  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          pointsBalance: true, totalEarned: true, currentStreak: true,
          longestStreak: true, lastCheckinAt: true, name: true,
          welcomeBonusClaimed: true,
          _count: { select: { questCompletions: true, redemptions: true } },
        },
      })
    : null

  const checkedInToday = user?.lastCheckinAt ? isToday(new Date(user.lastCheckinAt)) : false
  const displayName = user?.name ?? session?.user.email?.split('@')[0] ?? 'Explorer'
  const showWelcomeBanner = session && !user?.welcomeBonusClaimed

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {!session && (
        <div className="mb-8 relative overflow-hidden rounded-2xl border border-aurora-500/30 bg-gradient-to-r from-aurora-500/10 via-nova-500/10 to-moon-500/10 p-6">
          <div className="absolute inset-0 pointer-events-none">
            {['🎉','⭐','✨','🚀','🌙','💫','🎁','⚡'].map((emoji, i) => (
              <div key={i} className="absolute text-2xl animate-float" style={{
                left: `${10 + i * 12}%`, top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.3}s`, opacity: 0.4,
              }}>
                {emoji}
              </div>
            ))}
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🎁</span>
                <h2 className="font-display text-xl font-bold text-white">New User Welcome Bonus</h2>
              </div>
              <p className="text-white/60 text-sm">
                Register now and claim <span className="text-aurora-400 font-bold">100 free points</span> — enough to redeem your first reward instantly!
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center glass rounded-xl px-4 py-2 border border-aurora-500/20">
                <div className="text-2xl font-bold font-mono text-aurora-400">+100</div>
                <div className="text-xs text-white/40">free points</div>
              </div>
              <Link href="/auth" className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
                Claim Now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {showWelcomeBanner && (
        <WelcomeBonusBanner displayName={displayName} />
      )}

      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-nova-300 mb-6 border border-nova-500/20">
          <span className="w-2 h-2 rounded-full bg-aurora-400 animate-pulse" />
          {session
            ? (showWelcomeBanner ? `Welcome, ${displayName}` : `Welcome back, ${displayName}`)
            : 'Start your journey today'}
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-bold mb-4 leading-tight">
          <span className="gradient-text">Reach for</span>
          <br />
          <span className="text-white">the Moon</span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Complete quests, build streaks, and redeem exclusive rewards on your journey to the stars.
        </p>
        {!session && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/auth" className="btn-primary px-8 py-3">
              Get Started — It's Free
            </Link>
            <Link href="/quests" className="btn-ghost px-6 py-3">
              Browse Quests
            </Link>
          </div>
        )}
      </div>

      {/* Stats Grid — only for logged-in users */}
      {session && <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Points Balance', value: session ? (user?.pointsBalance ?? 0).toLocaleString() : '—', icon: '⭐', color: 'text-moon-400' },
          { label: 'Current Streak', value: session ? `${user?.currentStreak ?? 0} days` : '—', icon: '🔥', color: 'text-orange-400' },
          { label: 'Quests Done', value: session ? (user?._count.questCompletions ?? 0) : '—', icon: '⚡', color: 'text-nova-400' },
          { label: 'Rewards Redeemed', value: session ? (user?._count.redemptions ?? 0) : '—', icon: '🎁', color: 'text-aurora-400' },
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-white/40 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {/* Check-in CTA */}
        <div className={`card relative overflow-hidden flex flex-col ${checkedInToday ? 'border-aurora-500/30 bg-aurora-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
          <div className="absolute top-0 right-0 text-6xl opacity-10 -translate-y-2 translate-x-2">🔥</div>
          <div className="text-3xl mb-3">🔥</div>
          <h3 className="font-display text-xl font-bold mb-1">Daily Check-in</h3>
          <p className="text-white/50 text-sm mb-4 flex-1">
            {!session
              ? 'Sign in to start your daily streak and earn points every day.'
              : checkedInToday
              ? `Day ${user?.currentStreak} streak — come back tomorrow!`
              : `Streak: ${user?.currentStreak ?? 0} days. Don't break the chain!`}
          </p>
          <Link
            href={session ? '/quests' : '/auth'}
            className={checkedInToday ? 'btn-primary text-sm py-2 px-4 w-full text-center block opacity-80 pointer-events-none' : 'btn-moon text-sm py-2 px-4 w-full text-center block'}
          >
            {!session ? 'Sign In to Check In' : checkedInToday ? '✓ Checked In Today' : 'Check In Now'}
          </Link>
        </div>

        {/* Quests CTA */}
        <div className="card relative overflow-hidden border-nova-500/20 bg-nova-500/5 flex flex-col">
          <div className="absolute top-0 right-0 text-6xl opacity-10 -translate-y-2 translate-x-2">⚡</div>
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="font-display text-xl font-bold mb-1">Quests</h3>
          <p className="text-white/50 text-sm mb-4 flex-1">Explore available quests and earn points for completing challenges.</p>
          <Link href="/quests" className="btn-primary text-sm py-2 px-4 w-full text-center block">
            Browse Quests
          </Link>
        </div>

        {/* Rewards CTA */}
        <div className="card relative overflow-hidden border-aurora-500/20 bg-aurora-500/5 flex flex-col">
          <div className="absolute top-0 right-0 text-6xl opacity-10 -translate-y-2 translate-x-2">🎁</div>
          <div className="text-3xl mb-3">🎁</div>
          <h3 className="font-display text-xl font-bold mb-1">Rewards</h3>
          <p className="text-white/50 text-sm mb-4 flex-1">Spend your hard-earned points on exclusive rewards and vouchers.</p>
          <Link href="/rewards" className="btn-ghost text-sm py-2 px-4 w-full text-center block">
            View Rewards
          </Link>
        </div>
      </div>

      {/* Streak indicator */}
      {(user?.currentStreak ?? 0) > 0 && (
        <div className="card border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-moon-500/5 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl" style={{ animation: 'streakFlame 1s ease-in-out infinite alternate' }}>🔥</span>
            <div>
              <div className="font-display text-2xl font-bold text-orange-400">
                {user?.currentStreak}-Day Streak!
              </div>
              <div className="text-white/50 text-sm">
                Longest: {user?.longestStreak} days · Keep it going!
              </div>
            </div>
            <span className="text-3xl" style={{ animation: 'streakFlame 1s ease-in-out infinite alternate', animationDelay: '0.5s' }}>🔥</span>
          </div>
        </div>
      )}
    </div>
  )
}
