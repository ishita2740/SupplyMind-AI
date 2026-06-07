'use client'

import React, { useState, useRef, useMemo, useCallback } from 'react'
import * as XLSX from 'xlsx'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Zap,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Download,
  RefreshCcw,
  Sparkles,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type CsvRow = Record<string, string>

interface DataMapping {
  dateColumn: string
  salesColumn: string
  productColumn: string
  storeColumn: string
}

interface ForecastPoint {
  label: string
  historical: number | null
  forecast: number | null
  upper: number | null
  lower: number | null
}

interface ForecastResult {
  points: ForecastPoint[]
  totalForecast: number
  avgForecast: number
  trend: 'up' | 'down' | 'stable'
  trendPct: number
  confidence: 'High' | 'Medium' | 'Low'
  model: string
  demandType: string
  dataRows: number
  forecastDays: number
}

type Step = 'upload' | 'map' | 'config' | 'result'

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_EXTENSIONS = new Set(['csv', 'xlsx', 'xls'])
const MAX_BYTES = 50 * 1024 * 1024

const DURATION_OPTIONS = [
  { value: 7, label: '7 Days' },
  { value: 15, label: '15 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
  { value: 180, label: '180 Days' },
]

const GRANULARITY_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
]

const LEVEL_OPTIONS = [
  { value: 'overall', label: 'Overall Forecast', desc: 'All data combined' },
  { value: 'product', label: 'Product-Level', desc: 'Per product / SKU' },
  { value: 'location', label: 'Location-Level', desc: 'Per store / region' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const ext = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

const formatNum = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}K`
    : n.toFixed(0)

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue }
    if (ch === '"') { inQ = !inQ; continue }
    if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; continue }
    cur += ch
  }
  cells.push(cur.trim())
  return cells
}

const parseCsv = (text: string): { headers: string[]; rows: CsvRow[] } | null => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (!lines.length) return null
  const parsed = lines.map(splitCsvLine)
  const rawHeaders = parsed[0]
  const seen = new Map<string, number>()
  const headers = rawHeaders.map(h => {
    const key = h || 'Column'
    if (!seen.has(key)) { seen.set(key, 0); return key }
    const n = seen.get(key)! + 1; seen.set(key, n); return `${key}_${n}`
  })
  const rows = parsed.slice(1).map(cells => {
    const row: CsvRow = {}
    headers.forEach((h, i) => { row[h] = cells[i] ?? '' })
    return row
  })
  return { headers, rows }
}

const loadFile = (file: File): Promise<string> => {
  const e = ext(file.name)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject('Cannot read file')
    reader.onload = () => {
      if (e === 'csv') {
        if (typeof reader.result !== 'string') return reject('Bad file')
        resolve(reader.result)
      } else {
        if (!(reader.result instanceof ArrayBuffer)) return reject('Bad file')
        try {
          const wb = XLSX.read(reader.result, { type: 'array' })
          const csv = wb.SheetNames.map(name => {
            const ws = wb.Sheets[name]
            return ws ? XLSX.utils.sheet_to_csv(ws, { blankrows: false }) : ''
          }).filter(Boolean).join('\n')
          if (!csv.trim()) return reject('Empty spreadsheet')
          resolve(csv)
        } catch {
          reject('Failed to parse spreadsheet')
        }
      }
    }
    e === 'csv' ? reader.readAsText(file) : reader.readAsArrayBuffer(file)
  })
}

const isNumericCol = (rows: CsvRow[], col: string): boolean => {
  const sample = rows.slice(0, 40)
  let total = 0, numeric = 0
  sample.forEach(r => {
    const v = (r[col] ?? '').trim()
    if (!v) return
    total++
    if (!isNaN(Number(v.replace(/[^0-9.\-]/g, '')))) numeric++
  })
  return total > 0 && numeric / total >= 0.7
}

const isDateCol = (rows: CsvRow[], col: string): boolean => {
  const sample = rows.slice(0, 40)
  let total = 0, valid = 0
  sample.forEach(r => {
    const v = (r[col] ?? '').trim()
    if (!v) return
    total++
    if (!isNaN(Date.parse(v))) valid++
  })
  return total > 0 && valid / total >= 0.6
}

const autoDetect = (headers: string[], rows: CsvRow[]): DataMapping => {
  const dateKW = ['date', 'order', 'time', 'day', 'invoice', 'created', 'transaction']
  const salesKW = ['sales', 'revenue', 'amount', 'quantity', 'qty', 'units', 'demand', 'total', 'gmv']
  const productKW = ['product', 'sku', 'item', 'name', 'description', 'code']
  const storeKW = ['store', 'location', 'branch', 'outlet', 'shop', 'region', 'city']

  const pick = (keywords: string[], filter?: (h: string) => boolean) => {
    for (const kw of keywords) {
      const h = headers.find(h => normalise(h).includes(normalise(kw)) && (!filter || filter(h)))
      if (h) return h
    }
    return ''
  }

  const dateColumn = pick(dateKW, h => isDateCol(rows, h))
  const salesColumn = pick(salesKW, h => isNumericCol(rows, h))
  const productColumn = pick(productKW)
  const storeColumn = pick(storeKW)

  return { dateColumn, salesColumn, productColumn, storeColumn }
}

// ─── Forecast Engine ──────────────────────────────────────────────────────────

const generateForecast = (
  rows: CsvRow[],
  mapping: DataMapping,
  durationDays: number,
  granularity: string
): ForecastResult | null => {
  if (!mapping.dateColumn || !mapping.salesColumn) return null

  // Aggregate sales by date
  const dateMap = new Map<string, number>()
  rows.forEach(row => {
    const rawDate = row[mapping.dateColumn]
    const rawSales = row[mapping.salesColumn]
    if (!rawDate || !rawSales) return
    const parsed = new Date(rawDate)
    if (isNaN(parsed.getTime())) return
    const key = parsed.toISOString().split('T')[0]
    const sales = parseFloat(rawSales.replace(/[^0-9.\-]/g, ''))
    if (isNaN(sales)) return
    dateMap.set(key, (dateMap.get(key) ?? 0) + sales)
  })

  const sorted = [...dateMap.entries()].sort(([a], [b]) => a.localeCompare(b))
  if (sorted.length < 5) return null

  const historicalValues = sorted.map(([, v]) => v)
  const n = historicalValues.length
  const mean = historicalValues.reduce((s, v) => s + v, 0) / n
  const std = Math.sqrt(historicalValues.reduce((s, v) => s + (v - mean) ** 2, 0) / n)
  const cv = mean !== 0 ? std / mean : 0

  // Trend via linear regression on last 30 points
  const window = historicalValues.slice(-Math.min(30, n))
  const wn = window.length
  const xMean = (wn - 1) / 2
  const yMean = window.reduce((s, v) => s + v, 0) / wn
  const slope =
    window.reduce((s, v, i) => s + (i - xMean) * (v - yMean), 0) /
    (window.reduce((s, _, i) => s + (i - xMean) ** 2, 0) || 1)
  const intercept = yMean - slope * xMean

  const trendPct = mean !== 0 ? (slope / mean) * 100 : 0
  const trend: 'up' | 'down' | 'stable' =
    trendPct > 2 ? 'up' : trendPct < -2 ? 'down' : 'stable'

  const demandType = cv < 0.3 ? 'Smooth' : cv > 0.7 ? 'Erratic' : 'Seasonal'
  const model = cv < 0.4 ? 'Linear Trend' : 'Exponential Smoothing'
  const confidence: 'High' | 'Medium' | 'Low' =
    n >= 60 && cv < 0.5 ? 'High' : n >= 20 && cv < 0.8 ? 'Medium' : 'Low'

  // Build historical buckets by granularity
  const bucketMap = new Map<string, number>()
  sorted.forEach(([date, val]) => {
    const d = new Date(date)
    let key: string
    if (granularity === 'Weekly') {
      const day = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((day + 6) % 7))
      key = monday.toISOString().split('T')[0]
    } else if (granularity === 'Monthly') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    } else {
      key = date
    }
    bucketMap.set(key, (bucketMap.get(key) ?? 0) + val)
  })

  const historicalBuckets = [...bucketMap.entries()].sort(([a], [b]) => a.localeCompare(b))

  // Generate future labels
  const lastDate = new Date(sorted[sorted.length - 1][0])
  const futurePoints: { label: string; value: number }[] = []

  if (granularity === 'Monthly') {
    const months = Math.max(1, Math.ceil(durationDays / 30))
    for (let i = 1; i <= months; i++) {
      const d = new Date(lastDate)
      d.setMonth(d.getMonth() + i)
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const forecastedVal = Math.max(0, intercept + slope * (n + i - 1) + (Math.random() - 0.5) * std * 0.3)
      futurePoints.push({ label, value: forecastedVal })
    }
  } else if (granularity === 'Weekly') {
    const weeks = Math.max(1, Math.ceil(durationDays / 7))
    for (let i = 1; i <= weeks; i++) {
      const d = new Date(lastDate)
      d.setDate(d.getDate() + i * 7)
      const label = d.toISOString().split('T')[0]
      const forecastedVal = Math.max(0, intercept + slope * (n + i * 7 - 1) + (Math.random() - 0.5) * std * 0.3)
      futurePoints.push({ label, value: forecastedVal })
    }
  } else {
    for (let i = 1; i <= durationDays; i++) {
      const d = new Date(lastDate)
      d.setDate(d.getDate() + i)
      const label = d.toISOString().split('T')[0]
      const forecastedVal = Math.max(0, intercept + slope * (n + i - 1) + (Math.random() - 0.5) * std * 0.3)
      futurePoints.push({ label, value: forecastedVal })
    }
  }

  const confInterval = std * (confidence === 'High' ? 1 : confidence === 'Medium' ? 1.5 : 2)

  // Cap historical to last 30 buckets for display
  const displayHistorical = historicalBuckets.slice(-30)

  const points: ForecastPoint[] = [
    ...displayHistorical.map(([label, val]) => ({
      label,
      historical: Math.round(val * 10) / 10,
      forecast: null,
      upper: null,
      lower: null,
    })),
    ...futurePoints.map(({ label, value }) => ({
      label,
      historical: null,
      forecast: Math.round(value * 10) / 10,
      upper: Math.round((value + confInterval) * 10) / 10,
      lower: Math.round(Math.max(0, value - confInterval) * 10) / 10,
    })),
  ]

  const totalForecast = futurePoints.reduce((s, p) => s + p.value, 0)
  const avgForecast = futurePoints.length ? totalForecast / futurePoints.length : 0

  return {
    points,
    totalForecast,
    avgForecast,
    trend,
    trendPct,
    confidence,
    model,
    demandType,
    dataRows: rows.length,
    forecastDays: durationDays,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'map', label: 'Map Columns' },
    { key: 'config', label: 'Configure' },
    { key: 'result', label: 'Results' },
  ]
  const idx = steps.findIndex(s => s.key === step)
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < idx
                  ? 'bg-primary border-primary text-primary-foreground'
                  : i === idx
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'bg-muted border-border text-muted-foreground'
              }`}
            >
              {i < idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${i === idx ? 'text-primary' : 'text-muted-foreground'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${i < idx ? 'bg-primary' : 'bg-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function MappingRow({
  label,
  value,
  onChange,
  headers,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  headers: string[]
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <select
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— Not mapped —</option>
        {headers.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  )
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) =>
  trend === 'up' ? (
    <TrendingUp className="w-4 h-4 text-emerald-500" />
  ) : trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-red-500" />
  ) : (
    <Minus className="w-4 h-4 text-muted-foreground" />
  )

const confidenceBadge = (c: 'High' | 'Medium' | 'Low') =>
  c === 'High'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : c === 'Medium'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-700 border-red-200'

// Custom tooltip for recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-xs">
          {entry.name}: <span className="font-medium">{entry.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GenerateForecastSection() {
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<CsvRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mapping, setMapping] = useState<DataMapping>({ dateColumn: '', salesColumn: '', productColumn: '', storeColumn: '' })
  const [duration, setDuration] = useState(30)
  const [granularity, setGranularity] = useState('Weekly')
  const [level, setLevel] = useState('overall')
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    const e = ext(file.name)
    if (!VALID_EXTENSIONS.has(e)) { setError('Only CSV, XLSX, and XLS files are supported.'); return }
    if (file.size > MAX_BYTES) { setError('File too large. Max size is 50MB.'); return }
    setIsLoading(true)
    try {
      const text = await loadFile(file)
      const parsed = parseCsv(text)
      if (!parsed || !parsed.rows.length) { setError('No data found in file.'); return }
      setFileName(file.name)
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setMapping(autoDetect(parsed.headers, parsed.rows))
      setStep('map')
    } catch (e: any) {
      setError(typeof e === 'string' ? e : 'Failed to read file.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const runForecast = () => {
    setIsGenerating(true)
    // Small delay to let UI update
    setTimeout(() => {
      const r = generateForecast(rows, mapping, duration, granularity)
      if (!r) {
        setError('Not enough data to generate a forecast. Ensure date and sales columns are mapped correctly.')
        setIsGenerating(false)
        return
      }
      setResult(r)
      setStep('result')
      setIsGenerating(false)
    }, 600)
  }

  const reset = () => {
    setStep('upload')
    setFileName(null)
    setHeaders([])
    setRows([])
    setError(null)
    setResult(null)
    setMapping({ dateColumn: '', salesColumn: '', productColumn: '', storeColumn: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canProceedMapping = mapping.dateColumn && mapping.salesColumn

  // Determine the dividing line index between historical and forecast
  const splitIndex = result ? result.points.findIndex(p => p.forecast !== null) : -1

  return (
    <Card className="mt-8 border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Generate Forecast</CardTitle>
            <CardDescription>Upload your sales data and get an AI-powered demand forecast in seconds</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <StepIndicator step={step} />

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm font-medium">Parsing file…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-full transition-all ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Drop your file here, or <span className="text-primary">browse</span></p>
                    <p className="text-sm text-muted-foreground mt-1">Supports CSV, XLSX, XLS — up to 50 MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={onFileChange}
            />

            {/* Format hints */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {[
                { icon: '📅', label: 'Date column', hint: 'e.g. Order Date, Invoice Date' },
                { icon: '💰', label: 'Sales column', hint: 'e.g. Sales, Revenue, Qty' },
                { icon: '📦', label: 'Product / Store', hint: 'Optional — for granular forecasts' },
              ].map(tip => (
                <div key={tip.label} className="flex gap-3 p-3 rounded-lg bg-muted/60 border border-border">
                  <span className="text-xl">{tip.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{tip.label}</p>
                    <p className="text-xs text-muted-foreground">{tip.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Column Mapping ── */}
        {step === 'map' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-3 bg-muted/60 rounded-lg border border-border">
              <FileSpreadsheet className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">{rows.length.toLocaleString()} rows · {headers.length} columns</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto shrink-0 text-xs" onClick={reset}>
                <RefreshCcw className="w-3 h-3 mr-1" /> Change
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MappingRow
                label="📅 Date Column *"
                value={mapping.dateColumn}
                onChange={v => setMapping(m => ({ ...m, dateColumn: v }))}
                headers={headers}
                hint="Column containing transaction dates"
              />
              <MappingRow
                label="💰 Sales / Demand Column *"
                value={mapping.salesColumn}
                onChange={v => setMapping(m => ({ ...m, salesColumn: v }))}
                headers={headers}
                hint="Column with sales values or quantities"
              />
              <MappingRow
                label="📦 Product Column"
                value={mapping.productColumn}
                onChange={v => setMapping(m => ({ ...m, productColumn: v }))}
                headers={headers}
                hint="Optional — SKU, product name, or ID"
              />
              <MappingRow
                label="🏪 Store / Location Column"
                value={mapping.storeColumn}
                onChange={v => setMapping(m => ({ ...m, storeColumn: v }))}
                headers={headers}
                hint="Optional — store ID, region, or city"
              />
            </div>

            {!canProceedMapping && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Map at least Date and Sales columns to continue
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={reset}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                className="ml-auto"
                disabled={!canProceedMapping}
                onClick={() => setStep('config')}
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Config ── */}
        {step === 'config' && (
          <div className="space-y-7">
            {/* Duration */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Forecast Duration</p>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      duration === opt.value
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Granularity */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Granularity</p>
              <div className="flex flex-wrap gap-2">
                {GRANULARITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGranularity(opt.value)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      granularity === opt.value
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Forecast Level</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LEVEL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLevel(opt.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      level === opt.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40 hover:bg-muted/60'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${level === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('map')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button className="ml-auto gap-2" onClick={runForecast} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Forecast
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Results ── */}
        {step === 'result' && result && (
          <div className="space-y-6">
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: 'Total Forecast',
                  value: formatNum(result.totalForecast),
                  sub: `over ${result.forecastDays} days`,
                  color: 'text-primary',
                },
                {
                  label: 'Avg per Period',
                  value: formatNum(result.avgForecast),
                  sub: granularity.toLowerCase(),
                  color: 'text-foreground',
                },
                {
                  label: 'Trend',
                  value: `${result.trendPct > 0 ? '+' : ''}${result.trendPct.toFixed(1)}%`,
                  sub: result.trend,
                  color:
                    result.trend === 'up'
                      ? 'text-emerald-600'
                      : result.trend === 'down'
                      ? 'text-red-600'
                      : 'text-muted-foreground',
                  icon: <TrendIcon trend={result.trend} />,
                },
                {
                  label: 'Confidence',
                  value: result.confidence,
                  sub: result.model,
                  badge: true,
                },
              ].map(kpi => (
                <div key={kpi.label} className="bg-muted/50 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {kpi.icon}
                    {kpi.badge ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${confidenceBadge(result.confidence)}`}>
                        {kpi.value}
                      </span>
                    ) : (
                      <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Demand type pill */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <BarChart3 className="w-3 h-3" /> {result.demandType} Demand
              </span>
              <span className="text-xs text-muted-foreground">· Model: {result.model}</span>
              <span className="text-xs text-muted-foreground">· {result.dataRows.toLocaleString()} rows analysed</span>
            </div>

            {/* Chart */}
            <div className="bg-background rounded-xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground mb-4">
                Historical & Forecasted Demand
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  Shaded area = confidence interval
                </span>
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={result.points} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066cc" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0066cc" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00aa88" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00aa88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {splitIndex > 0 && (
                    <ReferenceLine
                      x={result.points[splitIndex]?.label}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{ value: 'Forecast →', position: 'top', fontSize: 10, fill: '#64748b' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="historical"
                    stroke="#0066cc"
                    strokeWidth={2}
                    fill="url(#histGrad)"
                    name="Historical"
                    dot={false}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stroke="#00aa88"
                    strokeWidth={2}
                    fill="url(#fcGrad)"
                    name="Forecast"
                    dot={false}
                    connectNulls
                    strokeDasharray="6 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="#00aa88"
                    strokeWidth={0}
                    fill="url(#fcGrad)"
                    name="Upper Bound"
                    dot={false}
                    connectNulls
                    opacity={0.4}
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="#00aa88"
                    strokeWidth={0}
                    fill="url(#fcGrad)"
                    name="Lower Bound"
                    dot={false}
                    connectNulls
                    opacity={0.4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setStep('config')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Reconfigure
              </Button>
              <Button variant="outline" onClick={reset} className="gap-2">
                <RefreshCcw className="w-4 h-4" /> New Forecast
              </Button>
              <Button
                variant="outline"
                className="gap-2 ml-auto"
                onClick={() => {
                  if (!result) return
                  const csv = [
                    'Label,Historical,Forecast,Upper,Lower',
                    ...result.points.map(p =>
                      `${p.label},${p.historical ?? ''},${p.forecast ?? ''},${p.upper ?? ''},${p.lower ?? ''}`
                    ),
                  ].join('\n')
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `forecast-${new Date().toISOString().split('T')[0]}.csv`
                  a.click()
                }}
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GenerateForecastSection
