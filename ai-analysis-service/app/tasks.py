import os
import httpx
import json
import time
import uuid
from app.celery_app import celery_app
from app.workflows.analysis_workflow import ContractAnalysisWorkflow
from app.parsers.pdf_parser import PDFParser, DOCXParser

def send_progress_update(webhook_url: str, contract_id: str, status: str, agent_logs: list = None, progress: int = 0):
    """Send a progress update webhook to keep frontend updated"""
    if not webhook_url:
        return
    
    try:
        payload = {
            "contract_id": contract_id,
            "status": status,  # 'analyzing' during progress, 'completed' at end
            "progress": progress,
            "agent_logs": [
                {
                    "agent": log.agent,
                    "action": log.action,
                    "message": log.message,
                    "node": log.node,
                    "data": log.data,
                    "timestamp": log.timestamp.isoformat() if hasattr(log.timestamp, 'isoformat') else str(log.timestamp)
                } for log in (agent_logs or [])
            ]
        }
        with httpx.Client() as client:
            response = client.post(webhook_url, json=payload, timeout=10.0)
            print(f"📡 Progress update sent: {progress}% - status {response.status_code}")
    except Exception as e:
        print(f"⚠️ Progress update failed: {e}")

def process_contract_analysis(file_path, contract_id, category, user_id, webhook_url=None):
    """
    Core logic for contract analysis, decoupled from Celery for flexible execution.
    Now with progress updates that keep the frontend informed.
    """
    start_time = time.time()
    workflow = ContractAnalysisWorkflow()
    
    try:
        # Step 1: Parse document
        print(f"📄 Parsing document: {file_path}")
        if file_path.endswith('.pdf'):
            parser = PDFParser(file_path)
        else:
            parser = DOCXParser(file_path)
            
        extracted_data = parser.extract_text()
        contract_text = extracted_data['full_text']
        print(f"✅ Extracted {len(contract_text)} characters")
        
        # Step 2: Vector store indexing - OPTIONAL (skip on failure)
        # This is non-critical for the main analysis flow
        try:
            print(f"🔍 Attempting vector store indexing (optional)...")
            # Import lazily to avoid loading issues
            from app.utils.vector_store import vector_store
            vector_store.add_document(
                contract_text, 
                {
                    "contract_name": os.path.basename(file_path), 
                    "category": category,
                    "user_id": user_id,
                    "analysis_id": contract_id
                }
            )
            print(f"✅ Vector store indexed")
        except Exception as vs_error:
            # Vector store is optional - don't block analysis
            print(f"⚠️ Vector store skipped (non-critical): {str(vs_error)[:100]}")
        
        # Step 3: Run workflow (this is the main analysis)
        print(f"🧠 Starting AI analysis workflow...")
        result = workflow.run(
            contract_text=contract_text,
            contract_id=contract_id,
            category=category
        )
        
        processing_time = time.time() - start_time
        print(f"✅ Workflow completed in {processing_time:.1f}s")
        
        # Check for workflow errors
        if result.get("error"):
            raise Exception(result["error"])
        
        # Prepare result payload with enhanced fields
        payload = {
            "contract_id": contract_id,
            "status": "completed",
            "overall_risk_score": result["overall_risk_score"],
            "executive_summary": result["executive_summary"],
            # Enhanced summary fields
            "top_critical_issues": result.get("top_critical_issues", []),
            "recommendation": result.get("recommendation", "negotiate"),
            "recommendation_reasoning": result.get("recommendation_reasoning", ""),
            "action_items": result.get("action_items", {}),
            "risk_breakdown": result.get("risk_breakdown", {}),
            # Risk assessments with enhanced fields
            "risk_assessments": [
                {
                    "clause_id": ra.clause_id,
                    "clause_text": ra.clause_text,
                    "risk_level": ra.risk_level.value if hasattr(ra.risk_level, 'value') else ra.risk_level,
                    "risk_type": ra.risk_type.value if hasattr(ra.risk_type, 'value') else getattr(ra, 'risk_type', 'legal'),
                    "risk_category": ra.risk_category,
                    "risk_explanation": ra.risk_explanation,
                    "potential_impact": ra.potential_impact,
                    "worst_case_scenario": ra.worst_case_scenario,
                    "financial_exposure": ra.financial_exposure or "",
                    "estimated_loss_range": getattr(ra, 'estimated_loss_range', '') or "",
                    "real_world_example": getattr(ra, 'real_world_example', '') or "",
                    "standard_alternative": ra.standard_alternative,
                    "legal_reasoning": ra.legal_reasoning
                } for ra in result["risk_assessments"]
            ],
            "agent_logs": [
                {
                    "agent": log.agent,
                    "action": log.action,
                    "message": log.message,
                    "node": log.node,
                    "data": log.data,
                    "timestamp": log.timestamp.isoformat() if hasattr(log.timestamp, 'isoformat') else str(log.timestamp)
                } for log in result.get("agent_logs", [])
            ],
            "full_text": contract_text,
            "processing_time": processing_time
        }
        
        # Send WebHook notification if URL provided
        if webhook_url:
            try:
                print(f"📤 Sending completion webhook to {webhook_url}")
                with httpx.Client() as client:
                    response = client.post(webhook_url, json=payload, timeout=30.0)
                    response.raise_for_status()
                    print(f"✅ WebHook sent successfully, status: {response.status_code}")
            except Exception as hw_e:
                print(f"❌ Failed to send WebHook: {str(hw_e)}")
                # Log full error for debugging
                import traceback
                traceback.print_exc()
        
        # Cleanup temporary file if it was in temp_uploads
        if "temp_uploads" in file_path and os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️ Cleaned up temp file")
            
        return payload
        
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        import traceback
        traceback.print_exc()
        
        error_payload = {
            "contract_id": contract_id,
            "status": "failed",
            "error": str(e)
        }
        if webhook_url:
            try:
                print(f"📤 Sending error webhook to {webhook_url}")
                with httpx.Client() as client:
                    response = client.post(webhook_url, json=error_payload, timeout=30.0)
                    print(f"✅ Error webhook sent, status: {response.status_code}")
            except Exception as hw_e:
                print(f"❌ Failed to send error webhook: {str(hw_e)}")
        
        # Cleanup on failure
        if "temp_uploads" in file_path and os.path.exists(file_path):
            os.remove(file_path)
            
        raise e

@celery_app.task(bind=True, name="app.tasks.analyze_contract_task")
def analyze_contract_task(self, file_path, contract_id, category, user_id, webhook_url=None):
    """
    Celery wrapper for contract analysis.
    """
    return process_contract_analysis(file_path, contract_id, category, user_id, webhook_url)
