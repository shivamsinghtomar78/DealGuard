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
    print(f"\n{'='*50}")
    print(f"📋 TASKS.PY: process_contract_analysis started")
    print(f"   Contract ID: {contract_id}")
    print(f"   Webhook URL: {webhook_url}")
    print(f"{'='*50}\n")
    
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
        
        # Step 2: Vector store indexing - OPTIONAL (skip on failure or if disabled)
        # This is non-critical for the main analysis flow
        try:
            from app.config import settings
            if settings.disable_vector_indexing:
                print(f"⏩ Vector store indexing disabled via config")
            else:
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
            category=category,
            webhook_url=webhook_url
        )
        
        # Cleanup temporary file if it was in temp_uploads
        if "temp_uploads" in file_path and os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️ Cleaned up temp file")
            
        print(f"✅ TASKS.PY: Background task completed successfully for {contract_id}")
        return result
        
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Emergency status update in case of fatal error before/during workflow
        try:
            print("🔄 Attempting emergency MongoDB update for failure status...")
            from pymongo import MongoClient
            from bson import ObjectId
            from app.config import settings
            from datetime import datetime
            
            client = MongoClient(settings.mongodb_uri)
            db = client.get_default_database()
            
            db.analyses.update_one(
                {"_id": ObjectId(contract_id)},
                {"$set": {
                    "status": "failed",
                    "error": str(e),
                    "completedAt": datetime.utcnow()
                }}
            )
            print(f"✅ Saved failure status for {contract_id}")
            client.close()
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
