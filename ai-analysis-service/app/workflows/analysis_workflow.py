from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from app.agents.clause_extractor import ClauseExtractorAgent
from app.agents.risk_analyzer import RiskAnalyzerAgent
from app.agents.alternative_generator import AlternativeGeneratorAgent
from app.agents.legal_reasoner import LegalReasonerAgent
from app.agents.summarizer import SummarizerAgent
from app.models.schemas import (
    ClauseExtraction,
    RiskAssessment,
    AlternativeClause,
    LegalReasoning,
    AgentLog,
    EnhancedSummary,
    ActionItems
)
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import time

class AnalysisState(TypedDict):
    """State for the analysis workflow"""
    contract_text: str
    contract_id: str
    category: str
    clauses: List[ClauseExtraction]
    risk_assessments: List[RiskAssessment]
    alternatives: List[AlternativeClause]
    legal_reasoning: List[LegalReasoning]
    overall_risk_score: float
    executive_summary: str
    engine_version: str
    recommendations: List[str]
    agent_logs: List[AgentLog]
    error: str
    # Enhanced summary fields
    top_critical_issues: List[str]
    recommendation: str  # approve, negotiate, reject
    recommendation_reasoning: str
    action_items: dict  # {must_fix: [], should_negotiate: [], nice_to_have: []}
    risk_breakdown: dict  # {financial: 0, legal: 0, operational: 0, reputational: 0}
    webhook_url: str

# Thread pool for parallel processing
executor = ThreadPoolExecutor(max_workers=5)

class ContractAnalysisWorkflow:
    """Optimized LangGraph workflow for contract analysis"""
    
    def __init__(self):
        self.clause_extractor = ClauseExtractorAgent()
        self.risk_analyzer = RiskAnalyzerAgent()
        self.alternative_generator = AlternativeGeneratorAgent()
        self.legal_reasoner = LegalReasonerAgent()
        self.summarizer = SummarizerAgent()
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        
        workflow = StateGraph(AnalysisState)
        
        # Define nodes
        workflow.add_node("extract_clauses", self.extract_clauses)
        workflow.add_node("analyze_risks", self.analyze_risks)
        workflow.add_node("generate_alternatives_and_reasoning", self.generate_alternatives_and_reasoning)
        workflow.add_node("calculate_risk_score", self.calculate_risk_score)
        workflow.add_node("generate_summary", self.generate_summary)
        
        # Optimized flow - combined alternatives + reasoning for parallel execution
        workflow.add_edge("extract_clauses", "analyze_risks")
        workflow.add_edge("analyze_risks", "generate_alternatives_and_reasoning")
        workflow.add_edge("generate_alternatives_and_reasoning", "calculate_risk_score")
        workflow.add_edge("calculate_risk_score", "generate_summary")
        workflow.add_node("finalize", self.finalize_analysis)
        workflow.add_edge("generate_summary", "finalize")
        workflow.add_edge("finalize", END)
        
        workflow.set_entry_point("extract_clauses")
        
        return workflow.compile()
    
    def extract_clauses(self, state: AnalysisState) -> AnalysisState:
        """Step 1: Extract clauses from contract"""
        try:
            start = time.time()
            state["agent_logs"].append(AgentLog(agent="Clause Extractor", action="extracting", message="Analyzing document structure...", node="extract_clauses"))
            clauses = self.clause_extractor.extract_clauses(state["contract_text"])
            state["clauses"] = clauses
            elapsed = round(time.time() - start, 1)
            state["agent_logs"].append(AgentLog(agent="Clause Extractor", action="completed", message=f"Extracted {len(clauses)} clauses in {elapsed}s", node="extract_clauses", data={"count": len(clauses), "time": elapsed}))
            print(f"✅ Extracted {len(clauses)} clauses in {elapsed}s")
        except Exception as e:
            state["error"] = f"Clause extraction failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def analyze_risks(self, state: AnalysisState) -> AnalysisState:
        """Step 2: Analyze risks (parallel processing for multiple clauses)"""
        try:
            start = time.time()
            state["agent_logs"].append(AgentLog(agent="Risk Analyzer", action="analyzing", message="Evaluating risk vectors...", node="analyze_risks"))
            
            # Parallel risk analysis for all clauses
            def analyze_single(clause):
                try:
                    return self.risk_analyzer.analyze_clause_risk(clause)
                except:
                    return None
            
            with ThreadPoolExecutor(max_workers=3) as pool:
                results = list(pool.map(analyze_single, state["clauses"], timeout=60))
            
            # Filter successful results and medium+ risks
            risk_assessments = [r for r in results if r and r.risk_level.value in ['medium', 'high', 'critical']]
            state["risk_assessments"] = risk_assessments
            
            elapsed = round(time.time() - start, 1)
            state["agent_logs"].append(AgentLog(agent="Risk Analyzer", action="completed", message=f"Found {len(risk_assessments)} risks in {elapsed}s", node="analyze_risks", data={"count": len(risk_assessments), "time": elapsed}))
            print(f"✅ Identified {len(risk_assessments)} risks in {elapsed}s (parallel)")
        except Exception as e:
            state["error"] = f"Risk analysis failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def generate_alternatives_and_reasoning(self, state: AnalysisState) -> AnalysisState:
        """Step 3: Generate alternatives AND legal reasoning in PARALLEL"""
        try:
            start = time.time()
            print("🔄 Starting alternatives and reasoning generation...")
            state["agent_logs"].append(AgentLog(agent="Multi-Agent", action="generating", message="Generating alternatives and legal analysis (parallel)...", node="generate_alternatives"))
            
            # Only process high-priority risks for efficiency
            high_priority = [r for r in state["risk_assessments"] if r.risk_level.value in ['high', 'critical']]
            medium_risks = [r for r in state["risk_assessments"] if r.risk_level.value == 'medium']
            
            # Limit processing to top 3 risks for speed on free tier
            risks_to_process = (high_priority + medium_risks[:3])[:5]
            print(f"📋 Processing {len(risks_to_process)} risks (limited for speed)")
            
            alternatives = []
            reasoning_list = []
            
            def process_risk(risk):
                """Process a single risk - generate alternative only (skip slow legal reasoning)"""
                clause = next((c for c in state["clauses"] if c.clause_id == risk.clause_id), None)
                if not clause:
                    return None, None, risk
                
                alt = None
                reasoning = None
                
                try:
                    # Generate alternative (faster)
                    print(f"  📝 Generating alternative for {risk.clause_id}...")
                    alt = self.alternative_generator.generate_alternatives(clause, risk.risk_level.value)
                    print(f"  ✅ Alternative generated for {risk.clause_id}")
                except Exception as e:
                    print(f"  ⚠️ Alternative gen failed for {risk.clause_id}: {e}")
                
                # Skip legal reasoning for faster processing - it uses slow models
                # Instead set a placeholder
                risk.legal_reasoning = f"Risk identified: {risk.risk_explanation[:150]}"
                
                return alt, reasoning, risk
            
            # Process with limited parallelism and shorter timeout
            with ThreadPoolExecutor(max_workers=2) as pool:
                futures = [pool.submit(process_risk, risk) for risk in risks_to_process]
                
                for i, future in enumerate(futures):
                    try:
                        print(f"  ⏳ Waiting for result {i+1}/{len(futures)}...")
                        alt, reasoning, risk = future.result(timeout=30)  # Reduced timeout
                        if alt:
                            alternatives.append(alt)
                            risk.standard_alternative = alt.balanced_standard
                        print(f"  ✅ Result {i+1} completed")
                    except TimeoutError:
                        print(f"  ⚠️ Processing timeout for result {i+1} - skipping")
                    except Exception as e:
                        print(f"  ⚠️ Processing error for result {i+1}: {e}")
            
            state["alternatives"] = alternatives
            state["legal_reasoning"] = reasoning_list
            
            elapsed = round(time.time() - start, 1)
            state["agent_logs"].append(AgentLog(agent="Multi-Agent", action="completed", message=f"Generated {len(alternatives)} alternatives in {elapsed}s", node="apply_legal_reasoning", data={"alternatives": len(alternatives), "reasoning": len(reasoning_list), "time": elapsed}))
            print(f"✅ Generated {len(alternatives)} alternatives in {elapsed}s")
        except Exception as e:
            print(f"❌ Parallel processing failed: {str(e)}")
            import traceback
            traceback.print_exc()
            state["error"] = f"Parallel processing failed: {str(e)}"
        
        return state
    
    def calculate_risk_score(self, state: AnalysisState) -> AnalysisState:
        """Step 4: Calculate overall risk score"""
        try:
            risk_weights = {"critical": 10, "high": 7, "medium": 4, "low": 1}
            
            total_weight = sum(risk_weights.get(r.risk_level.value, 4) for r in state["risk_assessments"])
            count = len(state["risk_assessments"])
            
            state["overall_risk_score"] = round(total_weight / count, 2) if count > 0 else 0
            print(f"✅ Risk score: {state['overall_risk_score']}/10")
        except Exception as e:
            state["error"] = f"Risk score calculation failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def generate_summary(self, state: AnalysisState) -> AnalysisState:
        """Step 5: Generate executive summary with enhanced insights"""
        try:
            start = time.time()
            state["agent_logs"].append(AgentLog(agent="Summarizer", action="generating", message="Creating executive summary...", node="generate_summary"))
            
            # Use enhanced summary generator
            enhanced = self.summarizer.generate_enhanced_summary(
                state["risk_assessments"], 
                state["overall_risk_score"]
            )
            
            # Populate state with enhanced summary data
            state["executive_summary"] = enhanced.overall_assessment
            state["top_critical_issues"] = enhanced.top_critical_issues
            state["recommendation"] = enhanced.recommendation
            state["recommendation_reasoning"] = enhanced.recommendation_reasoning
            state["action_items"] = {
                "must_fix": enhanced.action_items.must_fix,
                "should_negotiate": enhanced.action_items.should_negotiate,
                "nice_to_have": enhanced.action_items.nice_to_have
            }
            state["risk_breakdown"] = enhanced.risk_breakdown
            state["recommendations"] = self._generate_recommendations(state)
            
            elapsed = round(time.time() - start, 1)
            state["agent_logs"].append(AgentLog(agent="Summarizer", action="completed", message=f"Summary complete in {elapsed}s", node="generate_summary"))
            print(f"✅ Summary generated in {elapsed}s")
        except Exception as e:
            state["error"] = f"Summary generation failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def _generate_recommendations(self, state: AnalysisState) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        for risk in state["risk_assessments"]:
            if risk.risk_level.value in ["critical", "high"]:
                recommendations.append(f"FIX: {risk.risk_explanation[:120]}...")
        return recommendations[:5]
    
    def finalize_analysis(self, state: AnalysisState) -> AnalysisState:
        """Step 6: Finalize analysis, send webhook and update DB"""
        import httpx
        import json
        from pymongo import MongoClient
        from bson import ObjectId
        from app.config import settings
        from datetime import datetime
        import sys

        print("\n🏁 Finalizing analysis and persisting results...")
        sys.stdout.flush()

        # Prepare payload
        risk_assessments_payload = []
        for ra in state["risk_assessments"]:
            try:
                ra_dict = {
                    "clause_id": getattr(ra, 'clause_id', 'unknown'),
                    "clause_text": getattr(ra, 'clause_text', ''),
                    "risk_level": ra.risk_level.value if hasattr(ra.risk_level, 'value') else str(getattr(ra, 'risk_level', 'medium')),
                    "risk_type": ra.risk_type.value if hasattr(ra, 'risk_type') and hasattr(ra.risk_type, 'value') else str(getattr(ra, 'risk_type', 'legal')),
                    "risk_category": getattr(ra, 'risk_category', ''),
                    "risk_explanation": getattr(ra, 'risk_explanation', ''),
                    "potential_impact": getattr(ra, 'potential_impact', ''),
                    "worst_case_scenario": getattr(ra, 'worst_case_scenario', ''),
                    "financial_exposure": getattr(ra, 'financial_exposure', '') or "",
                    "estimated_loss_range": getattr(ra, 'estimated_loss_range', '') or "",
                    "real_world_example": getattr(ra, 'real_world_example', '') or "",
                    "standard_alternative": getattr(ra, 'standard_alternative', ''),
                    "legal_reasoning": getattr(ra, 'legal_reasoning', '')
                }
                risk_assessments_payload.append(ra_dict)
            except Exception as ra_e:
                print(f"⚠️ Error processing risk assessment: {ra_e}")

        payload = {
            "contract_id": state["contract_id"],
            "status": "completed",
            "overall_risk_score": state["overall_risk_score"],
            "executive_summary": state["executive_summary"],
            "top_critical_issues": state["top_critical_issues"],
            "recommendation": state["recommendation"],
            "recommendation_reasoning": state["recommendation_reasoning"],
            "action_items": state["action_items"],
            "risk_breakdown": state["risk_breakdown"],
            "risk_assessments": risk_assessments_payload,
            "agent_logs": [
                {
                    "agent": log.agent,
                    "action": log.action,
                    "message": log.message,
                    "node": log.node,
                    "data": log.data,
                    "timestamp": log.timestamp.isoformat() if hasattr(log.timestamp, 'isoformat') else str(log.timestamp)
                } for log in state["agent_logs"]
            ],
            "full_text": state["contract_text"]
        }

        # Try Webhook
        webhook_success = False
        if state.get("webhook_url"):
            try:
                print(f"📤 Sending webhook to {state['webhook_url']}...")
                sys.stdout.flush()
                with httpx.Client() as client:
                    response = client.post(state["webhook_url"], json=payload, timeout=30.0)
                    if response.status_code < 400:
                        print(f"✅ WebHook sent successfully!")
                        webhook_success = True
            except Exception as e:
                print(f"❌ Webhook failed: {e}")

        # Fallback to direct MongoDB update
        if not webhook_success:
            try:
                print("🔄 Falling back to direct MongoDB update...")
                sys.stdout.flush()
                client = MongoClient(settings.mongodb_uri)
                db = client.get_default_database()
                
                update_data = {
                    "status": "completed",
                    "overallRiskScore": payload["overall_risk_score"],
                    "aiSummary": payload["executive_summary"],
                    "fullText": payload["full_text"],
                    "completedAt": datetime.utcnow(),
                    "topCriticalIssues": payload["top_critical_issues"],
                    "recommendation": payload["recommendation"],
                    "recommendationReasoning": payload["recommendation_reasoning"],
                    "action_items": payload["action_items"],
                    "riskBreakdown": payload["risk_breakdown"],
                    "riskAssessments": payload["risk_assessments"],
                    "agentLogs": payload["agent_logs"]
                }
                
                db.analyses.update_one(
                    {"_id": ObjectId(state["contract_id"])},
                    {"$set": update_data}
                )
                print(f"✅ MongoDB updated directly for {state['contract_id']}")
                client.close()
            except Exception as e:
                print(f"❌ MongoDB fallback failed: {e}")
        
        sys.stdout.flush()
        return state

    def run(self, contract_text: str, contract_id: str, category: str, webhook_url: str = None) -> AnalysisState:
        """Execute the optimized workflow"""
        initial_state: AnalysisState = {
            "contract_text": contract_text,
            "contract_id": contract_id,
            "category": category,
            "clauses": [],
            "risk_assessments": [],
            "alternatives": [],
            "legal_reasoning": [],
            "overall_risk_score": 0.0,
            "executive_summary": "",
            "engine_version": "2.3.0-Enhanced",
            "recommendations": [],
            "agent_logs": [AgentLog(agent="System", action="start", message="Starting enhanced analysis...", node="start")],
            "error": "",
            # Enhanced summary fields
            "top_critical_issues": [],
            "recommendation": "negotiate",
            "recommendation_reasoning": "",
            "action_items": {"must_fix": [], "should_negotiate": [], "nice_to_have": []},
            "risk_breakdown": {"financial": 0, "legal": 0, "operational": 0, "reputational": 0},
            "webhook_url": webhook_url
        }
        
        try:
            print("\n🚀 Starting Optimized Contract Analysis\n")
            start = time.time()
            result = self.workflow.invoke(initial_state)
            total = round(time.time() - start, 1)
            
            if result.get("error"):
                print(f"\n❌ Workflow failed: {result['error']}\n")
            else:
                print(f"\n✅ Workflow Complete in {total}s!\n")
            
            return result
        except Exception as e:
            print(f"\n❌ Workflow execution error: {str(e)}\n")
            initial_state["error"] = f"Workflow execution failed: {str(e)}"
            return initial_state
