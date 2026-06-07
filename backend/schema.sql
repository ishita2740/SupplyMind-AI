-- SupplyMind AI Database Schema
-- Add these tables to your existing PostgreSQL database

-- ============================================
-- Main Forecast Results Table
-- ============================================
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    category VARCHAR(255),
    region VARCHAR(255),
    
    -- Forecast Data
    algorithm VARCHAR(50) NOT NULL CHECK (algorithm IN ('prophet', 'xgboost', 'arima', 'ensemble')),
    base_forecast FLOAT,
    total_forecasted FLOAT NOT NULL,
    confidence VARCHAR(50) NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
    data_quality VARCHAR(50) NOT NULL CHECK (data_quality IN ('low', 'medium', 'high')),
    
    -- Forecast Details (JSON)
    forecast_data JSONB NOT NULL,
    metrics JSONB,
    
    -- External Context
    external_factors JSONB,
    
    -- Warnings and Recommendations
    warnings TEXT[],
    recommendations TEXT[],
    
    -- Metadata
    forecast_days INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_forecast_data CHECK (total_forecasted >= 0)
);

CREATE INDEX idx_demand_forecasts_org ON demand_forecasts(org_id);
CREATE INDEX idx_demand_forecasts_category ON demand_forecasts(category);
CREATE INDEX idx_demand_forecasts_created ON demand_forecasts(created_at DESC);

-- ============================================
-- Inventory Metrics Table
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    forecast_id UUID NOT NULL REFERENCES demand_forecasts(id) ON DELETE CASCADE,
    
    -- Stock Levels
    current_stock FLOAT NOT NULL,
    reorder_point FLOAT NOT NULL,
    reorder_quantity FLOAT NOT NULL,
    recommended_stock_level FLOAT NOT NULL,
    
    -- Health Metrics
    stock_health_percentage FLOAT CHECK (stock_health_percentage >= 0 AND stock_health_percentage <= 100),
    days_of_inventory FLOAT,
    stock_health VARCHAR(50) CHECK (stock_health IN ('good', 'warning', 'critical')),
    action VARCHAR(50) CHECK (action IN ('REORDER_NOW', 'MONITOR', 'REDUCE_INVENTORY')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_forecast ON inventory_metrics(forecast_id);
CREATE INDEX idx_inventory_stock_health ON inventory_metrics(stock_health);

-- ============================================
-- Business Simulation Scenarios
-- ============================================
CREATE TABLE IF NOT EXISTS business_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    forecast_id UUID REFERENCES demand_forecasts(id) ON DELETE CASCADE,
    
    -- Scenario Configuration
    scenario_name VARCHAR(255) NOT NULL,
    discount_percent FLOAT DEFAULT 0,
    marketing_percent FLOAT DEFAULT 0,
    festival_percent FLOAT DEFAULT 0,
    supply_constraint_percent FLOAT DEFAULT 0,
    
    -- Results
    base_forecast FLOAT NOT NULL,
    projected_demand FLOAT NOT NULL,
    change_percent FLOAT,
    
    -- Multipliers for calculation
    multipliers JSONB,
    recommendation TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_simulations_forecast ON business_simulations(forecast_id);
CREATE INDEX idx_simulations_scenario ON business_simulations(scenario_name);

-- ============================================
-- AI Chat/Conversation History
-- ============================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    
    -- Context
    forecast_id UUID REFERENCES demand_forecasts(id) ON DELETE SET NULL,
    category VARCHAR(255),
    analysis_mode VARCHAR(50) DEFAULT 'general',
    
    -- Messages (store as JSONB for full flexibility)
    messages JSONB NOT NULL DEFAULT '[]',
    
    -- Context Window
    context JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP
);

CREATE INDEX idx_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_conversations_forecast ON ai_conversations(forecast_id);
CREATE INDEX idx_conversations_updated ON ai_conversations(updated_at DESC);

-- Message schema for reference:
-- {
--   "id": "uuid",
--   "role": "user" | "assistant",
--   "content": "message text",
--   "timestamp": "ISO8601",
--   "context": {
--     "forecastId": "uuid",
--     "category": "string",
--     "metric": "string"
--   }
-- }

-- ============================================
-- Supply Chain Alerts
-- ============================================
CREATE TABLE IF NOT EXISTS supply_chain_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    forecast_id UUID REFERENCES demand_forecasts(id) ON DELETE CASCADE,
    
    -- Alert Configuration
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    
    -- Alert Details
    details JSONB,
    recommended_action TEXT,
    
    -- Acknowledgement
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_alerts_org ON supply_chain_alerts(org_id);
CREATE INDEX idx_alerts_forecast ON supply_chain_alerts(forecast_id);
CREATE INDEX idx_alerts_severity ON supply_chain_alerts(severity);
CREATE INDEX idx_alerts_status ON supply_chain_alerts(status);
CREATE INDEX idx_alerts_created ON supply_chain_alerts(created_at DESC);

-- ============================================
-- KPI Metrics (Aggregated)
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    date DATE NOT NULL,
    
    -- Revenue Metrics
    revenue_current FLOAT,
    revenue_forecast FLOAT,
    revenue_change_percent FLOAT,
    
    -- Forecast Accuracy
    forecast_accuracy FLOAT CHECK (forecast_accuracy >= 0 AND forecast_accuracy <= 100),
    accuracy_target FLOAT DEFAULT 95,
    accuracy_status VARCHAR(50),
    
    -- Inventory Health
    inventory_optimal FLOAT,
    inventory_current FLOAT,
    stockout_risk FLOAT,
    
    -- Active Alerts
    active_alerts_count INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kpi_org_date ON kpi_metrics(org_id, date DESC);
CREATE UNIQUE INDEX idx_kpi_org_date_unique ON kpi_metrics(org_id, date);

-- ============================================
-- Forecast Model Performance Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    
    -- Model Info
    algorithm VARCHAR(50) NOT NULL,
    category VARCHAR(255),
    
    -- Performance Metrics
    mape FLOAT,  -- Mean Absolute Percentage Error
    rmse FLOAT,  -- Root Mean Squared Error
    mae FLOAT,   -- Mean Absolute Error
    accuracy FLOAT,
    
    -- Sample Size
    num_predictions INT,
    num_actuals INT,
    
    -- Period
    period_start DATE,
    period_end DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_model_performance_algo ON model_performance(algorithm);
CREATE INDEX idx_model_performance_period ON model_performance(period_start, period_end);

-- ============================================
-- External Factors Catalog
-- ============================================
CREATE TABLE IF NOT EXISTS external_factors_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    
    -- Factor Definition
    factor_type VARCHAR(100) NOT NULL,
    factor_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Impact Modeling
    impact_type VARCHAR(50),  -- 'multiplicative' or 'additive'
    base_impact FLOAT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_factors_org ON external_factors_catalog(org_id);
CREATE INDEX idx_factors_type ON external_factors_catalog(factor_type);

-- ============================================
-- Forecasting History/Audit Log
-- ============================================
CREATE TABLE IF NOT EXISTS forecast_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    forecast_id UUID NOT NULL REFERENCES demand_forecasts(id),
    
    -- Change Tracking
    action VARCHAR(50) NOT NULL,  -- 'created', 'updated', 'acknowledged', 'rejected'
    changed_by VARCHAR(255),
    
    -- Change Details
    previous_data JSONB,
    new_data JSONB,
    reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_forecast ON forecast_audit_log(forecast_id);
CREATE INDEX idx_audit_created ON forecast_audit_log(created_at DESC);

-- ============================================
-- Views for Common Queries
-- ============================================

-- Latest forecast per category
CREATE OR REPLACE VIEW v_latest_forecasts AS
SELECT DISTINCT ON (org_id, category)
    org_id,
    category,
    id,
    total_forecasted,
    confidence,
    created_at
FROM demand_forecasts
ORDER BY org_id, category, created_at DESC;

-- Forecasts needing reorder
CREATE OR REPLACE VIEW v_reorder_recommendations AS
SELECT
    df.id as forecast_id,
    df.category,
    df.region,
    im.current_stock,
    im.reorder_point,
    im.recommended_stock_level,
    df.total_forecasted,
    df.created_at
FROM demand_forecasts df
JOIN inventory_metrics im ON df.id = im.forecast_id
WHERE im.action = 'REORDER_NOW'
ORDER BY df.created_at DESC;

-- Active alerts summary
CREATE OR REPLACE VIEW v_active_alerts_summary AS
SELECT
    org_id,
    severity,
    COUNT(*) as count,
    COUNT(CASE WHEN acknowledged_by IS NULL THEN 1 END) as unacknowledged
FROM supply_chain_alerts
WHERE status = 'active'
GROUP BY org_id, severity;

-- ============================================
-- Utility Functions
-- ============================================

-- Function to calculate days of inventory
CREATE OR REPLACE FUNCTION calculate_days_of_inventory(
    current_stock FLOAT,
    daily_demand FLOAT
) RETURNS FLOAT AS $$
BEGIN
    IF daily_demand > 0 THEN
        RETURN current_stock / daily_demand;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate stock health percentage
CREATE OR REPLACE FUNCTION calculate_stock_health(
    current_stock FLOAT,
    recommended_level FLOAT
) RETURNS FLOAT AS $$
BEGIN
    IF recommended_level > 0 THEN
        RETURN (current_stock / recommended_level) * 100;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migrations/Cleanup (if needed)
-- ============================================

-- Drop all tables (USE WITH CAUTION!)
-- DROP TABLE IF EXISTS forecast_audit_log CASCADE;
-- DROP TABLE IF EXISTS external_factors_catalog CASCADE;
-- DROP TABLE IF EXISTS model_performance CASCADE;
-- DROP TABLE IF EXISTS kpi_metrics CASCADE;
-- DROP TABLE IF EXISTS supply_chain_alerts CASCADE;
-- DROP TABLE IF EXISTS ai_conversations CASCADE;
-- DROP TABLE IF EXISTS business_simulations CASCADE;
-- DROP TABLE IF EXISTS inventory_metrics CASCADE;
-- DROP TABLE IF EXISTS demand_forecasts CASCADE;
