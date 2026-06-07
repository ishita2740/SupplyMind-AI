"""
Enhanced Forecast Service with SupplyMind AI Integration
Combines Prophet, XGBoost, and ARIMA with inventory management and business simulation
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
from dataclasses import dataclass, asdict
from enum import Enum

class ForecastAlgorithm(str, Enum):
    PROPHET = "prophet"
    XGBOOST = "xgboost"
    ARIMA = "arima"
    ENSEMBLE = "ensemble"

class ConfidenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

@dataclass
class InventoryMetrics:
    """Inventory-related metrics from forecast"""
    current_stock: float
    reorder_point: float
    reorder_quantity: float
    stock_health_percentage: float  # 0-100
    days_of_inventory: float
    recommended_stock_level: float
    
class SimulationScenario:
    """Business simulation with discount/marketing/festival impact"""
    def __init__(self, base_forecast: float, name: str = ""):
        self.name = name
        self.base_forecast = base_forecast
        self.discount_percent = 0.0
        self.marketing_impact_percent = 0.0
        self.festival_impact_percent = 0.0
        self.supply_constraint_percent = 0.0
        
    def calculate_projected_demand(self) -> Dict:
        """Calculate projected demand with all factors"""
        # Base demand adjusted by discount (price elasticity)
        discount_factor = 1 + (self.discount_percent / 100) * 0.5  # 50% price elasticity
        
        # Marketing impact (direct demand boost)
        marketing_factor = 1 + (self.marketing_impact_percent / 100)
        
        # Festival impact (seasonal multiplier)
        festival_factor = 1 + (self.festival_impact_percent / 100)
        
        # Supply constraint (reduces achievable sales)
        supply_factor = 1 - (self.supply_constraint_percent / 100)
        
        # Combined calculation
        projected = self.base_forecast * discount_factor * marketing_factor * festival_factor * supply_factor
        
        return {
            "scenario_name": self.name,
            "base_forecast": self.base_forecast,
            "projected_demand": round(projected, 2),
            "change_percent": round(((projected - self.base_forecast) / self.base_forecast * 100), 2),
            "factors_applied": {
                "discount": self.discount_percent,
                "marketing": self.marketing_impact_percent,
                "festival": self.festival_impact_percent,
                "supply_constraint": self.supply_constraint_percent,
            },
            "multipliers": {
                "discount_factor": discount_factor,
                "marketing_factor": marketing_factor,
                "festival_factor": festival_factor,
                "supply_factor": supply_factor,
            },
            "recommendation": self._get_recommendation(projected)
        }
    
    def _get_recommendation(self, projected_demand: float) -> str:
        """Get AI-powered recommendation based on scenario"""
        change = ((projected_demand - self.base_forecast) / self.base_forecast) * 100
        
        if change > 50:
            return "HIGH DEMAND EXPECTED: Increase inventory 40-50%. Consider pre-campaign stock builds."
        elif change > 20:
            return "MODERATE DEMAND INCREASE: Increase inventory 20-30%. Enable faster restocking."
        elif change > 0:
            return "SLIGHT INCREASE: Monitor demand closely, adjust inventory gradually."
        elif change < -50:
            return "LOW DEMAND EXPECTED: Reduce inventory 40-50%. Focus on cash flow optimization."
        elif change < -20:
            return "MODERATE DECREASE: Reduce inventory 20-30%. Implement promotional tactics."
        else:
            return "STABLE DEMAND: Maintain current inventory levels. Monitor for changes."

class EnhancedForecastService:
    """Main service combining forecasting with inventory and simulation"""
    
    def __init__(self, db_session=None):
        self.db = db_session
        self.prophet_service = None  # Will be initialized from existing prophet_model
        
    def generate_forecast_with_insights(
        self,
        dates: List[str],
        sales: List[float],
        forecast_days: int = 30,
        algorithm: ForecastAlgorithm = ForecastAlgorithm.PROPHET,
        external_factors: Optional[Dict] = None,
    ) -> Dict:
        """
        Generate forecast with all SupplyMind AI features integrated
        """
        forecast_result = {
            "algorithm": algorithm.value,
            "timestamp": datetime.now().isoformat(),
            "forecast_days": forecast_days,
            "base_metrics": self._calculate_base_metrics(sales),
            "forecast_data": None,
            "confidence": ConfidenceLevel.MEDIUM.value,
            "inventory_recommendation": None,
            "simulation_scenarios": None,
            "ai_insights": None,
        }
        
        # Generate forecast using selected algorithm
        if algorithm == ForecastAlgorithm.PROPHET:
            forecast_result["forecast_data"] = self._forecast_prophet(dates, sales, forecast_days)
        elif algorithm == ForecastAlgorithm.XGBOOST:
            forecast_result["forecast_data"] = self._forecast_xgboost(dates, sales, forecast_days)
        elif algorithm == ForecastAlgorithm.ARIMA:
            forecast_result["forecast_data"] = self._forecast_arima(dates, sales, forecast_days)
        elif algorithm == ForecastAlgorithm.ENSEMBLE:
            forecast_result["forecast_data"] = self._forecast_ensemble(dates, sales, forecast_days)
        
        # Get confidence level based on data quality
        forecast_result["confidence"] = self._evaluate_confidence(len(dates), np.std(sales))
        
        # Generate inventory metrics
        if external_factors and "current_stock" in external_factors:
            forecast_result["inventory_recommendation"] = self._generate_inventory_recommendation(
                forecast_result["forecast_data"],
                external_factors
            )
        
        # Generate simulation scenarios
        base_forecast = forecast_result["forecast_data"]["total_forecasted"]
        forecast_result["simulation_scenarios"] = self._generate_simulation_scenarios(base_forecast)
        
        # Generate AI insights
        if external_factors:
            forecast_result["ai_insights"] = self._generate_ai_insights(
                forecast_result, external_factors, dates, sales
            )
        
        return forecast_result
    
    def _calculate_base_metrics(self, sales: List[float]) -> Dict:
        """Calculate baseline statistics"""
        sales_arr = np.array(sales)
        return {
            "avg_sales": float(np.mean(sales_arr)),
            "std_sales": float(np.std(sales_arr)),
            "min_sales": float(np.min(sales_arr)),
            "max_sales": float(np.max(sales_arr)),
            "trend": "up" if sales_arr[-1] > np.mean(sales_arr) else "down",
            "volatility": float(np.std(sales_arr) / np.mean(sales_arr)),
        }
    
    def _forecast_prophet(self, dates: List[str], sales: List[float], days: int) -> Dict:
        """Use existing Prophet implementation"""
        # This integrates with your existing prophet_model.py
        # Returns forecast data with confidence intervals
        return {
            "method": "prophet",
            "total_forecasted": sum(sales) * 1.1,  # Placeholder
            "daily_forecasts": [],
            "confidence_interval": {"lower": 0, "upper": 0},
        }
    
    def _forecast_xgboost(self, dates: List[str], sales: List[float], days: int) -> Dict:
        """XGBoost ensemble forecasting"""
        # Placeholder for XGBoost implementation
        return {
            "method": "xgboost",
            "total_forecasted": sum(sales) * 1.15,
            "daily_forecasts": [],
            "confidence_interval": {"lower": 0, "upper": 0},
        }
    
    def _forecast_arima(self, dates: List[str], sales: List[float], days: int) -> Dict:
        """ARIMA time-series forecasting"""
        # Placeholder for ARIMA implementation
        return {
            "method": "arima",
            "total_forecasted": sum(sales) * 1.12,
            "daily_forecasts": [],
            "confidence_interval": {"lower": 0, "upper": 0},
        }
    
    def _forecast_ensemble(self, dates: List[str], sales: List[float], days: int) -> Dict:
        """Ensemble of all three models"""
        prophet = self._forecast_prophet(dates, sales, days)
        xgboost = self._forecast_xgboost(dates, sales, days)
        arima = self._forecast_arima(dates, sales, days)
        
        # Average the predictions
        avg_forecast = (
            prophet["total_forecasted"] + 
            xgboost["total_forecasted"] + 
            arima["total_forecasted"]
        ) / 3
        
        return {
            "method": "ensemble",
            "total_forecasted": round(avg_forecast, 2),
            "component_forecasts": {
                "prophet": prophet["total_forecasted"],
                "xgboost": xgboost["total_forecasted"],
                "arima": arima["total_forecasted"],
            },
            "daily_forecasts": [],
            "confidence_interval": {"lower": 0, "upper": 0},
        }
    
    def _evaluate_confidence(self, data_points: int, volatility: float) -> str:
        """Determine confidence level based on data quality"""
        if data_points < 12:
            return ConfidenceLevel.LOW.value
        elif volatility > 0.5:
            return ConfidenceLevel.LOW.value
        elif data_points < 24 or volatility > 0.3:
            return ConfidenceLevel.MEDIUM.value
        else:
            return ConfidenceLevel.HIGH.value
    
    def _generate_inventory_recommendation(self, forecast: Dict, factors: Dict) -> Dict:
        """Generate inventory recommendations based on forecast"""
        current_stock = factors.get("current_stock", 0)
        reorder_point = factors.get("reorder_point", 0)
        
        recommended = forecast["total_forecasted"] * 1.3  # 30% safety stock
        
        return {
            "current_stock": current_stock,
            "forecast_demand": forecast["total_forecasted"],
            "recommended_stock_level": round(recommended, 2),
            "reorder_suggested": recommended > current_stock,
            "stock_health": "good" if current_stock > reorder_point else "critical",
            "action": "REORDER NOW" if current_stock < reorder_point else "MONITOR",
        }
    
    def _generate_simulation_scenarios(self, base_forecast: float) -> List[Dict]:
        """Generate business simulation scenarios"""
        scenarios = [
            SimulationScenario(base_forecast, "Conservative"),
            SimulationScenario(base_forecast, "Baseline"),
            SimulationScenario(base_forecast, "Optimistic"),
        ]
        
        # Conservative: -15% discount, -10% marketing
        scenarios[0].discount_percent = -15
        scenarios[0].marketing_impact_percent = -10
        
        # Baseline: current settings
        scenarios[1].discount_percent = 0
        scenarios[1].marketing_impact_percent = 0
        
        # Optimistic: +20% festival + 10% marketing
        scenarios[2].festival_impact_percent = 20
        scenarios[2].marketing_impact_percent = 10
        
        return [s.calculate_projected_demand() for s in scenarios]
    
    def _generate_ai_insights(
        self,
        forecast: Dict,
        external_factors: Dict,
        dates: List[str],
        sales: List[float]
    ) -> str:
        """Generate AI-powered insights using Gemini"""
        # This will be called from your existing forecast_ai.py with Gemini integration
        insights_prompt = f"""
        Analyze this forecast data and provide actionable supply chain insights:
        
        Forecast: {forecast['base_metrics']}
        Confidence: {forecast['confidence']}
        External Factors: {external_factors}
        
        Provide insights on:
        1. Demand drivers and trends
        2. Inventory strategy recommendations
        3. Risk factors to monitor
        4. Opportunity areas for optimization
        """
        return insights_prompt
    
    def simulate_business_scenario(
        self,
        base_forecast: float,
        discount_percent: float = 0,
        marketing_percent: float = 0,
        festival_percent: float = 0,
        supply_constraint_percent: float = 0,
    ) -> Dict:
        """Interactive business simulation"""
        scenario = SimulationScenario(base_forecast, "Custom")
        scenario.discount_percent = discount_percent
        scenario.marketing_impact_percent = marketing_percent
        scenario.festival_impact_percent = festival_percent
        scenario.supply_constraint_percent = supply_constraint_percent
        
        return scenario.calculate_projected_demand()

# Usage Example
if __name__ == "__main__":
    service = EnhancedForecastService()
    
    # Sample data
    dates = ["2024-01-01", "2024-02-01", "2024-03-01", "2024-04-01"]
    sales = [100, 120, 140, 160]
    
    # Generate comprehensive forecast
    result = service.generate_forecast_with_insights(
        dates=dates,
        sales=sales,
        forecast_days=30,
        algorithm=ForecastAlgorithm.ENSEMBLE,
        external_factors={
            "current_stock": 500,
            "reorder_point": 200,
            "upcoming_promotion": True,
            "festival_season": "Diwali",
        }
    )
    
    print(json.dumps(result, indent=2))
