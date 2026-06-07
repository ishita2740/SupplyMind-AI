import { db } from '@/lib/db'
import {
  user,
  organization,
  supplier,
  inventoryItem,
  stockHistory,
  order,
  demandForecast,
  revenueRecord,
  qualityMetric,
  riskFactor,
  complianceRecord,
  simulationScenario,
  analyticsEvent,
  userSettings,
} from '@/lib/db/schema'
import { nanoid } from 'nanoid'

const CATEGORIES = ['Electronics', 'Textiles', 'Chemicals', 'Packaging', 'Raw Materials']
const COUNTRIES = ['USA', 'China', 'India', 'Germany', 'Japan', 'Mexico', 'Vietnam']
const ORDER_STATUS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const COMPLIANCE_STATUS = ['compliant', 'at-risk', 'non-compliant', 'pending-review']
const RISK_SEVERITY = ['low', 'medium', 'high', 'critical']
const ALGORITHMS = ['xgboost', 'prophet', 'arima']

export async function seedDatabase(userId: string) {
  console.log('[v0] Starting database seeding...')

  // Create organization
  const orgId = nanoid()
  await db.insert(organization).values({
    id: orgId,
    userId,
    name: 'TechFlow Supply Co',
    description: 'Leading technology supply chain provider',
    industry: 'Technology',
    logoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Create suppliers
  const suppliersResult = await Promise.all(
    Array.from({ length: 8 }).map((_, i) =>
      db
        .insert(supplier)
        .values({
          id: nanoid(),
          userId,
          organizationId: orgId,
          name: `Supplier ${i + 1}`,
          email: `supplier${i + 1}@example.com`,
          phone: `+1-555-${String(i).padStart(4, '0')}`,
          country: COUNTRIES[i % COUNTRIES.length],
          leadTime: Math.floor(Math.random() * 60) + 7,
          reliabilityScore: parseFloat((Math.random() * 2 + 3.5).toFixed(2)),
          costScore: parseFloat((Math.random() * 2 + 3).toFixed(2)),
          qualityScore: parseFloat((Math.random() * 1.5 + 3.5).toFixed(2)),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
    )
  )
  const suppliers = suppliersResult.map(s => s[0])

  // Create inventory items
  const itemsResult = await Promise.all(
    Array.from({ length: 20 }).map((_, i) =>
      db
        .insert(inventoryItem)
        .values({
          id: nanoid(),
          userId,
          organizationId: orgId,
          sku: `SKU-${String(i + 1).padStart(5, '0')}`,
          name: `Product ${i + 1}`,
          category: CATEGORIES[i % CATEGORIES.length],
          currentStock: Math.floor(Math.random() * 1000) + 100,
          reorderPoint: Math.floor(Math.random() * 200) + 50,
          reorderQuantity: Math.floor(Math.random() * 500) + 200,
          unitCost: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
          supplierId: suppliers[i % suppliers.length].id,
          lastRestockDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          turnoverRate: parseFloat((Math.random() * 10 + 2).toFixed(2)),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
    )
  )
  const items = itemsResult.map(i => i[0])

  // Create stock history records
  await Promise.all(
    Array.from({ length: 50 }).map(() =>
      db.insert(stockHistory).values({
        id: nanoid(),
        userId,
        quantity: Math.floor(Math.random() * 500),
        type: Math.random() > 0.5 ? 'inbound' : 'outbound',
        reason: Math.random() > 0.5 ? 'sale' : 'restock',
        recordedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      })
    )
  )

  // Create orders
  const orders = await Promise.all(
    Array.from({ length: 15 }).map((_, i) =>
      db
        .insert(order)
        .values({
          id: nanoid(),
          userId,
          organizationId: orgId,
          orderNumber: `ORD-${String(i + 1).padStart(6, '0')}`,
          type: Math.random() > 0.5 ? 'purchase' : 'sales',
          supplierId: suppliers[i % suppliers.length].id,
          status: ORDER_STATUS[Math.floor(Math.random() * ORDER_STATUS.length)],
          totalAmount: parseFloat((Math.random() * 50000 + 5000).toFixed(2)),
          orderDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          expectedDelivery: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          actualDelivery:
            Math.random() > 0.5
              ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
              : null,
          items: {
            count: Math.floor(Math.random() * 10) + 1,
            value: parseFloat((Math.random() * 50000 + 5000).toFixed(2)),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
    )
  )

  // Create demand forecasts
  await Promise.all(
    Array.from({ length: 60 }).map(() =>
      db.insert(demandForecast).values({
        id: nanoid(),
        userId,
        organizationId: orgId,
        itemId: items[Math.floor(Math.random() * items.length)].id,
        forecastDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        demandQuantity: Math.floor(Math.random() * 500) + 50,
        confidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)),
        algorithm: ALGORITHMS[Math.floor(Math.random() * ALGORITHMS.length)],
        lowerBound: Math.floor(Math.random() * 300),
        upperBound: Math.floor(Math.random() * 300) + 300,
        createdAt: new Date(),
      })
    )
  )

  // Create revenue records
  await Promise.all(
    Array.from({ length: 24 }).map((_, i) =>
      db.insert(revenueRecord).values({
        id: nanoid(),
        userId,
        organizationId: orgId,
        recordDate: new Date(Date.now() - (24 - i) * 30 * 24 * 60 * 60 * 1000),
        amount: parseFloat((Math.random() * 100000 + 50000).toFixed(2)),
        category: CATEGORIES[i % CATEGORIES.length],
        notes: `Revenue for month ${i + 1}`,
        createdAt: new Date(),
      })
    )
  )

  // Create quality metrics
  await Promise.all(
    Array.from({ length: 30 }).map(() =>
      db.insert(qualityMetric).values({
        id: nanoid(),
        userId,
        organizationId: orgId,
        supplierId: suppliers[Math.floor(Math.random() * suppliers.length)].id,
        itemId: items[Math.floor(Math.random() * items.length)].id,
        recordDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        defectRate: parseFloat((Math.random() * 5).toFixed(2)),
        passRate: parseFloat((Math.random() * 15 + 85).toFixed(2)),
        inspectionCount: Math.floor(Math.random() * 500) + 50,
        defectCount: Math.floor(Math.random() * 50),
        notes: 'Quality inspection record',
        createdAt: new Date(),
      })
    )
  )

  // Create risk factors
  await Promise.all(
    Array.from({ length: 12 }).map(() =>
      db.insert(riskFactor).values({
        id: nanoid(),
        userId,
        organizationId: orgId,
        supplierId: suppliers[Math.floor(Math.random() * suppliers.length)].id,
        factorType: 'supply_delay',
        severity: RISK_SEVERITY[Math.floor(Math.random() * RISK_SEVERITY.length)],
        description: 'Potential supply chain disruption',
        mitigation: 'Diversify suppliers',
        detectedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        resolvedDate: Math.random() > 0.5 ? new Date() : null,
        createdAt: new Date(),
      })
    )
  )

  // Create compliance records
  await Promise.all(
    Array.from({ length: 8 }).map((_, i) =>
      db.insert(complianceRecord).values({
        id: nanoid(),
        userId,
        organizationId: orgId,
        regulation: `Regulation ${i + 1}`,
        status: COMPLIANCE_STATUS[Math.floor(Math.random() * COMPLIANCE_STATUS.length)],
        dueDate: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000),
        lastVerified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        notes: 'Compliance check completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )
  )

  // Create simulation scenarios
  await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      db.insert(simulationScenario).values({
        id: nanoid(),
        userId,
        organizationId: orgId,
        name: `Scenario ${i + 1}`,
        description: `Business simulation scenario ${i + 1}`,
        discountPercent: parseFloat((Math.random() * 20).toFixed(2)),
        festivalImpactPercent: parseFloat((Math.random() * 50 + 10).toFixed(2)),
        baselineRevenue: parseFloat((Math.random() * 1000000 + 500000).toFixed(2)),
        projectedRevenue: parseFloat((Math.random() * 1000000 + 500000).toFixed(2)),
        projectedMargin: parseFloat((Math.random() * 30 + 20).toFixed(2)),
        createdAt: new Date(),
      })
    )
  )

  // Create user settings
  await db.insert(userSettings).values({
    id: nanoid(),
    userId,
    apiKeyHash: null,
    notificationsEnabled: true,
    theme: 'light',
    preferences: {
      currency: 'USD',
      timezone: 'UTC',
      language: 'en',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  console.log('[v0] Database seeding completed!')
}
