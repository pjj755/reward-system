import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { nanoid } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRedemptionCode(): string {
  return `MOON-${nanoid(6).toUpperCase()}`
}

export function formatPoints(points: number): string {
  if (points >= 1000) return `${(points / 1000).toFixed(1)}k`
  return points.toString()
}

export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: 'text-aurora-400 bg-aurora-400/10 border-aurora-400/20',
    medium: 'text-moon-400 bg-moon-400/10 border-moon-400/20',
    hard: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    legendary: 'text-nova-400 bg-nova-400/10 border-nova-400/20',
  }
  return colors[difficulty] || colors.easy
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    voucher: 'text-aurora-400',
    digital: 'text-nova-400',
    exclusive: 'text-moon-400',
    physical: 'text-orange-400',
  }
  return colors[category] || 'text-gray-400'
}

export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 100
  if (streak >= 14) return 50
  if (streak >= 7) return 20
  if (streak >= 3) return 5
  return 0
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}
