'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { inventoryItem } from '@/lib/db/schema'
import { and, eq, lt } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getInventoryItems() {
  const userId = await getUserId()

  const orgs = await db.query.organization.findMany({
    where: (org) => eq(org.userId, userId),
    limit: 1,
  })

  if (!orgs.length) return { items: [], stats: {} }

  const orgId = orgs[0].id

  const items = await db
    .select()
    .from(inventoryItem)
    .where(
      and(
        eq(inventoryItem.userId, userId),
        eq(inventoryItem.organizationId, orgId)
      )
    )

  const stats = {
    totalItems: items.length,
    lowStockItems: items.filter((i) => i.currentStock < i.reorderPoint).length,
    outOfStockItems: items.filter((i) => i.currentStock === 0).length,
    totalValue: Math.round(
      items.reduce((sum, i) => sum + (i.currentStock * (i.unitCost || 0)), 0)
    ),
    avgTurnover: items.length > 0
      ? parseFloat(
          (items.reduce((sum, i) => sum + (i.turnoverRate || 0), 0) / items.length).toFixed(2)
        )
      : 0,
  }

  return { items, stats }
}

export async function getReorderSuggestions() {
  const userId = await getUserId()

  const orgs = await db.query.organization.findMany({
    where: (org) => eq(org.userId, userId),
    limit: 1,
  })

  if (!orgs.length) return []

  const orgId = orgs[0].id

  const lowStockItems = await db
    .select()
    .from(inventoryItem)
    .where(
      and(
        eq(inventoryItem.userId, userId),
        eq(inventoryItem.organizationId, orgId),
        lt(inventoryItem.currentStock, inventoryItem.reorderPoint)
      )
    )

  return lowStockItems.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    currentStock: item.currentStock,
    reorderPoint: item.reorderPoint,
    reorderQuantity: item.reorderQuantity,
    unitCost: item.unitCost,
    daysUntilStockout: Math.max(
      1,
      Math.floor(item.currentStock / ((item.turnoverRate || 0) / 30 || 1))
    ),
    priority: item.currentStock === 0 ? 'critical' : item.currentStock < item.reorderPoint / 2 ? 'high' : 'medium',
  }))
}

export async function getInventoryByCategory() {
  const userId = await getUserId()

  const orgs = await db.query.organization.findMany({
    where: (org) => eq(org.userId, userId),
    limit: 1,
  })

  if (!orgs.length) return []

  const orgId = orgs[0].id

  const items = await db
    .select()
    .from(inventoryItem)
    .where(
      and(
        eq(inventoryItem.userId, userId),
        eq(inventoryItem.organizationId, orgId)
      )
    )

  const byCategory: Record<string, any> = {}

  items.forEach((item) => {
    const category = item.category || 'Uncategorized'
    if (!byCategory[category]) {
      byCategory[category] = {
        category,
        items: 0,
        value: 0,
        avgTurnover: 0,
      }
    }
    byCategory[category].items += 1
    byCategory[category].value += item.currentStock * (item.unitCost || 0)
    byCategory[category].avgTurnover += item.turnoverRate || 0
  })

  return Object.values(byCategory).map((cat) => ({
    ...cat,
    value: Math.round(cat.value),
    avgTurnover: parseFloat((cat.avgTurnover / (cat.items || 1)).toFixed(2)),
  }))
}
