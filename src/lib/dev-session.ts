import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import type { Session } from 'next-auth'

const DEV_USER_ID = 'dev-user-001'
const DEV_USER_EMAIL = 'dev@local.dev'

export async function getDevSession(): Promise<Session | null> {
  if (process.env.SKIP_AUTH !== 'true') {
    return getServerSession(authOptions)
  }

  const user = await prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {},
    create: { id: DEV_USER_ID, email: DEV_USER_EMAIL, name: 'Dev User', pointsBalance: 100, totalEarned: 100 },
    select: { id: true, pointsBalance: true, totalEarned: true, currentStreak: true },
  })

  return {
    user: {
      id: user.id,
      email: DEV_USER_EMAIL,
      name: 'Dev User',
      pointsBalance: user.pointsBalance,
      totalEarned: user.totalEarned,
      currentStreak: user.currentStreak,
    },
    expires: new Date(Date.now() + 86400_000).toISOString(),
  }
}
