from app.utils.llm_factory import get_llm, get_reliable_json_llm
from langchain_core.prompts import ChatPromptTemplate
from typing import List, Dict, Tuple
from app.models.schemas import RiskAssessment, EnhancedSummary, ActionItems
import json

class SummarizerAgent:
    """Agent to generate a comprehensive executive summary of contract risks"""
    
    def __init__(self):
        # Use fast model for quick summary generation
        self.llm = get_llm(temperature=0.1, task_type="summary")
        self.json_llm = get_reliable_json_llm(temperature=0.1, task_type="summary")
    
    def generate_summary(self, risk_assessments: List[RiskAssessment], overall_score: float) -> str:
        """Generate executive summary text (backward compatible)"""
        enhanced = self.generate_enhanced_summary(risk_assessments, overall_score)
        return enhanced.overall_assessment
    
    def generate_enhanced_summary(self, risk_assessments: List[RiskAssessment], overall_score: float) -> EnhancedSummary:
        """Generate a detailed structured summary with actionable insights"""
        
        if not risk_assessments:
            return EnhancedSummary(
                overall_assessment="No significant risks were identified in the analyzed clauses. The contract appears to follow standard industry norms.",
                top_critical_issues=[],
                recommendation="approve",
                recommendation_reasoning="No material risks identified that would prevent signing.",
                action_items=ActionItems(),
                total_clauses_analyzed=0,
                risky_clauses_count=0,
                risk_breakdown={}
            )

        # Format risks for the prompt
        risks_data = []
        risk_breakdown = {"financial": 0, "legal": 0, "operational": 0, "reputational": 0}
        
        for risk in risk_assessments:
            risk_type = risk.risk_type.value if hasattr(risk.risk_type, 'value') else str(risk.risk_type)
            if risk_type in risk_breakdown:
                risk_breakdown[risk_type] += 1
            
            risks_data.append({
                "clause": risk.clause_text[:200],
                "level": risk.risk_level.value if hasattr(risk.risk_level, 'value') else str(risk.risk_level),
                "type": risk_type,
                "explanation": risk.risk_explanation,
                "financial_exposure": risk.financial_exposure or "Not quantified",
                "worst_case": risk.worst_case_scenario
            })

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a top-tier corporate legal strategist. 
            Analyze the contract risks and provide a structured JSON response.
            
            Return ONLY valid JSON with this exact structure:
            {{
                "overall_assessment": "2-3 paragraph executive summary of the contract's risk posture",
                "top_critical_issues": ["Issue 1", "Issue 2", "Issue 3"],
                "recommendation": "approve|negotiate|reject",
                "recommendation_reasoning": "Brief explanation of why this recommendation",
                "action_items": {{
                    "must_fix": ["Critical items that MUST be fixed before signing"],
                    "should_negotiate": ["Important items to negotiate but not deal-breakers"],
                    "nice_to_have": ["Optional improvements if there's leverage"]
                }}
            }}
            
            RULES:
            - recommendation should be "approve" if score < 4, "negotiate" if score 4-7, "reject" if score > 7
            - top_critical_issues should list the 3 most serious problems
            - must_fix items are deal-breakers (critical/high risks)
            - should_negotiate items are medium risks
            - nice_to_have items are low risks or minor improvements"""),
            ("user", """
            Overall Risk Score: {score}/10
            
            Identified Risks:
            {risks_json}
            
            Generate a structured analysis response in JSON format.
            """)
        ])
        
        try:
            response_data = self.json_llm.invoke(prompt.format_messages(
                score=overall_score,
                risks_json=json.dumps(risks_data, indent=2)
            ))
            
            # Parse action items
            action_items_data = response_data.get('action_items', {})
            action_items = ActionItems(
                must_fix=action_items_data.get('must_fix', []),
                should_negotiate=action_items_data.get('should_negotiate', []),
                nice_to_have=action_items_data.get('nice_to_have', [])
            )
            
            return EnhancedSummary(
                overall_assessment=str(response_data.get('overall_assessment', 'Analysis complete.')),
                top_critical_issues=response_data.get('top_critical_issues', [])[:3],
                recommendation=str(response_data.get('recommendation', 'negotiate')).lower(),
                recommendation_reasoning=str(response_data.get('recommendation_reasoning', '')),
                action_items=action_items,
                total_clauses_analyzed=len(risk_assessments),
                risky_clauses_count=len([r for r in risk_assessments if r.risk_level.value in ['high', 'critical']]),
                risk_breakdown=risk_breakdown
            )
            
        except Exception as e:
            print(f"❌ Summary generation failed: {e}")
            # Fallback to basic summary
            return EnhancedSummary(
                overall_assessment=f"Contract analysis completed with overall risk score of {overall_score}/10. Review identified {len(risk_assessments)} risk areas requiring attention.",
                top_critical_issues=[r.risk_explanation[:100] for r in risk_assessments[:3]],
                recommendation="negotiate" if overall_score >= 4 else "approve",
                recommendation_reasoning="Based on overall risk score assessment.",
                action_items=ActionItems(
                    must_fix=[r.risk_explanation[:80] for r in risk_assessments if r.risk_level.value in ['critical', 'high']][:3],
                    should_negotiate=[r.risk_explanation[:80] for r in risk_assessments if r.risk_level.value == 'medium'][:3],
                    nice_to_have=[]
                ),
                total_clauses_analyzed=len(risk_assessments),
                risky_clauses_count=len([r for r in risk_assessments if r.risk_level.value in ['high', 'critical']]),
                risk_breakdown=risk_breakdown
            )
