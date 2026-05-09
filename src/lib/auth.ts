import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER_HOST
        ? {
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          }
        : 'smtp://localhost:25',
      from: process.env.EMAIL_FROM ?? 'noreply@moonshot.local',
      ...(process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVER_HOST
        ? {
            sendVerificationRequest({ url }) {
              console.log('\n🔗 Magic Link (dev mode):')
              console.log(url)
              console.log()
            },
          }
        : {}),
    }),
    CredentialsProvider({
      id: 'metamask',
      name: 'MetaMask',
      credentials: {
        address: { label: 'Wallet Address', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        message: { label: 'Message', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.address || !credentials?.signature || !credentials?.message) return null
        try {
          const { ethers } = await import('ethers')
          const recovered = ethers.verifyMessage(credentials.message, credentials.signature)
          if (recovered.toLowerCase() !== credentials.address.toLowerCase()) return null

          const shortAddr = `${credentials.address.slice(0, 6)}...${credentials.address.slice(-4)}`
          const existing = await prisma.user.findUnique({ where: { walletAddress: credentials.address.toLowerCase() } })
          const user = await prisma.user.upsert({
            where: { walletAddress: credentials.address.toLowerCase() },
            update: {},
            create: {
              walletAddress: credentials.address.toLowerCase(),
              email: `${credentials.address.toLowerCase()}@wallet.moonshot`,
              name: shortAddr,
              pointsBalance: 100,
              totalEarned: 100,
            },
          })
          if (!existing) {
            await prisma.pointTransaction.create({
              data: {
                userId: user.id,
                amount: 100,
                type: 'bonus',
                description: '🎉 Welcome bonus — thanks for joining Moonshot!',
              },
            })
          }
          return { id: user.id, name: user.name, email: user.email }
        } catch {
          return null
        }
      },
    }),
    ...(process.env.GITHUB_CLIENT_ID
      ? [GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        })]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })]
      : []),
  ],
  pages: {
    signIn: '/auth',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user && token.id) {
        session.user.id = token.id as string
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { pointsBalance: true, totalEarned: true, currentStreak: true },
        })
        if (dbUser) {
          session.user.pointsBalance = dbUser.pointsBalance
          session.user.totalEarned = dbUser.totalEarned
          session.user.currentStreak = dbUser.currentStreak
        }
      }
      return session
    },
  },
  session: { strategy: 'jwt' },
  events: {
    createUser: async ({ user }) => {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { pointsBalance: 100, totalEarned: 100 },
        }),
        prisma.pointTransaction.create({
          data: {
            userId: user.id,
            amount: 100,
            type: 'bonus',
            description: '🎉 Welcome bonus — thanks for joining Moonshot!',
          },
        }),
      ])
    },
  },
}
