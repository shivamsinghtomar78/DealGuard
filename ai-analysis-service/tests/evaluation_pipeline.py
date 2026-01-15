import os
import sys
import time
import json
from datetime import datetime
from typing import List, Dict

# Add the app directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.workflows.analysis_workflow import ContractAnalysisWorkflow
from app.models.schemas import RiskAssessment, AlternativeClause

class DealGuardEvaluator:
    def __init__(self):
        self.workflow = ContractAnalysisWorkflow()
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "evaluations": [],
            "summary_metrics": {}
        }

    def run_evaluation(self, test_name: str, contract_text: str):
        print(f"🚀 Running Evaluation: {test_name}...")
        start_time = time.time()
        
        result = self.workflow.run(
            contract_text=contract_text,
            contract_id=f"eval_{int(start_time)}",
            category="other"
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        eval_data = {
            "test_name": test_name,
            "duration": duration,
            "error": result.get("error", ""),
            "risk_score": result.get("overall_risk_score", 0),
            "clauses_found": len(result.get("clauses", [])),
            "risks_identified": len(result.get("risk_assessments", [])),
            "alternatives_generated": len(result.get("alternatives", [])),
            "summary_length": len(result.get("executive_summary", "")),
        }
        
        # Output evaluation (Self-correction check)
        self._evaluate_output_quality(result, eval_data)
        
        self.results["evaluations"].append(eval_data)
        return eval_data

    def _evaluate_output_quality(self, result: Dict, eval_data: Dict):
        """Mental Model: Output Evaluation (a)"""
        risks = result.get("risk_assessments", [])
        alts = result.get("alternatives", [])
        
        # Metric: Risk Alignment
        # Check if high risks have detailed explanations
        high_risks = [r for r in risks if r.risk_level.value in ["high", "critical"]]
        eval_data["high_risk_detail_score"] = sum(len(r.risk_explanation) > 100 for r in high_risks) / len(high_risks) if high_risks else 1.0
        
        # Metric: Alternative Relevance
        # Check if every risk has a corresponding alternative
        eval_data["alternative_coverage"] = len(alts) / len(risks) if risks else 1.0
        
        # Metric: Professional Tone (Simple heuristic)
        summary = result.get("executive_summary", "")
        keywords = ["liability", "risk", "mitigation", "recommendation", "exposure"]
        tone_score = sum(1 for k in keywords if k in summary.lower()) / len(keywords)
        eval_data["tone_professionalism_score"] = tone_score

    def generate_report_data(self):
        """Prepare data for the result (c) and model evaluation (d)"""
        total_tests = len(self.results["evaluations"])
        if total_tests == 0: return
        
        self.results["summary_metrics"] = {
            "avg_duration": sum(e["duration"] for e in self.results["evaluations"]) / total_tests,
            "avg_risk_score": sum(e["risk_score"] for e in self.results["evaluations"]) / total_tests,
            "avg_clauses": sum(e["clauses_found"] for e in self.results["evaluations"]) / total_tests,
            "avg_risks": sum(e["risks_identified"] for e in self.results["evaluations"]) / total_tests,
            "avg_alternative_coverage": sum(e["alternative_coverage"] for e in self.results["evaluations"]) / total_tests,
        }
        
        # Save results to JSON for final report generation
        with open("evaluation_results.json", "w") as f:
            json.dump(self.results, f, indent=2)
        print("✅ Evaluation results saved to evaluation_results.json")

if __name__ == "__main__":
    evaluator = DealGuardEvaluator()
    
    # Test Case 1: Standard Service Agreement
    evaluator.run_evaluation("Standard Service Agreement", """
    This Agreement is made as of Jan 1, 2026.
    Section 1. Services. Vendor will provide IT support.
    Section 2. Fees. Client pays $500/hour. Late fees of 50% apply.
    Section 3. Liability. Vendor is not liable for anything.
    Section 4. Termination. Either party can quit with 1 second notice.
    """)
    
    # Test Case 2: Complex Partnership Agreement
    evaluator.run_evaluation("Complex Partnership", """
    PARTNERSHIP AGREEMENT
    Partners will share profits and losses 50/50.
    In case of dispute, partners will fight it out in the arena.
    No partner can sell their share without the blood oath of others.
    Intellectual Property belongs to the first person who yells 'DIBS'.
    """)
    
    evaluator.generate_report_data()
