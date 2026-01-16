from app.utils.llm_factory import get_llm
from langchain_core.prompts import ChatPromptTemplate
from app.models.schemas import AlternativeClause, ClauseExtraction
from app.config import settings
import json

class AlternativeGeneratorAgent:
    """Generate alternative clause language"""
    
    def __init__(self):
        # Use generation-optimized model
        self.llm = get_llm(temperature=0.3, task_type="alternative_generation")
    
    def generate_alternatives(self, clause: ClauseExtraction, risk_level: str) -> AlternativeClause:
        """Generate three alternative versions of a clause"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert contract attorney. Generate three alternative versions of the given clause:
            
            1. **Vendor-Favorable**: Most protective for the vendor/service provider
            2. **Balanced/Market-Standard**: Industry-standard fair language
            3. **User-Protective**: Most protective for the customer/client
            
            For each alternative:
            - Use clear, precise legal language
            - Maintain the core intent of the clause
            - Add appropriate protections, limitations, or carve-outs
            
            Return a JSON object:
            {{
              "vendor_favorable": "Full text of vendor-favorable version",
              "balanced_standard": "Full text of balanced version",
              "user_protective": "Full text of user-protective version",
              "key_changes": ["Change 1", "Change 2", "Change 3"],
              "industry_standard_reference": "UCC Section X, ABA Model Contract, etc."
            }}"""),
            ("user", """Generate alternatives for this clause:
            
            Original Clause: {clause_text}
            Clause Type: {clause_type}
            Current Risk Level: {risk_level}
            
            Provide three alternative versions in JSON format.""")
        ])
        
        chain = prompt | self.llm
        
        response = chain.invoke({
            "clause_text": clause.clause_text[:2000],
            "clause_type": clause.clause_type,
            "risk_level": risk_level
        })
        
        alternatives = self._parse_alternatives(response.content, clause.clause_id)
        return AlternativeClause(**alternatives)
    
    def _parse_alternatives(self, response: str, clause_id: str) -> dict:
        """Parse LLM response into alternative clauses"""
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
                    "original_clause_id": clause_id,
                    "vendor_favorable": _to_string(data.get('vendor_favorable', 'Alternative pending')),
                    "balanced_standard": _to_string(data.get('balanced_standard', 'Alternative pending')),
                    "user_protective": _to_string(data.get('user_protective', 'Alternative pending')),
                    "key_changes": data.get('key_changes', []),
                    "industry_standard_reference": _to_string(data.get('industry_standard_reference', 'None'))
                }
        except json.JSONDecodeError as e:
            print(f"Error parsing alternatives JSON: {e}")
        except Exception as e:
            print(f"Error parsing alternatives: {e}")
        
        return {
            "original_clause_id": clause_id,
            "vendor_favorable": "Alternative generation in progress",
            "balanced_standard": "Alternative generation in progress",
            "user_protective": "Alternative generation in progress",
            "key_changes": [],
            "industry_standard_reference": None
        }
