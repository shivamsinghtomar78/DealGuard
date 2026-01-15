import os
import sys
import pytest
from unittest.mock import MagicMock

# Add the app directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.agents.clause_extractor import ClauseExtractorAgent
from app.agents.risk_analyzer import RiskAnalyzerAgent
from app.agents.alternative_generator import AlternativeGeneratorAgent
from app.models.schemas import ClauseExtraction, RiskLevel

@pytest.fixture
def clause_extractor():
    return ClauseExtractorAgent()

@pytest.fixture
def risk_analyzer():
    return RiskAnalyzerAgent()

@pytest.fixture
def alternative_generator():
    return AlternativeGeneratorAgent()

def test_clause_extraction_basic(clause_extractor):
    text = "Payment shall be made within 30 days of receipt of invoice. Either party may terminate this agreement with 10 days notice."
    clauses = clause_extractor.extract_clauses(text)
    
    assert len(clauses) >= 2
    assert any("Payment" in c.clause_name for c in clauses)
    assert any("terminate" in c.clause_text.lower() for c in clauses)
    assert all(isinstance(c, ClauseExtraction) for c in clauses)

def test_risk_analysis_high_risk(risk_analyzer):
    clause = ClauseExtraction(
        clause_id="test_1",
        clause_name="Liability",
        clause_text="The vendor shall be liable for all damages without any limit or cap, including indirect and consequential damages.",
        clause_type="liability",
        confidence_score=1.0
    )
    
    assessment = risk_analyzer.analyze_clause_risk(clause)
    
    assert assessment.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert assessment.clause_id == "test_1"
    assert "liability" in assessment.risk_category.lower()

def test_risk_analysis_low_risk(risk_analyzer):
    clause = ClauseExtraction(
        clause_id="test_2",
        clause_name="Governing Law",
        clause_text="This agreement shall be governed by the laws of the State of New York.",
        clause_type="governing_law",
        confidence_score=1.0
    )
    
    assessment = risk_analyzer.analyze_clause_risk(clause)
    
    # Even if it's not "low", it should be less than critical
    assert assessment.risk_level != RiskLevel.CRITICAL

def test_alternative_generation(alternative_generator):
    clause = ClauseExtraction(
        clause_id="test_3",
        clause_name="Liability",
        clause_text="The vendor shall be liable for all damages without limit.",
        clause_type="liability",
        confidence_score=1.0
    )
    
    alternatives = alternative_generator.generate_alternatives(clause, "high")
    
    assert alternatives.original_clause_id == "test_3"
    assert alternatives.vendor_favorable is not None
    assert alternatives.balanced_standard is not None
    assert alternatives.user_protective is not None
    assert len(alternatives.key_changes) > 0

if __name__ == "__main__":
    # If run directly, just run the tests
    pytest.main([__file__])
