'use client'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useAppSession } from '@/lib/use-app-session'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'

const navLinks = [
  { href: '/quests', label: 'Quests', icon: '⚡' },
  { href: '/rewards', label: 'Rewards', icon: '🎁' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export function Navbar() {
  const { data: session } = useAppSession()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-space-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:animate-float transition-all">🌙</span>
            <span className="font-display text-xl font-bold gradient-text">Moonshot</span>
          </Link>

          {/* Nav Links */}
          {session && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    pathname === link.href
                      ? 'bg-nova-500/20 text-nova-300 border border-nova-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                {/* Points Badge */}
                <Link href="/profile" className="hidden sm:flex items-center gap-2 glass rounded-xl px-3 py-1.5 hover:bg-white/10 transition-all">
                  <span className="text-sm">⭐</span>
                  <span className="points-display text-sm">{(session.user.pointsBalance ?? 0).toLocaleString()}</span>
                  <span className="text-white/40 text-xs">pts</span>
                </Link>

                {/* Notification Bell */}
                <NotificationBell />

                {/* Avatar */}
                <div className="relative group">
                  <button className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-nova-500/20 border border-nova-500/30 flex items-center justify-center text-xs font-medium text-nova-300">
                      {session.user.name?.[0]?.toUpperCase() ?? session.user.email?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-44 glass rounded-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-card">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      Profile
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link href="/auth" className="btn-primary py-2 px-4 text-sm">
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {session && (
          <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                  pathname === link.href
                    ? 'bg-nova-500/20 text-nova-300'
                    : 'text-white/50 hover:text-white'
                )}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5">
              <span className="text-xs text-moon-400 font-mono font-medium">
                {(session.user.pointsBalance ?? 0).toLocaleString()} pts
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
