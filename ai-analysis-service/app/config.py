from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_title: str = "DealGuard AI Analysis Service"
    api_version: str = "1.0.0"
    
    # MongoDB
    mongodb_uri: str
    
    # LLM Settings
    llm_provider: str = "gemini"  # gemini, openrouter, openai
    
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4-turbo-preview"
    
    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    
    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemini-2.0-flash-exp:free"
    # List of user-requested models for easy switching
    openrouter_models: list = [
        "xiaomi/mimo-v2-flash:free",
        "mistralai/devstral-2512:free",
        "z-ai/glm-4.5-air:free",
        "deepseek/deepseek-r1-0528:free",
        "qwen/qwen3-coder:free",
        "tngtech/deepseek-chimera"
    ]

    # LangSmith
    langchain_tracing_v2: bool = False
    langchain_endpoint: str = "https://api.smith.langchain.com"
    langchain_api_key: str = ""
    langchain_project: str = "dealguard"
    
    # Vector DB Scaling
    vector_db_provider: str = "chroma"  # chroma or pinecone
    pinecone_api_key: str = ""
    pinecone_index_name: str = "dealguard"
    pinecone_environment: str = "" # Some older regions need this
    disable_vector_indexing: bool = False # Flag to disable vector indexing on low-RAM envs
    
    # Backend
    backend_api_url: str = "http://localhost:5000"
    
    # Additional AI Providers
    huggingfacehub_api_token: str = ""
    google_api_key: str = ""  # Alternative for Gemini
    
    # Security
    api_secret_key: str = "default-secret-key-change-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"
    
    def __init__(self, **data):
        super().__init__(**data)
        # Validate required fields based on provider
        if not self.mongodb_uri:
            raise ValueError("MONGODB_URI environment variable must be set")
            
        if self.llm_provider == "openai" and not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY must be set when provider is openai")
            
        if self.llm_provider == "gemini":
            if not self.gemini_api_key and not self.google_api_key:
                 raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY must be set when provider is gemini")
            if not self.gemini_api_key and self.google_api_key:
                self.gemini_api_key = self.google_api_key
                
        if self.llm_provider == "openrouter" and not self.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY must be set when provider is openrouter")

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
