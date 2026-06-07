"""
Google Gemini AI Integration for SupplyMind AI
Provides explainable insights, recommendations, and natural language Q&A
"""

import os
import json
from typing import Optional, Dict, List
from dataclasses import dataclass
import google.generativeai as genai

@dataclass
class AIInsightRequest:
    """Request for AI-powered insights"""
    forecast_data: Dict
    inventory_metrics: Dict
    external_factors: Dict
    historical_context: Optional[str] = None
    query: Optional[str] = None

class GeminiAIService:
    """Google Gemini-powered AI assistant for supply chain insights"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini client"""
        self.api_key = api_key or os.getenv("GOOGLE_GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.chat_history = []
    
    def generate_forecast_insights(self, request: AIInsightRequest) -> Dict:
        """Generate AI insights from forecast data"""
        
        context = self._build_context(request)
        prompt = f"""You are an expert supply chain analyst. Analyze this forecast and provide actionable insights:

{context}

Please provide:
1. **Forecast Analysis**: What does the data tell us about demand trends?
2. **Risk Assessment**: What potential risks should we monitor?
3. **Inventory Strategy**: What's the recommended inventory approach?
4. **Optimization Opportunities**: What can we optimize?
5. **Action Items**: What should we do in the next 7 days?

Format your response as a structured JSON object."""
        
        response = self.model.generate_content(prompt)
        return self._parse_ai_response(response.text, request)
    
    def generate_inventory_recommendations(
        self,
        current_stock: float,
        forecast_demand: float,
        reorder_point: float,
        lead_time_days: int,
        external_factors: Dict
    ) -> Dict:
        """Generate inventory recommendations"""
        
        prompt = f"""As a supply chain expert, provide inventory recommendations:

Current Stock: {current_stock} units
Forecasted Demand (30 days): {forecast_demand} units
Reorder Point: {reorder_point} units
Lead Time: {lead_time_days} days
External Factors: {json.dumps(external_factors)}

Provide recommendations in JSON format with:
- Reorder quantity
- Recommended stock level
- Safety stock buffer
- Risk level (low/medium/high)
- Action (reorder now / monitor / reduce inventory)
- Reasoning"""
        
        response = self.model.generate_content(prompt)
        return json.loads(response.text)
    
    def explain_forecast_variation(
        self,
        current_forecast: float,
        previous_forecast: float,
        actual_sales: List[float],
        external_factors: Dict
    ) -> str:
        """Explain why forecast changed"""
        
        variation_percent = ((current_forecast - previous_forecast) / previous_forecast * 100) if previous_forecast else 0
        
        prompt = f"""Explain this forecast change in simple terms:

Previous Forecast: {previous_forecast} units
Current Forecast: {current_forecast} units
Change: {variation_percent:+.1f}%

Recent Sales Pattern: {actual_sales[-5:]}  # Last 5 periods
External Factors: {json.dumps(external_factors)}

Provide a brief explanation suitable for business stakeholders (non-technical)."""
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def interactive_chat(self, user_message: str, context: Optional[Dict] = None) -> str:
        """Interactive Q&A about forecast and inventory"""
        
        system_context = ""
        if context:
            system_context = f"""Current Context:
Forecast Data: {json.dumps(context.get('forecast', {}))}
Inventory: {json.dumps(context.get('inventory', {}))}
"""
        
        full_prompt = f"""{system_context}
User Question: {user_message}

Answer as a helpful supply chain assistant. Be concise and actionable."""
        
        response = self.model.generate_content(full_prompt)
        
        # Store in chat history
        self.chat_history.append({
            "user": user_message,
            "assistant": response.text
        })
        
        return response.text
    
    def generate_business_simulation_analysis(
        self,
        scenarios: List[Dict],
        base_forecast: float,
        constraints: Dict
    ) -> Dict:
        """Analyze business simulation scenarios"""
        
        prompt = f"""Analyze these business simulation scenarios and recommend the best one:

Base Forecast: {base_forecast} units

Scenarios:
{json.dumps(scenarios, indent=2)}

Constraints:
{json.dumps(constraints)}

Provide analysis in JSON format with:
- Best scenario (name and why)
- Risk assessment for each scenario
- Resource implications
- Revenue impact estimate
- Recommendations for scenario execution"""
        
        response = self.model.generate_content(prompt)
        return json.loads(response.text)
    
    def generate_alert_recommendations(
        self,
        alert_type: str,
        current_value: float,
        threshold: float,
        context: Dict
    ) -> Dict:
        """Generate recommendations when alerts trigger"""
        
        prompt = f"""Generate immediate recommendations for this supply chain alert:

Alert Type: {alert_type}
Current Value: {current_value}
Alert Threshold: {threshold}
Context: {json.dumps(context)}

Provide in JSON:
- Severity (low/medium/high/critical)
- Recommended immediate actions (as list)
- Timeline to act
- Potential impact if not addressed
- Success metrics to monitor"""
        
        response = self.model.generate_content(prompt)
        return json.loads(response.text)
    
    def _build_context(self, request: AIInsightRequest) -> str:
        """Build context string for AI analysis"""
        
        context_parts = [
            f"**Forecast Data**: {json.dumps(request.forecast_data, indent=2)}",
            f"**Inventory Metrics**: {json.dumps(request.inventory_metrics, indent=2)}",
            f"**External Factors**: {json.dumps(request.external_factors, indent=2)}",
        ]
        
        if request.historical_context:
            context_parts.append(f"**Historical Context**: {request.historical_context}")
        
        if request.query:
            context_parts.append(f"**Specific Query**: {request.query}")
        
        return "\n".join(context_parts)
    
    def _parse_ai_response(self, response_text: str, request: AIInsightRequest) -> Dict:
        """Parse and structure AI response"""
        
        try:
            # Try to extract JSON from response
            if "{" in response_text and "}" in response_text:
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                json_str = response_text[json_start:json_end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        
        # Fallback: return structured response
        return {
            "status": "success",
            "insights": response_text,
            "forecast_demand": request.forecast_data.get("total_forecasted"),
            "confidence": request.forecast_data.get("confidence", "medium"),
            "timestamp": request.forecast_data.get("timestamp")
        }
    
    def get_chat_history(self) -> List[Dict]:
        """Get conversation history"""
        return self.chat_history
    
    def clear_chat_history(self):
        """Clear conversation history"""
        self.chat_history = []

# Example Usage
if __name__ == "__main__":
    # Initialize service
    ai_service = GeminiAIService()
    
    # Example: Interactive Q&A
    response = ai_service.interactive_chat(
        "Should we increase inventory given the upcoming festival season?",
        context={
            "forecast": {"total_forecasted": 10000},
            "inventory": {"current_stock": 5000, "reorder_point": 2000}
        }
    )
    print("AI Response:", response)
    
    # Example: Generate insights
    request = AIInsightRequest(
        forecast_data={"total_forecasted": 10000, "confidence": "high"},
        inventory_metrics={"current_stock": 5000},
        external_factors={"festival": "Diwali", "promotion": True},
        query="Why is demand expected to increase?"
    )
    
    insights = ai_service.generate_forecast_insights(request)
    print("Insights:", insights)
