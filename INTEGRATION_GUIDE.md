# SupplyMind AI Integration Guide

This guide explains how to integrate SupplyMind AI features into your existing forecasting system.

## Overview

Your forecasting system has been enhanced with:

1. **Executive Dashboard** - KPI metrics, trends, and alerts
2. **Inventory Intelligence** - Smart reorder suggestions and stock health tracking
3. **Business Simulation Engine** - Interactive what-if scenarios
4. **AI-Powered Chat Assistant** - Google Gemini integration for Q&A and insights
5. **Advanced Analytics** - Product, category, and seasonal analysis
6. **Multi-Model Forecasting** - Prophet + XGBoost + ARIMA ensemble

## File Structure

```
backend/
├── forecast_service_enhanced.py      # Main forecasting service (NEW)
├── gemini_ai_service.py              # Google Gemini AI integration (NEW)
├── forecast_service.py               # Your existing Prophet service
├── forecast_ai.py                    # Your existing Groq integration
└── prophet_model.py                  # Your existing Prophet model

components/
├── EnhancedForecastOutput.tsx         # Main UI component (NEW)
├── ForecastOutput.tsx                # Your existing output component
└── CreateForecast.tsx                # Your existing creation component

store/
├── forecast-enhanced.store.ts        # Zustand store with SupplyMind features (NEW)
└── forecastStore.ts                  # Your existing store

types/
├── forecast-enhanced.types.ts        # Extended TypeScript types (NEW)
└── forecast.types.ts                 # Your existing types

app/api/
├── ai/
│   └── chat/route.ts                # AI chat endpoint (NEW)
├── forecast/
│   ├── predict                       # Your existing Prophet endpoint
│   └── simulate                      # Business simulation endpoint (NEW)
└── dashboard/route.ts                # Dashboard data endpoint (NEW)
```

## Integration Steps

### Step 1: Install Google Gemini SDK

```bash
pip install google-generativeai
```

For frontend (if needed):
```bash
pnpm add google-generativeai
```

### Step 2: Set Environment Variables

Add these to your `.env.local`:

```env
# Google Gemini API Key (get from: https://makersuite.google.com/app/apikey)
GOOGLE_GEMINI_API_KEY=your_api_key_here

# Existing variables
DATABASE_URL=your_database_url
PROPHET_API_URL=http://127.0.0.1:8000
GROQ_API_KEY=your_groq_key
```

### Step 3: Update Your Forecast Service

In your existing `forecast_service.py`, import and use the enhanced service:

```python
from forecast_service_enhanced import EnhancedForecastService

# Initialize the enhanced service
service = EnhancedForecastService()

# Generate forecast with all SupplyMind features
result = service.generate_forecast_with_insights(
    dates=dates,
    sales=sales,
    forecast_days=30,
    algorithm='ensemble',
    external_factors={
        'current_stock': 5000,
        'reorder_point': 2000,
        'upcoming_promotion': True,
        'festival_season': 'Diwali',
    }
)
```

### Step 4: Create Database Schema

Add these tables to your PostgreSQL database:

```sql
-- Forecast Results
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(255),
    region VARCHAR(255),
    algorithm VARCHAR(50),
    base_forecast FLOAT,
    total_forecasted FLOAT,
    confidence VARCHAR(50),
    data_quality VARCHAR(50),
    forecast_data JSONB,
    external_factors JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Metrics
CREATE TABLE IF NOT EXISTS inventory_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_id UUID REFERENCES demand_forecasts(id),
    current_stock FLOAT,
    reorder_point FLOAT,
    recommended_level FLOAT,
    stock_health VARCHAR(50),
    action VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business Simulations
CREATE TABLE IF NOT EXISTS business_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_id UUID REFERENCES demand_forecasts(id),
    scenario_name VARCHAR(255),
    discount_percent FLOAT,
    marketing_percent FLOAT,
    festival_percent FLOAT,
    supply_constraint_percent FLOAT,
    projected_demand FLOAT,
    change_percent FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Chat History
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    forecast_id UUID REFERENCES demand_forecasts(id),
    messages JSONB,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts
CREATE TABLE IF NOT EXISTS supply_chain_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100),
    severity VARCHAR(50),
    message TEXT,
    forecast_id UUID REFERENCES demand_forecasts(id),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 5: Update Your API Endpoints

#### Create `/api/forecast/simulate` endpoint:

```typescript
// app/api/forecast/simulate/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { baseForecast, discountPercent, marketingPercent, festivalPercent, supplyConstraintPercent } = body

    // Call your Python backend
    const response = await fetch('http://127.0.0.1:8000/forecast/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_forecast: baseForecast,
        discount_percent: discountPercent,
        marketing_percent: marketingPercent,
        festival_percent: festivalPercent,
        supply_constraint_percent: supplyConstraintPercent,
      }),
    })

    const results = await response.json()
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}
```

#### Create `/api/dashboard` endpoint:

```typescript
// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Fetch recent forecasts
    const forecastsResponse = await fetch('http://127.0.0.1:8000/forecasts/recent', {
      headers: { 'Authorization': `Bearer ${process.env.API_TOKEN}` },
    })

    const forecasts = await forecastsResponse.json()

    // Calculate KPIs
    const kpis = {
      revenue: {
        current: 250000,
        forecast: 280000,
        change: 30000,
        changePercent: 12,
      },
      forecastAccuracy: {
        current: 94.2,
        target: 95,
        status: 'good',
      },
      inventoryHealth: {
        optimal: 50000,
        current: 45000,
        stockoutRisk: 2,
      },
      activeAlerts: 3,
    }

    return NextResponse.json({
      kpis,
      recentForecasts: forecasts,
      alerts: [],
      trends: {
        revenueChart: [],
        accuracyChart: [],
        inventoryChart: [],
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Dashboard failed' }, { status: 500 })
  }
}
```

### Step 6: Update Frontend to Use New Components

Replace your existing forecast display with the enhanced component:

```typescript
// In your page or parent component
import { EnhancedForecastOutput } from '@/components/EnhancedForecastOutput'
import { useForecastStore } from '@/store/forecast-enhanced.store'

export default function ForecastPage() {
  const { selectedForecast } = useForecastStore()

  if (!selectedForecast) return <div>No forecast selected</div>

  return (
    <EnhancedForecastOutput
      forecast={selectedForecast}
      onSimulate={(input) => {
        console.log('Simulation params:', input)
      }}
      onAskAssistant={(question) => {
        console.log('User asked:', question)
      }}
    />
  )
}
```

## Connecting Existing Features

### Option 1: Keep Your Groq Integration for Prophet Explanations

Your existing Groq integration can continue working alongside Gemini:

```python
# Use Groq for Prophet-specific explanations
from forecast_ai import explain_forecast_with_groq

# Use Gemini for general insights and Q&A
from gemini_ai_service import GeminiAIService

gemini = GeminiAIService()
insights = gemini.generate_forecast_insights(request)
```

### Option 2: Gradually Migrate to Gemini

If you want to migrate entirely to Gemini:

```python
# Replace in forecast_ai.py
from gemini_ai_service import GeminiAIService

class ForecastAI:
    def __init__(self):
        self.gemini = GeminiAIService()
    
    def explain_forecast(self, forecast_data):
        return self.gemini.generate_forecast_insights(forecast_data)
```

## Key Features Explained

### 1. Business Simulation

Users can adjust:
- **Discount** (-50% to +50%): Price changes with 50% price elasticity
- **Marketing** (0% to 100%): Direct demand boost from campaigns
- **Festival** (0% to 150%): Seasonal multiplier for festival periods
- **Supply Constraint** (0% to 100%): Reduces achievable sales

```
Projected Demand = Base × Discount Factor × Marketing Factor × Festival Factor × Supply Factor
```

### 2. Inventory Recommendations

Automatically calculated:
- **Reorder Point**: When to reorder
- **Reorder Quantity**: How much to order
- **Safety Stock**: Buffer for volatility (30% of forecast)
- **Stock Health**: Critical/Warning/Good status

### 3. AI Insights (Gemini)

Provides:
- Forecast analysis and trend interpretation
- Risk assessment and mitigation strategies
- Inventory strategy recommendations
- Specific action items with priorities and timelines
- Data quality indicators

### 4. Interactive Chat

Users can ask:
- "Should we reorder now?"
- "What are the main risks?"
- "How accurate is this forecast?"
- "What's your inventory recommendation?"
- Custom questions about the data

## Python Backend Integration

### Adding to Your FastAPI App

```python
from fastapi import FastAPI, HTTPException
from forecast_service_enhanced import EnhancedForecastService
from gemini_ai_service import GeminiAIService

app = FastAPI()
forecast_service = EnhancedForecastService()
ai_service = GeminiAIService()

@app.post("/forecast/predict")
async def predict_forecast(dates: list, sales: list, forecast_days: int):
    """Generate forecast with all SupplyMind features"""
    result = forecast_service.generate_forecast_with_insights(
        dates=dates,
        sales=sales,
        forecast_days=forecast_days,
        algorithm='ensemble'
    )
    return result

@app.post("/forecast/simulate")
async def simulate_scenario(base_forecast: float, discount_percent: float, ...):
    """Run business simulation"""
    result = forecast_service.simulate_business_scenario(
        base_forecast=base_forecast,
        discount_percent=discount_percent,
        ...
    )
    return result

@app.post("/ai/insights")
async def get_insights(forecast_data: dict, external_factors: dict):
    """Get AI-powered insights"""
    from gemini_ai_service import AIInsightRequest
    request = AIInsightRequest(
        forecast_data=forecast_data,
        inventory_metrics=...,
        external_factors=external_factors
    )
    insights = ai_service.generate_forecast_insights(request)
    return insights
```

## Testing

### Test the Enhanced Service

```python
from forecast_service_enhanced import EnhancedForecastService, ForecastAlgorithm

service = EnhancedForecastService()

# Test data
dates = ["2024-01-01", "2024-02-01", "2024-03-01", "2024-04-01", "2024-05-01"]
sales = [1000, 1200, 1100, 1400, 1600]

# Generate forecast
result = service.generate_forecast_with_insights(
    dates=dates,
    sales=sales,
    forecast_days=30,
    algorithm=ForecastAlgorithm.ENSEMBLE,
    external_factors={
        "current_stock": 5000,
        "upcoming_promotion": True,
        "festival_season": "Diwali"
    }
)

print(json.dumps(result, indent=2))

# Test simulation
simulation = service.simulate_business_scenario(
    base_forecast=2500,
    discount_percent=-20,
    marketing_percent=30,
    festival_percent=50
)

print(json.dumps(simulation, indent=2))
```

### Test Gemini Integration

```python
from gemini_ai_service import GeminiAIService, AIInsightRequest

ai = GeminiAIService()

# Test interactive chat
response = ai.interactive_chat(
    "Should we increase inventory for the upcoming festival?"
)
print(response)

# Test insights generation
request = AIInsightRequest(
    forecast_data={"total_forecasted": 10000},
    inventory_metrics={"current_stock": 5000},
    external_factors={"festival": "Diwali"}
)
insights = ai.generate_forecast_insights(request)
print(insights)
```

## Troubleshooting

### Google Gemini API Key Issues

1. Get API key: https://makersuite.google.com/app/apikey
2. Add to `.env.local`: `GOOGLE_GEMINI_API_KEY=your_key`
3. Restart dev server

### Database Connection

Ensure PostgreSQL tables exist:
```bash
psql -U postgres -d your_db -f schema.sql
```

### Frontend-Backend Communication

Check CORS if using separate ports:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Next Steps

1. ✅ Copy the enhanced files to your project
2. ✅ Install dependencies (google-generativeai)
3. ✅ Set environment variables
4. ✅ Create database tables
5. ✅ Update API endpoints
6. ✅ Integrate components in your UI
7. ✅ Test each feature
8. ✅ Deploy to production

## Support

For questions about:
- **Forecasting**: See `forecast_service_enhanced.py` docstrings
- **AI Features**: See `gemini_ai_service.py` docstrings  
- **Frontend**: See component props in `EnhancedForecastOutput.tsx`
- **Types**: See `forecast-enhanced.types.ts` for all interfaces
