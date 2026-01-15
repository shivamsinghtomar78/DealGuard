from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.schemas import (
    ContractAnalysisRequest, 
    ContractAnalysisResponse, 
    RedlineRequest,
    SearchRequest,
    SearchResponse,
    ChatHistoryRequest,
    ChatHistoryResponse
)
from app.workflows.analysis_workflow import ContractAnalysisWorkflow
from app.parsers.pdf_parser import PDFParser, DOCXParser
from app.agents.redlining_agent import RedliningAgent
from app.utils.vector_store import vector_store
from app.tasks import analyze_contract_task
from app.agents.rag_agent import RAGAgent
from fastapi.responses import FileResponse
import os
import time
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables early for LangChain tracing
load_dotenv()

# Explicitly set LangChain environment variables from settings if present
if settings.langchain_tracing_v2:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_ENDPOINT"] = settings.langchain_endpoint
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
    print(f"📡 LangSmith Tracing enabled for project: {settings.langchain_project}")

import os

# Configure LangChain Tracing if keys are present
if settings.langchain_api_key:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_ENDPOINT"] = settings.langchain_endpoint
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load heavy AI agents here, AFTER the server has likely bound to its port
    print("🧠 Initializing AI Agents (lifespan startup)...")
    app.state.workflow = ContractAnalysisWorkflow()
    app.state.redlining_agent = RedliningAgent()
    app.state.rag_agent = RAGAgent()
    print("✅ AI Agents initialized and ready.")
    yield
    # Clean up if needed
    print("👋 Shutting down AI Analysis Service...")

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to get agents from app state
def get_workflow(): return app.state.workflow
def get_redlining_agent(): return app.state.redlining_agent
def get_rag_agent(): return app.state.rag_agent


@app.get("/")
async def root():
    return {
        "service": "DealGuard AI Analysis Service",
        "version": settings.api_version,
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/analyze/upload", response_model=ContractAnalysisResponse)
async def analyze_uploaded_contract(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    contract_id: str = None,
    category: str = "other",
    user_id: str = "test_user",
    webhook_url: str = None
):
    """Upload and analyze a contract file"""
    start_time = time.time()
    
    # Validate file type
    if not file.filename.endswith(('.pdf', '.docx', '.doc')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    # Save file temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
    
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Parse document
        if file.filename.endswith('.pdf'):
            parser = PDFParser(file_path)
        else:
            parser = DOCXParser(file_path)
        
        extracted_data = parser.extract_text()
        contract_text = extracted_data['full_text']
        
        # Index in ChromaDB
        # Moved to background task in Celery worker if possible, 
        # but keeping it here for immediate vector availability if needed or 
        # let Celery handle it. Celery task already handles it.
        
        analysis_id = contract_id or str(uuid.uuid4())
        
        # Trigger Celery task
        task = analyze_contract_task.delay(
            file_path=file_path,
            contract_id=analysis_id,
            category=category,
            user_id=user_id,
            webhook_url=webhook_url
        )
        
        return {
            "task_id": task.id,
            "analysis_id": analysis_id,
            "status": "pending",
            "message": "Analysis started in background"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    # Cleanup moved to Celery task to ensure file availability


@app.post("/analyze/text")
async def analyze_contract_text(request: ContractAnalysisRequest, background_tasks: BackgroundTasks):
    """Analyze contract from provided text or file path"""
    start_time = time.time()
    
    # Handle relative file paths by checking server upload directory
    file_path = request.file_path
    
    # Normalize path separators
    normalized_path = file_path.replace('/', os.sep).replace('\\', os.sep)
    
    # Check if file exists at the given path
    if not os.path.exists(normalized_path):
        # If path contains 'uploads', check in the server's upload directory
        if 'uploads' in normalized_path:
            # Extract just the filename
            filename = os.path.basename(normalized_path)
            # Check in server's upload directory (relative to the parent directory structure)
            possible_server_paths = [
                os.path.join("..", "server", "uploads", filename),
                os.path.join("..", "..", "server", "uploads", filename),
                os.path.join("..", "..", "..", "server", "uploads", filename),
                os.path.join("c:\\Users\\shiva\\Downloads\\project\\DealGuard\\server", "uploads", filename),
            ]
            
            found_path = None
            for server_path in possible_server_paths:
                if os.path.exists(server_path):
                    found_path = server_path
                    break
            
            if found_path:
                file_path = found_path
            else:
                # Also try in the current ai-analysis-service uploads directory
                ai_upload_path = os.path.join("uploads", filename)
                if os.path.exists(ai_upload_path):
                    file_path = ai_upload_path
                else:
                    raise HTTPException(status_code=400, detail=f"File not found: {request.file_path}")
        else:
            raise HTTPException(status_code=400, detail=f"File not found: {request.file_path}")
    else:
        file_path = normalized_path
    
    try:
        # Parse document
        if file_path.endswith('.pdf'):
            parser = PDFParser(file_path)
        elif file_path.endswith(('.docx', '.doc')):
            parser = DOCXParser(file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        extracted_data = parser.extract_text()
        contract_text = extracted_data['full_text']
        
        # Index in Milvus Lite
        background_tasks.add_task(
            vector_store.add_document, 
            contract_text, 
            {"contract_name": os.path.basename(file_path), "category": request.category.value}
        )
        
        # Run workflow (Asynchronous)
        task = analyze_contract_task.delay(
            file_path=file_path,
            contract_id=request.contract_id,
            category=request.category.value,
            user_id=request.user_id,
            webhook_url=request.webhook_url if hasattr(request, 'webhook_url') else None
        )
        
        return {
            "task_id": task.id,
            "analysis_id": request.contract_id,
            "status": "pending",
            "message": "Analysis started in background"
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Text analysis failed: {str(e)}")
        
@app.post("/analyze/redline")
async def redline_contract(request: RedlineRequest):
    """
    Apply an alternative clause to a contract and return the redlined file.
    """
    try:
        # Check if file exists
        file_path = request.file_path
        
        # Similar path resolution as in analyze_contract_text if needed
        if not os.path.exists(file_path):
            filename = os.path.basename(file_path)
            possible_server_paths = [
                os.path.join("..", "server", "uploads", filename),
                os.path.join("..", "..", "server", "uploads", filename),
                os.path.join("c:\\Users\\shiva\\Downloads\\project\\DealGuard\\server", "uploads", filename),
            ]
            for server_path in possible_server_paths:
                if os.path.exists(server_path):
                    file_path = server_path
                    break
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=400, detail=f"File not found: {request.file_path}")

        # Apply redlining
        redlined_path = app.state.redlining_agent.apply_replacement(
            file_path,
            request.original_clause,
            request.alternative_clause
        )
        
        if not redlined_path:
            raise HTTPException(status_code=500, detail="Failed to apply redlining")
            
        return FileResponse(
            path=redlined_path,
            filename=f"redlined_{os.path.basename(file_path)}",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Redlining failed: {str(e)}")

@app.post("/search/semantic", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """Search across contract history for a user"""
    results = vector_store.search(
        query=request.query,
        user_id=request.user_id,
        limit=request.limit,
        category=request.category
    )
    return {"results": results}

@app.post("/chat/history", response_model=ChatHistoryResponse)
async def chat_with_history(request: ChatHistoryRequest):
    """Answer questions based on contract history (RAG)"""
    result = app.state.rag_agent.answer_question(
        query=request.message,
        user_id=request.user_id,
        limit=request.context_limit
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
