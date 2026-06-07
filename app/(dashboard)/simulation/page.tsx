'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Zap, TrendingUp } from 'lucide-react'

export default function SimulationPage() {
  const [discountPercent, setDiscountPercent] = useState(0)
  const [festivalImpact, setFestivalImpact] = useState(0)
  const baselineRevenue = 500000
  const baselineMargin = 35

  // Calculate projections based on sliders
  const projectedRevenue = baselineRevenue * (1 - discountPercent / 100) * (1 + festivalImpact / 100)
  const discountEffect = (discountPercent / 100) * baselineRevenue
  const festivalEffect = (festivalImpact / 100) * baselineRevenue
  const projectedMargin = baselineMargin * (1 - discountPercent / 100 * 0.5) + (festivalImpact * 0.1)

  // Generate scenario data
  const scenarios = [
    {
      name: 'Baseline',
      revenue: baselineRevenue,
      margin: baselineMargin,
      volume: 1000,
    },
    {
      name: 'Current',
      revenue: projectedRevenue,
      margin: Math.max(5, projectedMargin),
      volume: Math.round(1000 * (1 - discountPercent / 100) * (1 + festivalImpact / 100)),
    },
  ]

  // Generate discount sensitivity data
  const discountSensitivity = Array.from({ length: 21 }, (_, i) => {
    const discount = i * 5
    const revenue = baselineRevenue * (1 - discount / 100) * (1 + festivalImpact / 100)
    const margin = baselineMargin * (1 - discount / 100 * 0.5)
    return { discount, revenue: Math.round(revenue), margin: Math.max(0, Math.round(margin)) }
  })

  // Generate festival impact sensitivity
  const festivalSensitivity = Array.from({ length: 21 }, (_, i) => {
    const festival = i * 5
    const revenue = baselineRevenue * (1 - discountPercent / 100) * (1 + festival / 100)
    return { festival, revenue: Math.round(revenue) }
  })

  return (
    <div className="p-8">
      <div className="max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Business Simulation</h1>
          </div>
          <p className="text-muted-foreground">Interactive scenario modeling with discount and festival impact</p>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Discount Level</label>
                <span className="text-lg font-bold text-primary">{discountPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Estimated revenue impact: -${(discountEffect / 1000).toFixed(0)}k
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Festival Impact</label>
                <span className="text-lg font-bold text-green-600">+{festivalImpact}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={festivalImpact}
                onChange={(e) => setFestivalImpact(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Estimated revenue gain: +${(festivalEffect / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Baseline Revenue</p>
            <p className="text-2xl font-bold text-foreground mt-2">${(baselineRevenue / 1000).toFixed(0)}k</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Projected Revenue</p>
            <p className={`text-2xl font-bold mt-2 ${projectedRevenue >= baselineRevenue ? 'text-green-600' : 'text-orange-600'}`}>
              ${(projectedRevenue / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Net Change</p>
            <p className={`text-2xl font-bold mt-2 ${projectedRevenue >= baselineRevenue ? 'text-green-600' : 'text-red-600'}`}>
              {projectedRevenue >= baselineRevenue ? '+' : ''}${((projectedRevenue - baselineRevenue) / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Projected Margin</p>
            <p className="text-2xl font-bold text-foreground mt-2">{Math.round(projectedMargin)}%</p>
          </div>
        </div>

        {/* Scenario Comparison */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Scenario Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scenarios}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
                formatter={(value) => [`$${(value as number).toLocaleString()}`, 'Revenue']}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#0066cc" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sensitivity Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Discount Sensitivity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={discountSensitivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="discount" label={{ value: 'Discount %', position: 'insideBottom', offset: -5 }} stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#0066cc" />
                <YAxis yAxisId="right" orientation="right" stroke="#00aa88" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#0066cc" name="Revenue" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#00aa88" name="Margin %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Festival Impact Sensitivity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={festivalSensitivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="festival" label={{ value: 'Festival Impact %', position: 'insideBottom', offset: -5 }} stroke="#6b7280" />
                <YAxis stroke="#10b981" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value) => `$${(value as number).toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
