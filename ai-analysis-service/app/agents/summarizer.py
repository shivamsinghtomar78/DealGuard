from app.utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from typing import List
from app.models.schemas import RiskAssessment
import json

class SummarizerAgent:
    """Agent to generate a comprehensive executive summary of contract risks"""
    
    def __init__(self):
        # Use a slightly lower temperature for consistent professional tone
        self.llm = get_llm(temperature=0.1)
    
    def generate_summary(self, risk_assessments: List[RiskAssessment], overall_score: float) -> str:
        """Generate a detailed executive summary based on findings"""
        
        if not risk_assessments:
            return "No significant risks were identified in the analyzed clauses. The contract appears to follow standard industry norms."

        # Format risks for the prompt
        risks_data = []
        for risk in risk_assessments:
            risks_data.append({
                "clause": risk.clause_text[:200],
                "level": risk.risk_level.value,
                "explanation": risk.risk_explanation
            })

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a top-tier corporate legal strategist. 
            Your task is to provide a "Strategic Legal Executive Summary" for a contract analysis report.
            
            Based on the provided risk level and specific risk assessments, write a professional, high-impact summary.
            
            Structure the summary into 3-4 professional sections:
            1. **Risk Landscape**: An overview of the overall risk posture.
            2. **Key Vulnerabilities**: Highlight the most critical issues found.
            3. **Strategic Impact**: How these risks affect the business or legal standing.
            4. **Actionable Roadmap**: Precise steps the user should take.
            
            Use a authoritative yet constructive tone. Keep it concise but deeply informative. 
            Do NOT mention that you are an AI. Do NOT use bullet points in the first paragraph.
            """),
            ("user", """
            Overall Risk Score: {score}/10
            
            Identified Risks:
            {risks_json}
            
            Generate a comprehensive Strategic Executive Summary.
            """)
        ])
        
        chain = prompt | self.llm
        
        response = chain.invoke({
            "score": overall_score,
            "risks_json": json.dumps(risks_data, indent=2)
        })
        
        return response.content
