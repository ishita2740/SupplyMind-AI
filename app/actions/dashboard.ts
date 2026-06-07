'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  revenueRecord,
  demandForecast,
  inventoryItem,
  order,
  riskFactor,
} from '@/lib/db/schema'
import { and, eq, gte, lte, desc } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getDashboardMetrics() {
  return {
    revenue: 125000,
    forecastAccuracy: 94,
    inventoryHealth: 88,
    activeAlerts: 3,
  }
}

export async function getRevenueChart() {
  return [
    { month: 'Jan', revenue: 10000 },
    { month: 'Feb', revenue: 12000 },
    { month: 'Mar', revenue: 15000 },
    { month: 'Apr', revenue: 18000 },
    { month: 'May', revenue: 22000 },
    { month: 'Jun', revenue: 25000 },
  ]
}

export async function getAlerts() {
  return [
    {
      id: '1',
      title: 'Low Inventory',
      description: 'Inventory below threshold',
      severity: 'high',
      timestamp: new Date(),
    },
  ]
}
