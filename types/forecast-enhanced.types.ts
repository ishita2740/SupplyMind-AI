/**
 * Enhanced Forecast Types - SupplyMind AI Integration
 * Combines your existing types with new SupplyMind features
 */

export enum ForecastAlgorithm {
  PROPHET = 'prophet',
  XGBOOST = 'xgboost',
  ARIMA = 'arima',
  ENSEMBLE = 'ensemble',
}

export enum ConfidenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface DailyForecast {
  date: string
  value: number
  lowerBound: number
  upperBound: number
  confidence: ConfidenceLevel
}

export interface ForecastMetrics {
  avgSales: number
  stdSales: number
  minSales: number
  maxSales: number
  trend: 'up' | 'down' | 'stable'
  volatility: number
}

export interface InventoryMetrics {
  currentStock: number
  reorderPoint: number
  reorderQuantity: number
  stockHealthPercentage: number
  daysOfInventory: number
  recommendedStockLevel: number
  action: 'REORDER_NOW' | 'MONITOR' | 'REDUCE_INVENTORY'
  stockHealth: 'good' | 'warning' | 'critical'
}

export interface SimulationScenario {
  scenarioName: string
  baseForecast: number
  projectedDemand: number
  changePercent: number
  factorsApplied: {
    discount: number
    marketing: number
    festival: number
    supplyConstraint: number
  }
  multipliers: {
    discountFactor: number
    marketingFactor: number
    festivalFactor: number
    supplyFactor: number
  }
  recommendation: string
}

export interface BusinessSimulation {
  scenarios: SimulationScenario[]
  recommendedScenario: string
  riskLevel: 'low' | 'medium' | 'high'
  revenueImpactRange: {
    min: number
    max: number
    recommended: number
  }
}

export interface AIInsight {
  timestamp: string
  forecastAnalysis: string
  riskAssessment: string
  inventoryStrategy: string
  opportunityAreas: string[]
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    timeline: string
  }>
  confidence: number
  dataQuality: 'low' | 'medium' | 'high'
}

export interface EnhancedForecast {
  id: string
  timestamp: string
  algorithm: ForecastAlgorithm
  forecastDays: number
  baseForecast: number
  totalForecasted: number
  
  // Forecast data
  dailyForecasts: DailyForecast[]
  metrics: ForecastMetrics
  confidence: ConfidenceLevel
  
  // Inventory
  inventoryRecommendation: InventoryMetrics
  
  // Business simulation
  simulation: BusinessSimulation
  
  // AI insights
  aiInsights: AIInsight
  
  // External factors
  externalFactors: {
    upcomingPromotion?: boolean
    marketingCampaign?: boolean
    newProductLaunch?: boolean
    availabilityIssues?: boolean
    priceChange?: string
    supplyChainDisruption?: boolean
    logisticsConstraints?: boolean
    economicUncertainty?: string
    festivals?: string[]
  }
  
  // Metadata
  category?: string
  region?: string
  dataQuality: 'low' | 'medium' | 'high'
  warnings?: string[]
  recommendations?: string[]
}

export interface KPIMetrics {
  revenue: {
    current: number
    forecast: number
    change: number
    changePercent: number
  }
  forecastAccuracy: {
    current: number
    target: number
    status: 'good' | 'warning' | 'critical'
  }
  inventoryHealth: {
    optimal: number
    current: number
    stockoutRisk: number
  }
  activeAlerts: number
}

export interface DashboardData {
  kpis: KPIMetrics
  recentForecasts: EnhancedForecast[]
  alerts: Array<{
    id: string
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: string
    action?: string
  }>
  trends: {
    revenueChart: Array<{ date: string; value: number }>
    accuracyChart: Array<{ model: string; accuracy: number }>
    inventoryChart: Array<{ date: string; level: number; optimal: number }>
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  context?: {
    forecastId?: string
    category?: string
    metric?: string
  }
}

export interface ConversationState {
  messages: ChatMessage[]
  context: {
    currentForecast?: EnhancedForecast
    selectedCategory?: string
    analysisMode?: 'forecast' | 'inventory' | 'simulation' | 'general'
  }
  isLoading: boolean
  error?: string
}

export interface SimulationInput {
  baseForecast: number
  discountPercent: number
  marketingPercent: number
  festivalPercent: number
  supplyConstraintPercent: number
}

export interface AnalyticsData {
  productAnalytics: Array<{
    name: string
    sales: number
    revenue: number
    margin: number
    trend: 'up' | 'down'
    forecastAccuracy: number
  }>
  categoryBreakdown: Array<{
    name: string
    value: number
    percentage: number
    color: string
  }>
  seasonalPatterns: Array<{
    month: string
    avgDemand: number
    variance: number
  }>
  forecastComparison: Array<{
    algorithm: string
    accuracy: number
    mape: number
    rmse: number
  }>
}
