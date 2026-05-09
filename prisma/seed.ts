import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Quests
  const quests = [
    {
      title: 'Daily Check-in',
      description: 'Check in every day to build your streak and earn bonus points. The longer your streak, the more you earn!',
      pointValue: 10,
      type: 'daily_checkin',
      category: 'daily',
      difficulty: 'easy',
      isFunctional: true,
      iconEmoji: '🔥',
      metadata: JSON.stringify({ streakBonuses: { 3: 5, 7: 20, 14: 50, 30: 100 } }),
    },
    {
      title: 'Complete Your Profile',
      description: 'Add your name to personalize your Moonshot experience.',
      pointValue: 50,
      type: 'profile',
      category: 'one_time',
      difficulty: 'easy',
      isFunctional: true,
      iconEmoji: '👤',
    },
    {
      title: 'Share Moonshot',
      description: 'Share Moonshot on Twitter/X and spread the word. Earn 150 pts for helping us grow!',
      pointValue: 150,
      type: 'share',
      category: 'one_time',
      difficulty: 'medium',
      isFunctional: true,
      iconEmoji: '🚀',
    },
    {
      title: 'First Purchase',
      description: 'Make your first reward redemption in the Moonshot store.',
      pointValue: 100,
      type: 'bonus',
      category: 'one_time',
      difficulty: 'medium',
      isFunctional: true,
      iconEmoji: '🛒',
    },
    {
      title: '7-Day Streak Champion',
      description: 'Maintain a 7-day consecutive check-in streak. Consistency is key!',
      pointValue: 200,
      type: 'challenge',
      category: 'one_time',
      difficulty: 'hard',
      isFunctional: true,
      iconEmoji: '⚡',
    },
    {
      title: 'Night Owl',
      description: 'Complete a check-in after midnight for 3 consecutive nights.',
      pointValue: 120,
      type: 'challenge',
      category: 'recurring',
      difficulty: 'medium',
      isFunctional: false,
      iconEmoji: '🦉',
    },
    {
      title: 'Moonshot Legend',
      description: 'Reach a 30-day streak. You are truly out of this world!',
      pointValue: 500,
      type: 'challenge',
      category: 'one_time',
      difficulty: 'legendary',
      isFunctional: false,
      iconEmoji: '🌙',
    },
  ]

  for (const quest of quests) {
    await prisma.quest.upsert({
      where: { id: quest.title.toLowerCase().replace(/\s+/g, '-') },
      update: quest,
      create: { id: quest.title.toLowerCase().replace(/\s+/g, '-'), ...quest },
    })
  }

  // Seed Rewards
  const rewards = [
    {
      title: 'Moonshot Sticker Pack',
      description: 'A digital pack of 12 exclusive Moonshot stickers delivered to your email. Perfect for your chats and socials!',
      pointCost: 50,
      category: 'digital',
      isFunctional: true,
      stock: -1,
      limitPerUser: 1,
      iconEmoji: '🌙',
      metadata: JSON.stringify({ deliveryMethod: 'email' }),
    },
    {
      title: '$10 Amazon Gift Card',
      description: 'Redeem for a $10 Amazon gift card delivered to your email instantly. Shop millions of products!',
      pointCost: 500,
      category: 'voucher',
      isFunctional: true,
      stock: -1,
      limitPerUser: 1,
      iconEmoji: '🎁',
      metadata: JSON.stringify({ deliveryMethod: 'email', provider: 'Amazon' }),
    },
    {
      title: 'Moonshot Premium — 1 Month',
      description: 'Unlock exclusive features, priority support, and a 2x points multiplier for 30 days.',
      pointCost: 1000,
      category: 'exclusive',
      isFunctional: false,
      stock: -1,
      iconEmoji: '⭐',
    },
    {
      title: 'Starbucks Voucher $5',
      description: 'Enjoy your favorite coffee on us. Valid at all Starbucks locations worldwide.',
      pointCost: 250,
      category: 'voucher',
      isFunctional: false,
      stock: 100,
      iconEmoji: '☕',
    },
    {
      title: 'Netflix 1-Month Subscription',
      description: 'Binge-watch your favorite shows with a full month of Netflix access.',
      pointCost: 800,
      category: 'digital',
      isFunctional: false,
      stock: 50,
      iconEmoji: '🎬',
    },
    {
      title: 'Moonshot Exclusive NFT',
      description: 'A limited-edition Moonshot collectible NFT. Only 100 will ever exist.',
      pointCost: 2000,
      category: 'exclusive',
      isFunctional: false,
      stock: 100,
      limitPerUser: 1,
      iconEmoji: '🌌',
    },
    {
      title: 'Spotify Premium — 1 Month',
      description: 'Ad-free music, offline downloads, and high-quality audio for 30 days.',
      pointCost: 600,
      category: 'digital',
      isFunctional: false,
      stock: -1,
      iconEmoji: '🎵',
    },
    {
      title: 'Moonshot Hoodie',
      description: 'Premium quality hoodie with the Moonshot logo. Show the world you\'re aiming for the stars.',
      pointCost: 3000,
      category: 'physical',
      isFunctional: false,
      stock: 25,
      limitPerUser: 1,
      iconEmoji: '👕',
    },
    {
      title: 'Double Points — 24h Boost',
      description: 'Earn 2x points on all quests and activities for the next 24 hours.',
      pointCost: 300,
      category: 'exclusive',
      isFunctional: false,
      stock: -1,
      iconEmoji: '✨',
    },
  ]

  for (const reward of rewards) {
    await prisma.reward.upsert({
      where: { id: reward.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') },
      update: reward,
      create: {
        id: reward.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        ...reward,
      },
    })
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
