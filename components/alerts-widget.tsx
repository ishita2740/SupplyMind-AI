'use client'

import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

interface Alert {
  id: string
  type: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
}

interface AlertsWidgetProps {
  alerts: Alert[]
}

const severityColors = {
  low: 'bg-blue-50 border-blue-200 text-blue-700',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  critical: 'bg-red-50 border-red-200 text-red-700',
}

const severityIcons = {
  low: AlertCircle,
  medium: AlertTriangle,
  high: AlertTriangle,
  critical: AlertCircle,
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Active Alerts</h3>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
          <p className="text-muted-foreground">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => {
            const Icon = severityIcons[alert.severity]
            return (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 ${severityColors[alert.severity]}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={20} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs opacity-75 mt-1">{alert.description}</p>
                    <p className="text-xs opacity-50 mt-2">{getTimeAgo(alert.timestamp)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
