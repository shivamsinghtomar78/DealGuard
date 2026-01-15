import os
import sys
import pytest
from typing import List

# Add the app directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.workflows.analysis_workflow import ContractAnalysisWorkflow, AnalysisState

def test_full_workflow_integration():
    workflow = ContractAnalysisWorkflow()
    
    test_contract = """
    SERVICE AGREEMENT
    
    1. PAYMENT TERMS
    The Customer shall pay the Vendor $10,000 within 5 days of receipt of invoice. Late payments will incur a 25% monthly interest penalty.
    
    2. LIMITATION OF LIABILITY
    The Vendor's liability for any claim arising under this agreement shall be unlimited.
    
    3. TERMINATION
    Either party may terminate this agreement immediately for any reason without notice.
    
    4. GOVERNING LAW
    This agreement is governed by the laws of the State of Mars.
    """
    
    # Run the workflow
    result = workflow.run(
        contract_text=test_contract,
        contract_id="integration_test_1",
        category="service-agreement"
    )
    
    # Assertions
    assert result["error"] == ""
    assert len(result["clauses"]) > 0
    assert len(result["risk_assessments"]) > 0
    assert result["overall_risk_score"] > 0
    assert result["executive_summary"] != ""
    assert len(result["agent_logs"]) > 2
    
    # Check if specific high risks were caught
    risk_descriptions = [r.risk_explanation.lower() for r in result["risk_assessments"]]
    assert any("unlimited" in d or "liability" in d for d in risk_descriptions)
    assert any("payment" in d or "interest" in d or "penalty" in d for d in risk_descriptions)
    
    print(f"Integration test passed with Risk Score: {result['overall_risk_score']}")

if __name__ == "__main__":
    test_full_workflow_integration()
