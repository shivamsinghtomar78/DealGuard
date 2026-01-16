from app.utils.llm_factory import get_llm, get_reliable_json_llm
from langchain_core.prompts import ChatPromptTemplate
from typing import List
from app.models.schemas import RiskAssessment, RiskLevel, ClauseExtraction
from app.config import settings
import json

class RiskAnalyzerAgent:
    """Agent to analyze risks in contract clauses"""
    
    def __init__(self):
        # Use task-specific model for risk analysis (reliable model)
        self.llm_chain = get_reliable_json_llm(temperature=0.2, task_type="risk_analysis")
    
    def analyze_clause_risk(self, clause: ClauseExtraction) -> RiskAssessment:
        """Analyze risk for a single clause"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert contract risk analyst with 20+ years of experience.
            
            Analyze the given clause for potential risks. Consider:
            1. **Financial exposure**: unlimited liability, penalties, payment terms
            2. **Legal risks**: jurisdiction, waiver of rights, indemnification
            3. **Operational risks**: impossible obligations, vendor lock-in
            4. **Reputational risks**: confidentiality, warranty limitations
            
            Return a JSON object with:
            {{
              "risk_level": "low|medium|high|critical",
              "risk_category": "financial|legal|operational|reputational",
              "risk_explanation": "Detailed explanation of why this is risky",
              "potential_impact": "What could go wrong",
              "worst_case_scenario": "Absolute worst outcome",
              "financial_exposure": "Estimated dollar impact if applicable",
              "mitigation_steps": ["Step 1", "Step 2"]
            }}
            
            Be specific and cite legal principles where relevant."""),
            ("user", """Analyze this clause:
            
            Clause Name: {clause_name}
            Clause Type: {clause_type}
            Clause Text: {clause_text}
            
            Provide a detailed risk assessment in JSON format.""")
        ])
        
        try:
            # invoke the reliable chain which returns a direct dict after validation/fallback
            data = self.llm_chain.invoke(prompt.format_messages(
                clause_name=clause.clause_name,
                clause_type=clause.clause_type,
                clause_text=clause.clause_text[:2000]
            ))
            
            risk_data = {
                "clause_id": clause.clause_id,
                "clause_text": clause.clause_text[:500],
                "risk_level": RiskLevel(data.get('risk_level', 'medium')),
                "risk_category": str(data.get('risk_category', 'legal')),
                "risk_explanation": str(data.get('risk_explanation', 'Risk analysis pending')),
                "potential_impact": str(data.get('potential_impact', 'Impact assessment pending')),
                "worst_case_scenario": str(data.get('worst_case_scenario', 'Scenario analysis pending')),
                "financial_exposure": str(data.get('financial_exposure', 'None')),
                "mitigation_steps": data.get('mitigation_steps', [])
            }
            return RiskAssessment(**risk_data)
        except Exception as e:
            print(f"❌ Risk Analysis failed even with fallbacks: {e}")
            # Final fallback as a safety net
            return RiskAssessment(
                clause_id=clause.clause_id,
                clause_text=clause.clause_text[:500],
                risk_level=RiskLevel.MEDIUM,
                risk_category="legal",
                risk_explanation=f"AI analysis failed: {str(e)}",
                potential_impact="Requires human review",
                worst_case_scenario="Unknown",
                mitigation_steps=[]
            )
    
    def analyze_all_clauses(self, clauses: List[ClauseExtraction]) -> List[RiskAssessment]:
        """Analyze risks for all clauses"""
        risk_assessments = []
        
        for clause in clauses:
            try:
                assessment = self.analyze_clause_risk(clause)
                # Only include medium, high, or critical risks
                if assessment.risk_level in [RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]:
                    risk_assessments.append(assessment)
            except Exception as e:
                print(f"Error analyzing clause {clause.clause_id}: {e}")
                continue
        
        return risk_assessments
    
