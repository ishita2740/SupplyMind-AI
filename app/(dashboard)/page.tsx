import { Suspense } from 'react'
import { getDashboardMetrics, getRevenueChart, getAlerts } from '@/app/actions/dashboard'
import { KPICard } from '@/components/kpi-card'
import { RevenueChart } from '@/components/revenue-chart'
import { AlertsWidget } from '@/components/alerts-widget'
import { DollarSign, TrendingUp, Package, AlertCircle } from 'lucide-react'

async function DashboardContent() {
  const [metrics, revenueData, alerts] = await Promise.all([
    getDashboardMetrics(),
    getRevenueChart(),
    getAlerts(),
  ])

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={`$${(metrics.revenue / 1000).toFixed(0)}`}
          unit="k"
          icon={<DollarSign size={24} />}
          color="blue"
          trend={12}
        />
        <KPICard
          title="Forecast Accuracy"
          value={metrics.forecastAccuracy}
          unit="%"
          icon={<TrendingUp size={24} />}
          color="green"
          trend={5}
        />
        <KPICard
          title="Inventory Health"
          value={metrics.inventoryHealth}
          unit="%"
          icon={<Package size={24} />}
          color="green"
          trend={-3}
        />
        <KPICard
          title="Active Alerts"
          value={metrics.activeAlerts}
          icon={<AlertCircle size={24} />}
          color={metrics.activeAlerts > 5 ? 'red' : 'orange'}
        />
      </div>

      {/* Charts and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>
        <AlertsWidget alerts={alerts} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here&apos;s your supply chain overview.</p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-lg p-6 h-40 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  )
}
