import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'

function magicLinkHtml(url: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f1a;color:#fff;border-radius:16px">
      <h2 style="color:#fff;margin-bottom:8px">Sign in to Moonshot Rewards 🌙</h2>
      <p style="color:#aaa">Click the button below to sign in. This link expires in 24 hours.</p>
      <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
        Sign In to Moonshot
      </a>
      <p style="color:#666;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `
}

function buildEmailProvider() {
  const from = process.env.EMAIL_FROM ?? 'Moonshot <noreply@moonshot.local>'

  const hasResend = !!process.env.RESEND_API_KEY
  const hasSmtp = process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD

  if (hasResend) {
    return EmailProvider({
      from,
      server: 'smtp://localhost:25',
      async sendVerificationRequest({ identifier, url, provider }) {
        console.log('[EmailProvider] Sending via Resend to', identifier)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        try {
          const result = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: provider.from,
              to: identifier,
              subject: 'Sign in to Moonshot Rewards',
              html: magicLinkHtml(url),
            }),
            signal: controller.signal,
          })
          if (!result.ok) {
            const text = await result.text()
            throw new Error(`Resend API error: ${result.status} ${text}`)
          }
          console.log('[EmailProvider] Resend: email sent to', identifier)
        } finally {
          clearTimeout(timeout)
        }
      },
    })
  }

  if (hasSmtp) {
    return EmailProvider({
      from,
      server: {
        host: process.env.EMAIL_SERVER_HOST ?? 'smtp.gmail.com',
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      async sendVerificationRequest({ identifier, url, provider }) {
        const host = process.env.EMAIL_SERVER_HOST ?? 'smtp.gmail.com'
        const port = Number(process.env.EMAIL_SERVER_PORT ?? 587)
        console.log('[EmailProvider] Sending email via SMTP', host, ':', port)

        const nodemailer = (await import('nodemailer')).default
        const transport = nodemailer.createTransport({
          service: host.includes('gmail') ? 'gmail' : undefined,
          host: host.includes('gmail') ? undefined : host,
          port: host.includes('gmail') ? undefined : port,
          secure: port === 465,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
        })
        await transport.sendMail({
          from: provider.from,
          to: identifier,
          subject: 'Sign in to Moonshot Rewards',
          html: magicLinkHtml(url),
        })
      },
    })
  }

  if (process.env.NODE_ENV === 'development') {
    return EmailProvider({
      from,
      server: { host: 'localhost', port: 25, auth: { user: '', pass: '' } },
      sendVerificationRequest({ url }) {
        console.log('\n🔗 Magic Link (dev mode):')
        console.log(url)
        console.log()
      },
    })
  }

  return null
}

const emailProvider = buildEmailProvider()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    ...(emailProvider ? [emailProvider] : []),
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
            },
          })
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
}
