from app.utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from app.models.schemas import LegalReasoning, ClauseExtraction
from app.config import settings
import json

class LegalReasonerAgent:
    """Provide legal reasoning and case law support"""
    
    def __init__(self):
        # Use intelligent model for deep legal reasoning
        self.llm = get_llm(temperature=0.2, task_type="legal_reasoning")
    
    def generate_legal_reasoning(self, clause: ClauseExtraction, risk_explanation: str) -> LegalReasoning:
        """Generate comprehensive legal reasoning"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a senior legal counsel with expertise in contract law.
            
            Provide comprehensive legal analysis in JSON format:
            {{
              "legal_principles": ["Principle 1", "Principle 2"],
              "relevant_statutes": ["UCC § X", "Statute Y"],
              "case_law_references": [
                {{"case_name": "Smith v. Jones", "year": "2022", "relevance": "Why this case matters"}}
              ],
              "enforceability_assessment": "Likely enforceable/questionable/likely unenforceable with explanation",
              "negotiation_leverage": "Key leverage points and arguments",
              "recommended_position": "Specific negotiation tactics and fallback positions"
            }}
            
            Be specific and cite actual legal authorities where possible."""),
            ("user", """Provide legal reasoning for this clause:
            
            Clause: {clause_text}
            Type: {clause_type}
            Risk Identified: {risk_explanation}
            
            Provide detailed legal analysis in JSON format.""")
        ])
        
        chain = prompt | self.llm
        
        response = chain.invoke({
            "clause_text": clause.clause_text[:2000],
            "clause_type": clause.clause_type,
            "risk_explanation": risk_explanation[:1000]
        })
        
        reasoning = self._parse_reasoning(response.content, clause.clause_id)
        return LegalReasoning(**reasoning)
    
    def _parse_reasoning(self, response: str, clause_id: str) -> dict:
        """Parse LLM response into legal reasoning"""
        def _to_string(val):
            if isinstance(val, (dict, list)):
                return json.dumps(val, indent=2)
            return str(val) if val is not None else ""

        try:
            json_start = response.find('{')
            json_end = response.rfind('}')
            
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end + 1]
                data = json.loads(json_str)
                
                return {
                    "clause_id": clause_id,
                    "legal_principles": data.get('legal_principles', []),
                    "relevant_statutes": data.get('relevant_statutes', []),
                    "case_law_references": data.get('case_law_references', []),
                    "enforceability_assessment": _to_string(data.get('enforceability_assessment', 'Assessment pending')),
                    "negotiation_leverage": _to_string(data.get('negotiation_leverage', 'Analysis pending')),
                    "recommended_position": _to_string(data.get('recommended_position', 'Recommendations pending'))
                }
        except json.JSONDecodeError as e:
            print(f"Error parsing legal reasoning JSON: {e}")
        except Exception as e:
            print(f"Error parsing legal reasoning: {e}")
        
        return {
            "clause_id": clause_id,
            "legal_principles": ["Unconscionability doctrine", "Good faith and fair dealing"],
            "relevant_statutes": ["UCC § 2-719", "Restatement (Second) of Contracts § 208"],
            "case_law_references": [],
            "enforceability_assessment": "Requires detailed analysis",
            "negotiation_leverage": "Analysis in progress",
            "recommended_position": "Recommendations pending"
        }
