'use client'

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp } from 'lucide-react'

export default function AnalyticsPage() {
  // Mock data for analytics
  const productAnalytics = [
    { name: 'Product A', sales: 4000, revenue: 24000, margin: 35 },
    { name: 'Product B', sales: 3000, revenue: 18000, margin: 30 },
    { name: 'Product C', sales: 2000, revenue: 15000, margin: 28 },
    { name: 'Product D', sales: 2780, revenue: 19000, margin: 32 },
    { name: 'Product E', sales: 1890, revenue: 14000, margin: 25 },
  ]

  const categoryData = [
    { name: 'Electronics', value: 35, color: '#0066cc' },
    { name: 'Textiles', value: 25, color: '#00aa88' },
    { name: 'Chemicals', value: 20, color: '#f59e0b' },
    { name: 'Others', value: 20, color: '#ef4444' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          </div>
          <p className="text-muted-foreground">Product, category, and seasonal analytics with insights</p>
        </div>

        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: '$1.2M' },
              { label: 'Avg Order Value', value: '$2,450' },
              { label: 'Conversion Rate', value: '3.2%' },
              { label: 'Growth YoY', value: '+22%' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Product Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0066cc" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Product Analytics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Product</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Units Sold</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Revenue</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Margin %</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productAnalytics.map((product) => (
                    <tr key={product.name} className="hover:bg-secondary transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{product.name}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{product.sales.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">${product.revenue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{product.margin}%</td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">+12%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
