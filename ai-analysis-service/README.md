# DealGuard AI Analysis Service

Python FastAPI service for AI-powered contract analysis using LangChain and LangGraph.

## Features

- 🤖 **LangChain Agents**: Specialized agents for different analysis tasks
  - ClauseExtractorAgent: Extract clauses from contracts
  - RiskAnalyzerAgent: Analyze risk levels
  - AlternativeGeneratorAgent: Generate safer alternatives
  - LegalReasonerAgent: Provide legal reasoning

- 🔄 **LangGraph Workflow**: Multi-step orchestrated analysis
  - Extract → Analyze → Generate Alternatives → Legal Reasoning → Score → Summarize

- 📄 **Document Processing**: PDF and DOCX parsing
- 🎯 **Risk Scoring**: 0-10 scale with detailed assessments
- ⚖️ **Legal Analysis**: Case law and statute references

## Setup

### 1. Install Python Dependencies

```bash
cd ai-analysis-service
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file with:
- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: MongoDB connection string

### 3. Run the Service

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Service will be available at `http://localhost:8000`

## API Endpoints

- `POST /analyze/upload`: Upload and analyze contract file
- `POST /analyze/text`: Analyze contract from file path
- `GET /health`: Health check

## Architecture

```
app/
├── agents/          LangChain agents
├── workflows/       LangGraph orchestration
├── parsers/         Document parsing
├── models/          Pydantic schemas
└── main.py          FastAPI application
```
