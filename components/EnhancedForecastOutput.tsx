'use client'

/**
 * Enhanced Forecast Output Component
 * Integrates your existing ForecastOutput with SupplyMind AI features:
 * - KPI Dashboard
 * - Inventory Recommendations
 * - Business Simulation
 * - AI-Powered Insights
 * - Interactive Chat
 */

import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Zap,
  MessageCircle,
  BarChart3,
  Settings2,
} from 'lucide-react'
import { useForecastStore, useSimulationData, useChatState } from '@/store/forecast-enhanced.store'
import type { EnhancedForecast, SimulationInput } from '@/types/forecast-enhanced.types'

interface EnhancedForecastOutputProps {
  forecast: EnhancedForecast
  onSimulate?: (input: SimulationInput) => void
  onAskAssistant?: (question: string) => void
}

export function EnhancedForecastOutput({
  forecast,
  onSimulate,
  onAskAssistant,
}: EnhancedForecastOutputProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [simulationParams, setSimulationParams] = useState({
    discount: 0,
    marketing: 0,
    festival: 0,
    supply: 0,
  })
  const [chatInput, setChatInput] = useState('')
  const [showChat, setShowChat] = useState(false)

  const { runSimulation, setSimulationInput } = useForecastStore()
  const { askAssistant } = useForecastStore()
  const { messages, isLoadingAI } = useChatState()

  const handleSimulation = () => {
    const input: SimulationInput = {
      baseForecast: forecast.totalForecasted,
      discountPercent: simulationParams.discount,
      marketingPercent: simulationParams.marketing,
      festivalPercent: simulationParams.festival,
      supplyConstraintPercent: simulationParams.supply,
    }
    runSimulation(input)
    onSimulate?.(input)
  }

  const handleChat = async () => {
    if (!chatInput.trim()) return

    await askAssistant(chatInput)
    setChatInput('')
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#10b981'
      case 'medium':
        return '#f59e0b'
      case 'low':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecast.totalForecasted.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {forecast.metrics.trend === 'up' ? (
                <TrendingUp className="inline mr-1 h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="inline mr-1 h-3 w-3 text-red-600" />
              )}
              Trend: {forecast.metrics.trend}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ color: getConfidenceColor(forecast.confidence) }}
            >
              {forecast.confidence.charAt(0).toUpperCase() + forecast.confidence.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Data Quality: {forecast.dataQuality}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecast.inventoryRecommendation.stockHealthPercentage.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Status: {forecast.inventoryRecommendation.stockHealth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Algorithm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{forecast.algorithm}</div>
            <p className="text-xs text-muted-foreground mt-1">Forecasting Model</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {forecast.warnings && forecast.warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              {forecast.warnings.map((warning, i) => (
                <li key={i} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Trend</CardTitle>
              <CardDescription>
                {forecast.dailyForecasts.length} day forecast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={forecast.dailyForecasts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0066cc"
                    strokeWidth={2}
                    name="Forecast"
                  />
                  <Line
                    type="monotone"
                    dataKey="upperBound"
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    name="Upper Bound"
                  />
                  <Line
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    name="Lower Bound"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecast Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average Sales</p>
                  <p className="text-lg font-semibold">
                    {forecast.metrics.avgSales.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volatility</p>
                  <p className="text-lg font-semibold">
                    {(forecast.metrics.volatility * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Min Sales</p>
                  <p className="text-lg font-semibold">
                    {forecast.metrics.minSales.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Sales</p>
                  <p className="text-lg font-semibold">
                    {forecast.metrics.maxSales.toFixed(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Simulation</CardTitle>
              <CardDescription>
                Adjust factors and see impact on demand projections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Discount Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Discount: {simulationParams.discount}%</label>
                  <span className="text-xs text-muted-foreground">-50% to +50%</span>
                </div>
                <Slider
                  value={[simulationParams.discount]}
                  onValueChange={(val) =>
                    setSimulationParams({ ...simulationParams, discount: val[0] })
                  }
                  min={-50}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Marketing Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Marketing Impact: {simulationParams.marketing}%</label>
                  <span className="text-xs text-muted-foreground">0% to 100%</span>
                </div>
                <Slider
                  value={[simulationParams.marketing]}
                  onValueChange={(val) =>
                    setSimulationParams({ ...simulationParams, marketing: val[0] })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Festival Impact Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Festival Impact: {simulationParams.festival}%</label>
                  <span className="text-xs text-muted-foreground">0% to 150%</span>
                </div>
                <Slider
                  value={[simulationParams.festival]}
                  onValueChange={(val) =>
                    setSimulationParams({ ...simulationParams, festival: val[0] })
                  }
                  min={0}
                  max={150}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Supply Constraint Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Supply Constraint: {simulationParams.supply}%</label>
                  <span className="text-xs text-muted-foreground">0% to 100%</span>
                </div>
                <Slider
                  value={[simulationParams.supply]}
                  onValueChange={(val) =>
                    setSimulationParams({ ...simulationParams, supply: val[0] })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <Button onClick={handleSimulation} className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                Run Simulation
              </Button>
            </CardContent>
          </Card>

          {/* Simulation Scenarios */}
          {forecast.simulation && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {forecast.simulation.scenarios.map((scenario, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{scenario.scenarioName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Base</p>
                      <p className="text-lg font-semibold">
                        {scenario.baseForecast.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Projected</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {scenario.projectedDemand.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Change</p>
                      <p
                        className={`text-sm font-semibold ${
                          scenario.changePercent > 0
                            ? 'text-green-600'
                            : scenario.changePercent < 0
                              ? 'text-red-600'
                              : ''
                        }`}
                      >
                        {scenario.changePercent > 0 ? '+' : ''}
                        {scenario.changePercent.toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-2">
                      {scenario.recommendation}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className="text-xl font-bold">
                    {forecast.inventoryRecommendation.currentStock.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Reorder Point</p>
                  <p className="text-xl font-bold">
                    {forecast.inventoryRecommendation.reorderPoint.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Recommended Level</p>
                  <p className="text-xl font-bold">
                    {forecast.inventoryRecommendation.recommendedStockLevel.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Reorder Quantity</p>
                  <p className="text-xl font-bold">
                    {forecast.inventoryRecommendation.reorderQuantity.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Days of Inventory</p>
                  <p className="text-xl font-bold">
                    {forecast.inventoryRecommendation.daysOfInventory.toFixed(1)}
                  </p>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor:
                      forecast.inventoryRecommendation.stockHealth === 'critical'
                        ? '#fee2e2'
                        : '#fef3c7',
                  }}
                >
                  <p className="text-xs text-muted-foreground">Stock Health</p>
                  <p className="text-xl font-bold capitalize">
                    {forecast.inventoryRecommendation.stockHealth}
                  </p>
                </div>
              </div>

              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action: </strong>
                  {forecast.inventoryRecommendation.action}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {forecast.aiInsights && (
                <>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Forecast Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      {forecast.aiInsights.forecastAnalysis}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Risk Assessment</h4>
                    <p className="text-sm text-muted-foreground">
                      {forecast.aiInsights.riskAssessment}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Inventory Strategy</h4>
                    <p className="text-sm text-muted-foreground">
                      {forecast.aiInsights.inventoryStrategy}
                    </p>
                  </div>

                  {forecast.aiInsights.actionItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Recommended Actions</h4>
                      <ul className="space-y-2">
                        {forecast.aiInsights.actionItems.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <span
                              className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                item.priority === 'high'
                                  ? 'bg-red-500'
                                  : item.priority === 'medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                            />
                            <span>
                              <strong>{item.action}</strong> ({item.priority}, {item.timeline})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>Ask questions about this forecast</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Messages */}
                <div className="bg-slate-50 rounded-lg p-4 h-64 overflow-y-auto space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground mt-10">
                      No messages yet. Start by asking a question!
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-slate-900 border'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoadingAI && (
                    <div className="flex justify-start">
                      <div className="bg-white text-slate-900 border px-3 py-2 rounded-lg">
                        <div className="flex gap-1">
                          <span className="animate-bounce">●</span>
                          <span className="animate-bounce delay-100">●</span>
                          <span className="animate-bounce delay-200">●</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about this forecast..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    disabled={isLoadingAI}
                  />
                  <Button onClick={handleChat} disabled={isLoadingAI} size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Questions */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground">Quick Questions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Should we reorder now?',
                      'What are the risks?',
                      'How accurate is this?',
                      'Inventory recommendation?',
                    ].map((question) => (
                      <Button
                        key={question}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setChatInput(question)
                          // Auto-send after setting
                          setTimeout(() => handleChat(), 100)
                        }}
                        className="text-xs h-8"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* External Factors Summary */}
      {forecast.externalFactors && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">External Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {forecast.externalFactors.upcomingPromotion && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs">Upcoming Promotion</span>
                </div>
              )}
              {forecast.externalFactors.newProductLaunch && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-xs">New Product Launch</span>
                </div>
              )}
              {forecast.externalFactors.supplyChainDisruption && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-xs">Supply Chain Disruption</span>
                </div>
              )}
              {forecast.externalFactors.festivals &&
                forecast.externalFactors.festivals.map((festival) => (
                  <div key={festival} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-xs">{festival}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedForecastOutput
