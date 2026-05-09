import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/layout/Navbar'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})
const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Moonshot Rewards',
  description: 'Complete quests, earn points, redeem amazing rewards.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} font-body bg-space-950 text-white antialiased min-h-screen`}>
        <Providers>
          <div className="relative min-h-screen">
            {/* Background */}
            <div className="fixed inset-0 bg-space-gradient pointer-events-none" />
            <div className="fixed inset-0 bg-nova-glow pointer-events-none opacity-60" />
            {/* Stars */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {[...Array(60)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: Math.random() > 0.8 ? '2px' : '1px',
                    height: Math.random() > 0.8 ? '2px' : '1px',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.7 + 0.1,
                    animation: `pulse ${2 + Math.random() * 4}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 4}s`,
                  }}
                />
              ))}
            </div>
            <div className="relative z-10">
              <Navbar />
              <main>{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
