import { NextResponse } from 'next/server'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getDevSession()

  const rewards = await prisma.reward.findMany({
    where: { isActive: true },
    orderBy: [{ isFunctional: 'desc' }, { pointCost: 'asc' }],
  })

  if (!session?.user?.id) {
    return NextResponse.json({
      rewards: rewards.map(r => ({
        ...r,
        canAfford: false,
        inStock: r.stock === -1 || r.stock > 0,
        userRedemptionCount: 0,
        isOneTime: r.limitPerUser === 1,
        alreadyClaimed: false,
      })),
    })
  }

  const userId = session.user.id

  const [user, redemptionCounts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } }),
    prisma.redemption.groupBy({
      by: ['rewardId'],
      where: { userId },
      _count: { id: true },
    }),
  ])

  const countMap = new Map(redemptionCounts.map(r => [r.rewardId, r._count.id]))
  const balance = user?.pointsBalance ?? 0

  const rewardsWithMeta = rewards.map(r => {
    const userRedemptionCount = countMap.get(r.id) ?? 0
    const isOneTime = r.limitPerUser !== -1
    const alreadyClaimed = isOneTime && userRedemptionCount >= r.limitPerUser
    return {
      ...r,
      canAfford: balance >= r.pointCost,
      inStock: r.stock === -1 || r.stock > 0,
      userRedemptionCount,
      isOneTime,
      alreadyClaimed,
    }
  })

  return NextResponse.json({ rewards: rewardsWithMeta, balance })
}
