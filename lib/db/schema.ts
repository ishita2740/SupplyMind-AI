import { pgTable, text, timestamp, integer, numeric, boolean, jsonb, varchar, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// BETTER AUTH TABLES (required, do not modify)
// ============================================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
})

// ============================================================================
// SUPPLYMIND AI TABLES
// ============================================================================

// Organizations
export const organization = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    logoUrl: text('logoUrl'),
    industry: varchar('industry', { length: 100 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => [index('idx_org_user').on(table.userId)]
)

// Suppliers
export const supplier = pgTable(
  'supplier',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    organizationId: text('organizationId').notNull(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    country: varchar('country', { length: 100 }),
    leadTime: integer('leadTime'), // in days
    reliabilityScore: numeric('reliabilityScore', { precision: 5, scale: 2 }),
    costScore: numeric('costScore', { precision: 5, scale: 2 }),
    qualityScore: numeric('qualityScore', { precision: 5, scale: 2 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => [index('idx_supplier_org').on(table.organizationId), index('idx_supplier_user').on(table.userId)]
)

// Inventory Items
export const inventoryItem = pgTable(
  'inventory_item',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    organizationId: text('organizationId').notNull(),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    name: text('name').notNull(),
    category: varchar('category', { length: 100 }),
    currentStock: integer('currentStock').notNull(),
    reorderPoint: integer('reorderPoint').notNull(),
    reorderQuantity: integer('reorderQuantity').notNull(),
    unitCost: numeric('unitCost', { precision: 10, scale: 2 }),
    supplierId: text('supplierId'),
    lastRestockDate: timestamp('lastRestockDate'),
    turnoverRate: numeric('turnoverRate', { precision: 5, scale: 2 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_inventory_org').on(table.organizationId),
    index('idx_inventory_user').on(table.userId),
    index('idx_inventory_sku').on(table.sku),
  ]
)

// Stock History (for analytics)
export const stockHistory = pgTable(
  'stock_history',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    itemId: text('itemId').notNull(),
    quantity: integer('quantity').notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'in' or 'out'
    reason: varchar('reason', { length: 200 }),
    recordedAt: timestamp('recordedAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_stock_hist_item').on(table.itemId),
    index('idx_stock_hist_user').on(table.userId),
  ]
)

// Orders (Purchase Orders & Sales Orders)
export const order = pgTable(
  'order',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    organizationId: text('organizationId').notNull(),
    orderNumber: varchar('orderNumber', { length: 100 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'purchase' or 'sales'
    supplierId: text('supplierId'),
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, confirmed, shipped, delivered
    totalAmount: numeric('totalAmount', { precision: 15, scale: 2 }).notNull(),
    orderDate: timestamp('orderDate').notNull(),
    expectedDelivery: timestamp('expectedDelivery'),
    actualDelivery: timestamp('actualDelivery'),
    items: jsonb('items'), // {sku, quantity, unitPrice}[]
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_order_org').on(table.organizationId),
    index('idx_order_user').on(table.userId),
    index('idx_order_status').on(table.status),
  ]
)

// Demand Forecasts
export const demandForecast = pgTable(
  'demand_forecast',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    itemId: text('itemId').notNull(),
    forecastDate: timestamp('forecastDate').notNull(),
    demandQuantity: integer('demandQuantity').notNull(),
    confidence: numeric('confidence', { precision: 5, scale: 2 }).notNull(), // 0-100
    algorithm: varchar('algorithm', { length: 50 }).notNull(), // 'xgboost' or 'prophet'
    lowerBound: integer('lowerBound'),
    upperBound: integer('upperBound'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_forecast_item').on(table.itemId),
    index('idx_forecast_user').on(table.userId),
  ]
)

// Revenue Data
export const revenueRecord = pgTable(
  'revenue_record',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    organizationId: text('organizationId').notNull(),
    recordDate: timestamp('recordDate').notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    category: varchar('category', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_revenue_org').on(table.organizationId),
    index('idx_revenue_user').on(table.userId),
  ]
)

// Quality Metrics
export const qualityMetric = pgTable(
  'quality_metric',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    supplierId: text('supplierId'),
    itemId: text('itemId'),
    recordDate: timestamp('recordDate').notNull(),
    defectRate: numeric('defectRate', { precision: 5, scale: 2 }),
    passRate: numeric('passRate', { precision: 5, scale: 2 }),
    inspectionCount: integer('inspectionCount'),
    defectCount: integer('defectCount'),
    notes: text('notes'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_quality_supplier').on(table.supplierId),
    index('idx_quality_item').on(table.itemId),
    index('idx_quality_user').on(table.userId),
  ]
)

// Risk Factors
export const riskFactor = pgTable(
  'risk_factor',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    supplierId: text('supplierId'),
    factorType: varchar('factorType', { length: 100 }).notNull(), // 'geopolitical', 'financial', 'quality', etc
    severity: varchar('severity', { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
    description: text('description'),
    mitigation: text('mitigation'),
    detectedDate: timestamp('detectedDate').notNull(),
    resolvedDate: timestamp('resolvedDate'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_risk_supplier').on(table.supplierId),
    index('idx_risk_user').on(table.userId),
  ]
)

// Compliance Records
export const complianceRecord = pgTable(
  'compliance_record',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    organizationId: text('organizationId').notNull(),
    regulation: varchar('regulation', { length: 200 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // 'compliant', 'at-risk', 'non-compliant'
    dueDate: timestamp('dueDate'),
    lastVerified: timestamp('lastVerified'),
    notes: text('notes'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_compliance_org').on(table.organizationId),
    index('idx_compliance_user').on(table.userId),
  ]
)

// Simulation Scenarios
export const simulationScenario = pgTable(
  'simulation_scenario',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    organizationId: text('organizationId').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    discountPercent: numeric('discountPercent', { precision: 5, scale: 2 }).notNull(),
    festivalImpactPercent: numeric('festivalImpactPercent', { precision: 5, scale: 2 }).notNull(),
    baselineRevenue: numeric('baselineRevenue', { precision: 15, scale: 2 }),
    projectedRevenue: numeric('projectedRevenue', { precision: 15, scale: 2 }),
    projectedMargin: numeric('projectedMargin', { precision: 15, scale: 2 }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_scenario_org').on(table.organizationId),
    index('idx_scenario_user').on(table.userId),
  ]
)

// Analytics Events
export const analyticsEvent = pgTable(
  'analytics_event',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    organizationId: text('organizationId').notNull(),
    eventType: varchar('eventType', { length: 100 }).notNull(),
    eventData: jsonb('eventData'),
    recordedAt: timestamp('recordedAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_analytics_org').on(table.organizationId),
    index('idx_analytics_user').on(table.userId),
  ]
)

// AI Assistant Conversation History
export const aiConversation = pgTable(
  'ai_conversation',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    organizationId: text('organizationId').notNull(),
    title: text('title'),
    messages: jsonb('messages'), // {role, content, timestamp}[]
    context: jsonb('context'), // contextual data for recommendations
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => [
    index('idx_conversation_org').on(table.organizationId),
    index('idx_conversation_user').on(table.userId),
  ]
)

// User Settings & API Keys
export const userSettings = pgTable(
  'user_settings',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().unique(),
    apiKeyHash: text('apiKeyHash'),
    notificationsEnabled: boolean('notificationsEnabled').default(true),
    theme: varchar('theme', { length: 20 }).default('light'),
    preferences: jsonb('preferences'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => [index('idx_settings_user').on(table.userId)]
)

// ============================================================================
// RELATIONS (for type-safe queries)
// ============================================================================

export const organizationRelations = relations(organization, ({ many }) => ({
  suppliers: many(supplier),
  inventoryItems: many(inventoryItem),
  orders: many(order),
  revenues: many(revenueRecord),
  compliance: many(complianceRecord),
  scenarios: many(simulationScenario),
  analytics: many(analyticsEvent),
  conversations: many(aiConversation),
}))

export const supplierRelations = relations(supplier, ({ many }) => ({
  inventoryItems: many(inventoryItem),
  qualityMetrics: many(qualityMetric),
  riskFactors: many(riskFactor),
  orders: many(order),
}))

export const inventoryItemRelations = relations(inventoryItem, ({ many, one }) => ({
  stockHistory: many(stockHistory),
  forecasts: many(demandForecast),
  qualityMetrics: many(qualityMetric),
  supplier: one(supplier, {
    fields: [inventoryItem.supplierId],
    references: [supplier.id],
  }),
}))

export const orderRelations = relations(order, ({ one }) => ({
  supplier: one(supplier, {
    fields: [order.supplierId],
    references: [supplier.id],
  }),
  organization: one(organization, {
    fields: [order.organizationId],
    references: [organization.id],
  }),
}))
