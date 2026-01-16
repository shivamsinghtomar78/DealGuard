from app.utils.llm_factory import get_llm, get_reliable_json_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List
from app.models.schemas import ClauseExtraction
from app.config import settings
import json
import uuid

class ClauseExtractorAgent:
    """Agent to extract and categorize contract clauses"""
    
    def __init__(self):
        # Use task-specific model routing for optimized extraction
        self.llm_chain = get_reliable_json_llm(temperature=0.1, task_type="clause_extraction")
        
    def extract_clauses(self, contract_text: str) -> List[ClauseExtraction]:
        """Extract all clauses from contract"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert contract analyst. Extract all distinct clauses from the contract.
            
            For each clause, identify:
            - A unique identifier (use sequential numbers: clause_1, clause_2, etc.)
            - The clause name/title (e.g., "Payment Terms", "Liability Limitation")
            - The full clause text (exact text from contract)
            - The clause type (payment, liability, termination, confidentiality, warranty, indemnification, etc.)
            - Confidence score (0.0 to 1.0) based on clarity
            
            Return a JSON array of clauses with this structure:
            [
              {{
                "clause_id": "clause_1",
                "clause_name": "Payment Terms",
                "clause_text": "Full text of the clause...",
                "clause_type": "payment",
                "confidence_score": 0.95
              }}
            ]
            
            Focus on identifying distinct, important clauses. Combine related sentences into complete clauses.
            """),
            ("user", "Extract clauses from this contract:\n\n{contract_text}")
        ])
        
        # No need to build chain manually, get_reliable_json_llm returns the full chain
        
        # Process in chunks if contract is large
        max_chunk_size = 12000
        clauses = []
        
        if len(contract_text) > max_chunk_size:
            chunks = self._chunk_text(contract_text, max_chunk_size)
            clause_counter = 1
            for chunk in chunks:
                try:
                    # invoke the reliable chain which returns a list/dict directly
                    response_data = self.llm_chain.invoke(prompt.format_messages(contract_text=chunk))
                    chunk_clauses = self._parse_clauses_from_data(response_data, clause_counter)
                    clauses.extend(chunk_clauses)
                    clause_counter += len(chunk_clauses)
                except Exception as e:
                    print(f"❌ Extraction failed even with fallbacks: {e}")
        else:
            try:
                response_data = self.llm_chain.invoke(prompt.format_messages(contract_text=contract_text))
                clauses = self._parse_clauses_from_data(response_data, 1)
            except Exception as e:
                print(f"❌ Extraction failed even with fallbacks: {e}")
        
        return clauses
    
    def _chunk_text(self, text: str, chunk_size: int) -> List[str]:
        """Split text into chunks"""
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            current_size += len(word) + 1
            if current_size > chunk_size:
                chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_size = len(word)
            else:
                current_chunk.append(word)
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def _parse_clauses_from_data(self, data: List[dict], start_counter: int) -> List[ClauseExtraction]:
        """Parse validated JSON data into ClauseExtraction objects"""
        def _to_string(val):
            if isinstance(val, (dict, list)):
                return json.dumps(val, indent=2)
            return str(val) if val is not None else ""

        clauses = []
        if not isinstance(data, list):
            # Handle case where LLM returns a dict with a "clauses" key
            if isinstance(data, dict) and "clauses" in data:
                data = data["clauses"]
            else:
                print(f"Warning: Unexpected data format from LLM: {type(data)}")
                return []

        for i, item in enumerate(data, start=start_counter):
            clause = ClauseExtraction(
                clause_id=_to_string(item.get('clause_id', f'clause_{i}')),
                clause_name=_to_string(item.get('clause_name', f'Clause {i}')),
                clause_text=_to_string(item.get('clause_text', '')),
                clause_type=_to_string(item.get('clause_type', 'other')),
                confidence_score=float(item.get('confidence_score', 0.8))
            )
            clauses.append(clause)
        return clauses
