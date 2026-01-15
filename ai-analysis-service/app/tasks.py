import os
import httpx
import json
import time
import uuid
from app.celery_app import celery_app
from app.workflows.analysis_workflow import ContractAnalysisWorkflow
from app.parsers.pdf_parser import PDFParser, DOCXParser
from app.utils.vector_store import vector_store

def process_contract_analysis(file_path, contract_id, category, user_id, webhook_url=None):
    """
    Core logic for contract analysis, decoupled from Celery for flexible execution.
    """
    start_time = time.time()
    workflow = ContractAnalysisWorkflow()
    
    try:
        # Determine parser
        if file_path.endswith('.pdf'):
            parser = PDFParser(file_path)
        else:
            parser = DOCXParser(file_path)
            
        extracted_data = parser.extract_text()
        contract_text = extracted_data['full_text']
        
        # Index in Vector Store (sync here)
        vector_store.add_document(
            contract_text, 
            {
                "contract_name": os.path.basename(file_path), 
                "category": category,
                "user_id": user_id,
                "analysis_id": contract_id
            }
        )
        
        # Run workflow
        result = workflow.run(
            contract_text=contract_text,
            contract_id=contract_id,
            category=category
        )
        
        processing_time = time.time() - start_time
        
        # Prepare result payload
        payload = {
            "contract_id": contract_id,
            "status": "completed",
            "overall_risk_score": result["overall_risk_score"],
            "executive_summary": result["executive_summary"],
            "risk_assessments": [
                {
                    "clause_id": ra.clause_id,
                    "clause_text": ra.clause_text,
                    "risk_level": ra.risk_level.value if hasattr(ra.risk_level, 'value') else ra.risk_level,
                    "risk_explanation": ra.risk_explanation,
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
                with httpx.Client() as client:
                    response = client.post(webhook_url, json=payload, timeout=30.0)
                    response.raise_for_status()
                    print(f"✅ WebHook sent to {webhook_url}, status: {response.status_code}")
            except Exception as hw_e:
                print(f"❌ Failed to send WebHook: {str(hw_e)}")
                # We don't want to fail the task if webhook fails, but we want to log it
        
        # Cleanup temporary file if it was in temp_uploads
        if "temp_uploads" in file_path and os.path.exists(file_path):
            os.remove(file_path)
            
        return payload
        
    except Exception as e:
        error_payload = {
            "contract_id": contract_id,
            "status": "failed",
            "error": str(e)
        }
        if webhook_url:
            try:
                with httpx.Client() as client:
                    client.post(webhook_url, json=error_payload, timeout=30.0)
            except:
                pass
        
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

