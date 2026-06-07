'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { demandForecast, inventoryItem } from '@/lib/db/schema'
import { and, eq, gte } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getForecastData() {
  const userId = await getUserId()

  const orgs = await db.query.organization.findMany({
    where: (org) => eq(org.userId, userId),
    limit: 1,
  })

  if (!orgs.length) return { forecasts: [], items: [] }

  const orgId = orgs[0].id

  // Get inventory items
  const items = await db
    .select()
    .from(inventoryItem)
    .where(
      and(
        eq(inventoryItem.userId, userId),
        eq(inventoryItem.organizationId, orgId)
      )
    )
    .limit(10)

  // Get forecasts for the next 30 days
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const today = new Date()

  const forecasts = await db
    .select()
    .from(demandForecast)
    .where(
      and(
        eq(demandForecast.userId, userId),
        eq(demandForecast.organizationId, orgId),
        gte(demandForecast.forecastDate, today),
        gte(futureDate, demandForecast.forecastDate)
      )
    )

  // Group forecasts by item
  const forecastByItem = items.map((item) => {
    const itemForecasts = forecasts
      .filter((f) => f.itemId === item.id)
      .sort((a, b) => a.forecastDate.getTime() - b.forecastDate.getTime())

    return {
      item,
      forecasts: itemForecasts.map((f) => ({
        date: f.forecastDate,
        demand: f.demandQuantity,
        confidence: f.confidence,
        lowerBound: f.lowerBound || 0,
        upperBound: f.upperBound || f.demandQuantity * 2,
        algorithm: f.algorithm,
      })),
    }
  })

  return {
    items,
    forecastByItem,
  }
}

export async function getAccuracyMetrics() {
  const userId = await getUserId()

  const orgs = await db.query.organization.findMany({
    where: (org) => eq(org.userId, userId),
    limit: 1,
  })

  if (!orgs.length) {
    return {
      xgboostAccuracy: 0,
      prophetAccuracy: 0,
      arimaAccuracy: 0,
      avgAccuracy: 0,
    }
  }

  const orgId = orgs[0].id

  const forecasts = await db
    .select()
    .from(demandForecast)
    .where(
      and(
        eq(demandForecast.userId, userId),
        eq(demandForecast.organizationId, orgId)
      )
    )

  const byAlgorithm = {
    xgboost: forecasts.filter((f) => f.algorithm === 'xgboost'),
    prophet: forecasts.filter((f) => f.algorithm === 'prophet'),
    arima: forecasts.filter((f) => f.algorithm === 'arima'),
  }

  const calculateAccuracy = (items: typeof forecasts) =>
    items.length > 0
      ? Math.round((items.reduce((sum, f) => sum + (f.confidence || 0), 0) / items.length) * 100)
      : 0

  return {
    xgboostAccuracy: calculateAccuracy(byAlgorithm.xgboost),
    prophetAccuracy: calculateAccuracy(byAlgorithm.prophet),
    arimaAccuracy: calculateAccuracy(byAlgorithm.arima),
    avgAccuracy: calculateAccuracy(forecasts),
  }
}
