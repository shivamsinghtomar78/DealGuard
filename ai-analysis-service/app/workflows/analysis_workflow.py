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
    AgentLog
)

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

class ContractAnalysisWorkflow:
    """LangGraph workflow for contract analysis"""
    
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
        workflow.add_node("generate_alternatives", self.generate_alternatives)
        workflow.add_node("legal_reasoning", self.legal_reasoning)
        workflow.add_node("calculate_risk_score", self.calculate_risk_score)
        workflow.add_node("generate_summary", self.generate_summary)
        
        # Define edges with error checking
        workflow.add_edge("extract_clauses", "analyze_risks")
        workflow.add_edge("analyze_risks", "generate_alternatives")
        workflow.add_edge("generate_alternatives", "legal_reasoning")
        workflow.add_edge("legal_reasoning", "calculate_risk_score")
        workflow.add_edge("calculate_risk_score", "generate_summary")
        workflow.add_edge("generate_summary", END)
        
        # Set entry point
        workflow.set_entry_point("extract_clauses")
        
        return workflow.compile()
    
    def extract_clauses(self, state: AnalysisState) -> AnalysisState:
        """Step 1: Extract clauses from contract"""
        try:
            state["agent_logs"].append(AgentLog(agent="Clause Extractor", action="extracting", message="Deconstructing document into structural clauses...", node="extract_clauses"))
            clauses = self.clause_extractor.extract_clauses(state["contract_text"])
            state["clauses"] = clauses
            state["agent_logs"].append(AgentLog(agent="Clause Extractor", action="completed", message=f"Successfully isolated {len(clauses)} legal clauses.", node="extract_clauses", data={"count": len(clauses)}))
            print(f"✅ Extracted {len(clauses)} clauses")
        except Exception as e:
            state["error"] = f"Clause extraction failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def analyze_risks(self, state: AnalysisState) -> AnalysisState:
        """Step 2: Analyze risks in clauses"""
        try:
            state["agent_logs"].append(AgentLog(agent="Risk Analyzer", action="analyzing", message="Evaluating clauses against risk taxonomy...", node="analyze_risks"))
            risk_assessments = self.risk_analyzer.analyze_all_clauses(state["clauses"])
            state["risk_assessments"] = risk_assessments
            state["agent_logs"].append(AgentLog(agent="Risk Analyzer", action="completed", message=f"Detected {len(risk_assessments)} potential risk vectors.", node="analyze_risks", data={"count": len(risk_assessments)}))
            print(f"✅ Identified {len(risk_assessments)} risky clauses")
        except Exception as e:
            state["error"] = f"Risk analysis failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def generate_alternatives(self, state: AnalysisState) -> AnalysisState:
        """Step 3: Generate alternative clauses"""
        try:
            state["agent_logs"].append(AgentLog(agent="Alternative Generator", action="generating", message="Synthesizing protective clause alternatives...", node="generate_alternatives"))
            alternatives = []
            
            for risk in state["risk_assessments"]:
                clause = next((c for c in state["clauses"] if c.clause_id == risk.clause_id), None)
                if clause:
                    alt = self.alternative_generator.generate_alternatives(
                        clause, 
                        risk.risk_level.value
                    )
                    alternatives.append(alt)
                    
                    # Also attach as standard_alternative to the risk assessment for Node.js backend
                    risk.standard_alternative = alt.balanced_standard
            
            state["alternatives"] = alternatives
            state["agent_logs"].append(AgentLog(agent="Alternative Generator", action="completed", message="Alternative synthesis complete.", node="generate_alternatives"))
            print(f"✅ Generated {len(alternatives)} alternative clauses")
        except Exception as e:
            state["error"] = f"Alternative generation failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def legal_reasoning(self, state: AnalysisState) -> AnalysisState:
        """Step 4: Generate legal reasoning"""
        try:
            state["agent_logs"].append(AgentLog(agent="Legal Reasoner", action="reasoning", message="Mapping jurisdictional principles and enforceability...", node="legal_reasoning"))
            reasoning_list = []
            
            for risk in state["risk_assessments"]:
                clause = next((c for c in state["clauses"] if c.clause_id == risk.clause_id), None)
                if clause:
                    reasoning = self.legal_reasoner.generate_legal_reasoning(
                        clause,
                        risk.risk_explanation
                    )
                    reasoning_list.append(reasoning)
                    
                    # Also attach as summary to the risk assessment for standard export
                    risk.legal_reasoning = f"Principles: {', '.join(reasoning.legal_principles[:3])}. " \
                                         f"Enforceability: {reasoning.enforceability_assessment}. " \
                                         f"Position: {reasoning.recommended_position}"
            
            state["legal_reasoning"] = reasoning_list
            state["agent_logs"].append(AgentLog(agent="Legal Reasoner", action="completed", message="Jurisprudence mapping complete.", node="legal_reasoning"))
            print(f"✅ Generated legal reasoning for {len(reasoning_list)} clauses and attached to risk assessments")
        except Exception as e:
            state["error"] = f"Legal reasoning failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def calculate_risk_score(self, state: AnalysisState) -> AnalysisState:
        """Step 5: Calculate overall risk score"""
        try:
            print("📊 Calculating risk score...")
            
            risk_weights = {
                "critical": 10,
                "high": 7,
                "medium": 4,
                "low": 1
            }
            
            total_weight = 0
            count = 0
            
            for risk in state["risk_assessments"]:
                weight = risk_weights.get(risk.risk_level.value, 4)
                total_weight += weight
                count += 1
            
            if count > 0:
                avg_score = total_weight / count
            else:
                avg_score = 0
            
            state["overall_risk_score"] = round(avg_score, 2)
            print(f"✅ Overall risk score: {state['overall_risk_score']}/10")
        except Exception as e:
            state["error"] = f"Risk score calculation failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def generate_summary(self, state: AnalysisState) -> AnalysisState:
        """Step 6: Generate executive summary"""
        try:
            print("📋 Generating elaborated executive summary...")
            
            state["executive_summary"] = self.summarizer.generate_summary(
                state["risk_assessments"], 
                state["overall_risk_score"]
            )
            state["recommendations"] = self._generate_recommendations(state)
            print("✅ Strategic summary generated")
        except Exception as e:
            state["error"] = f"Summary generation failed: {str(e)}"
            print(f"❌ Error: {state['error']}")
        
        return state
    
    def _format_top_concerns(self, top_risks: List[RiskAssessment]) -> str:
        """Format top risk concerns"""
        concerns = []
        for i, risk in enumerate(top_risks, 1):
            concerns.append(f"{i}. {risk.clause_text[:100]}... ({risk.risk_level.value} risk)")
        return "\n".join(concerns) if concerns else "None identified"
    
    def _generate_recommendations(self, state: AnalysisState) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        for risk in state["risk_assessments"]:
            if risk.risk_level.value in ["critical", "high"]:
                recommendations.append(
                    f"MUST FIX: {risk.risk_explanation[:150]}..."
                )
        
        return recommendations[:5]
    
    def run(self, contract_text: str, contract_id: str, category: str) -> AnalysisState:
        """Execute the complete workflow"""
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
            "engine_version": "2.1.0-Elite",
            "recommendations": [],
            "agent_logs": [AgentLog(agent="System", action="start", message="Initializing Neural Engine...", node="start")],
            "error": ""
        }
        
        try:
            print("\n🚀 Starting Contract Analysis Workflow\n")
            result = self.workflow.invoke(initial_state)
            
            if result.get("error"):
                print(f"\n❌ Workflow failed: {result['error']}\n")
            else:
                print("\n✅ Workflow Complete!\n")
            
            return result
        except Exception as e:
            print(f"\n❌ Workflow execution error: {str(e)}\n")
            initial_state["error"] = f"Workflow execution failed: {str(e)}"
            return initial_state
