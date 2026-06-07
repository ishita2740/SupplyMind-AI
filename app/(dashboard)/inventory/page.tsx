'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Package, AlertTriangle, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InventoryPage() {
  // Mock inventory data
  const items = [
    { id: '1', sku: 'ELEC-001', name: 'Circuit Board A', category: 'Electronics', stock: 450, reorder: 100, cost: 45 },
    { id: '2', sku: 'TEXT-002', name: 'Cotton Fabric', category: 'Textiles', stock: 25, reorder: 200, cost: 12 },
    { id: '3', sku: 'CHEM-003', name: 'Polymer Resin', category: 'Chemicals', stock: 180, reorder: 50, cost: 28 },
    { id: '4', sku: 'ELEC-004', name: 'Power Supply', category: 'Electronics', stock: 60, reorder: 80, cost: 35 },
    { id: '5', sku: 'TEXT-005', name: 'Polyester Thread', category: 'Textiles', stock: 8, reorder: 100, cost: 5 },
  ]

  const stats = {
    totalItems: 1250,
    lowStock: 18,
    outOfStock: 3,
    totalValue: 285000,
  }

  const suggestions = [
    { sku: 'TEXT-005', name: 'Polyester Thread', priority: 'high', current: 8, recommended: 100 },
    { sku: 'ELEC-001', name: 'Circuit Board A', priority: 'medium', current: 450, recommended: 600 },
    { sku: 'CHEM-003', name: 'Polymer Resin', priority: 'low', current: 180, recommended: 250 },
  ]

  const categoryData = [
    { name: 'Electronics', value: 45, color: '#0066cc' },
    { name: 'Textiles', value: 30, color: '#00aa88' },
    { name: 'Chemicals', value: 25, color: '#f59e0b' },
  ]

  const categoryValue = [
    { name: 'Electronics', value: 142500 },
    { name: 'Textiles', value: 85500 },
    { name: 'Chemicals', value: 57000 },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Inventory Intelligence</h1>
          </div>
          <p className="text-muted-foreground">Stock health, reorder suggestions, and analytics</p>
        </div>

        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Items', value: stats.totalItems },
              { label: 'Low Stock', value: stats.lowStock, color: 'orange' },
              { label: 'Out of Stock', value: stats.outOfStock, color: 'red' },
              { label: 'Total Value', value: `$${(stats.totalValue / 1000).toFixed(0)}k` },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className={`text-3xl font-bold mt-2 ${
                  kpi.color === 'orange' ? 'text-orange-600' :
                  kpi.color === 'red' ? 'text-red-600' :
                  'text-primary'
                }`}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Stock by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
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

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Inventory Value by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryValue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                    }}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill="#0066cc" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reorder Suggestions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-orange-600" size={20} />
              <h3 className="text-lg font-semibold text-foreground">Reorder Suggestions</h3>
            </div>
            <div className="space-y-3">
              {suggestions.map((item) => (
                <div key={item.sku} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Current: {item.current} | Recommended: {item.recommended}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.priority === 'high' ? 'bg-red-50 text-red-700' :
                      item.priority === 'medium' ? 'bg-orange-50 text-orange-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                    </span>
                    <Button size="sm" variant="outline">Reorder</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">All Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-foreground">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Product Name</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Category</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Current Stock</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Reorder Point</th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary transition-colors">
                      <td className="py-3 px-4 font-mono text-sm text-foreground">{item.sku}</td>
                      <td className="py-3 px-4 text-foreground">{item.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                      <td className={`py-3 px-4 text-right font-medium ${item.stock < item.reorder ? 'text-orange-600' : 'text-foreground'}`}>
                        {item.stock}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{item.reorder}</td>
                      <td className="py-3 px-4 text-right text-foreground">${item.cost}</td>
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
