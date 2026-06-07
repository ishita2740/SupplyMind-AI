'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Plus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Dynamically import so xlsx (browser-only) doesn't run on the server
const GenerateForecastSection = dynamic(
  () => import('@/components/GenerateForecastSection').then(m => m.GenerateForecastSection),
  { ssr: false }
)

export default function ForecastingPage() {
  // Mock forecast data
  const forecastData = [
    { date: '2024-01', predicted: 4200, confidence: 92, actual: 4100 },
    { date: '2024-02', predicted: 4300, confidence: 89, actual: 4250 },
    { date: '2024-03', predicted: 4450, confidence: 87, actual: 4400 },
    { date: '2024-04', predicted: 4600, confidence: 85, actual: 4550 },
    { date: '2024-05', predicted: 4750, confidence: 83, actual: null },
    { date: '2024-06', predicted: 4900, confidence: 82, actual: null },
  ]

  const [viewMode, setViewMode] = useState<'dashboard' | 'generate'>(
    forecastData.length > 0 ? 'dashboard' : 'generate'
  )

  const accuracyMetrics = {
    xgboostAccuracy: 94,
    prophetAccuracy: 91,
    arimaAccuracy: 88,
    ensembleAccuracy: 92,
  }

  const forecastByItem = [
    { itemName: 'Electronics Bundle', forecast: 450, confidence: 94, lower: 400, upper: 500 },
    { itemName: 'Textiles Pack', forecast: 380, confidence: 91, lower: 320, upper: 440 },
    { itemName: 'Chemical Supplies', forecast: 290, confidence: 88, lower: 240, upper: 340 },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-primary" size={28} />
              <h1 className="text-3xl font-bold text-foreground">Demand Forecasting</h1>
            </div>
            <p className="text-muted-foreground">XGBoost, Prophet, and ARIMA forecasts with confidence scores</p>
          </div>
          {viewMode === 'dashboard' ? (
            <Button onClick={() => setViewMode('generate')} className="gap-2">
              <Plus className="w-4 h-4" />
              Generate Forecast
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setViewMode('dashboard')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          )}
        </div>

        {viewMode === 'dashboard' ? (
          <div className="space-y-6">
            {/* Accuracy Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'XGBoost Accuracy', value: accuracyMetrics.xgboostAccuracy },
              { label: 'Prophet Accuracy', value: accuracyMetrics.prophetAccuracy },
              { label: 'ARIMA Accuracy', value: accuracyMetrics.arimaAccuracy },
              { label: 'Ensemble Accuracy', value: accuracyMetrics.ensembleAccuracy },
            ].map((metric) => (
              <div key={metric.label} className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-3xl font-bold text-primary mt-2">{metric.value}%</p>
              </div>
            ))}
          </div>

          {/* Forecast Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">30-Day Forecast vs Actual</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="predicted" stroke="#0066cc" name="Predicted" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Confidence Scores */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Forecast Confidence Levels</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Bar dataKey="confidence" fill="#00aa88" name="Confidence %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Forecasts Table */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Item Forecasts (Next 30 Days)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Item</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Forecast Units</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Confidence</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Lower Bound</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Upper Bound</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {forecastByItem.map((item) => (
                    <tr key={item.itemName} className="hover:bg-secondary transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{item.itemName}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{item.forecast.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-medium">{item.confidence}%</span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{item.lower.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{item.upper.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ) : (
          /* ── Generate Forecast Section ── */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GenerateForecastSection />
          </div>
        )}
      </div>
    </div>
  )
}
