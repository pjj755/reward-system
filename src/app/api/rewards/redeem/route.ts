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
  if (reward.limitPerUser !== -1) {
    const existingCount = await prisma.redemption.count({
      where: { userId, rewardId },
    })
    if (existingCount >= reward.limitPerUser) {
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

  // Interactive transaction — re-validates stock inside to prevent overselling
  const redemption = await prisma.$transaction(async (tx) => {
    if (reward.stock !== -1) {
      const fresh = await tx.reward.findUnique({ where: { id: rewardId }, select: { stock: true } })
      if (!fresh || fresh.stock <= 0) throw new Error('OUT_OF_STOCK')
    }

    const created = await tx.redemption.create({
      data: { userId, rewardId, pointsSpent: reward.pointCost, status: 'completed', code },
    })
    await tx.user.update({
      where: { id: userId },
      data: {
        pointsBalance: { decrement: reward.pointCost },
        totalSpent: { increment: reward.pointCost },
      },
    })
    await tx.pointTransaction.create({
      data: {
        userId,
        amount: -reward.pointCost,
        type: 'redemption',
        description: `Redeemed: ${reward.title}`,
      },
    })
    if (reward.stock !== -1) {
      await tx.reward.update({ where: { id: rewardId }, data: { stock: { decrement: 1 } } })
    }
    return created
  }).catch((err) => {
    if (err.message === 'OUT_OF_STOCK') return null
    throw err
  })

  if (!redemption) {
    return NextResponse.json({ error: 'Out of stock' }, { status: 409 })
  }

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
