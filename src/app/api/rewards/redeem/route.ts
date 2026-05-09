import { NextRequest, NextResponse } from 'next/server'
import { getDevSession } from '@/lib/dev-session'
import { prisma } from '@/lib/prisma'
import { generateRedemptionCode } from '@/lib/utils'
import { markQuestPending } from '@/lib/quest-utils'

export async function POST(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { rewardId } = await req.json()
  if (!rewardId) {
    return NextResponse.json({ error: 'rewardId required' }, { status: 400 })
  }

  const userId = session.user.id

  // Fetch user and reward concurrently
  const [user, reward] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.reward.findUnique({ where: { id: rewardId } }),
  ])

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!reward || !reward.isActive) return NextResponse.json({ error: 'Reward not found' }, { status: 404 })

  // Validate stock
  if (reward.stock !== -1 && reward.stock <= 0) {
    return NextResponse.json({ error: 'Out of stock' }, { status: 409 })
  }

  // Validate per-user limit
  if (reward.limitPerUser === 1) {
    const existing = await prisma.redemption.findFirst({
      where: { userId: userId, rewardId: rewardId },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'You have already redeemed this reward' }, { status: 409 })
    }
  }

  // Validate balance
  if (user.pointsBalance < reward.pointCost) {
    return NextResponse.json(
      {
        error: 'Insufficient points',
        required: reward.pointCost,
        balance: user.pointsBalance,
        shortfall: reward.pointCost - user.pointsBalance,
      },
      { status: 402 }
    )
  }

  const code = generateRedemptionCode()

  // Atomic transaction
  const [redemption] = await prisma.$transaction([
    prisma.redemption.create({
      data: {
        userId,
        rewardId,
        pointsSpent: reward.pointCost,
        status: 'completed',
        code,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        pointsBalance: { decrement: reward.pointCost },
        totalSpent: { increment: reward.pointCost },
      },
    }),
    prisma.pointTransaction.create({
      data: {
        userId,
        amount: -reward.pointCost,
        type: 'redemption',
        description: `Redeemed: ${reward.title}`,
      },
    }),
    ...(reward.stock !== -1
      ? [prisma.reward.update({ where: { id: rewardId }, data: { stock: { decrement: 1 } } })]
      : []),
  ])

  const bonusQuest = await markQuestPending(userId, 'bonus')

  return NextResponse.json({
    success: true,
    code,
    redemptionId: redemption.id,
    reward: { title: reward.title, emoji: reward.iconEmoji },
    pointsSpent: reward.pointCost,
    newBalance: user.pointsBalance - reward.pointCost,
    bonusQuest,
  })
}
