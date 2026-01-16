from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings

# Request timeout in seconds (important for deployment)
REQUEST_TIMEOUT = 45

# Task-specific model assignments for concurrent processing
# Each agent type uses a different model for parallel execution
TASK_MODEL_ROUTING = {
    # Fast extraction tasks - use fastest model
    "clause_extraction": "xiaomi/mimo-v2-flash:free",       # 1.8s - FASTEST
    
    # Analysis tasks - use reliable models
    "risk_analysis": "mistralai/devstral-2512:free",        # 2.5s - Good accuracy
    "alternative_generation": "qwen/qwen3-coder:free",      # 2.0s - Good for generation
    
    # Deep reasoning tasks - use smarter models  
    "legal_reasoning": "deepseek/deepseek-r1-0528:free",    # 20.4s - Most intelligent
    "risk_scoring": "z-ai/glm-4.5-air:free",                # 10.0s - Solid accuracy
    
    # Summarization - use fast model
    "summary": "xiaomi/mimo-v2-flash:free",                 # 1.8s - Fast
    
    # Default fallback
    "default": "xiaomi/mimo-v2-flash:free"
}

# Fallback chain order (fastest to slowest, most reliable)
FALLBACK_MODELS = [
    "xiaomi/mimo-v2-flash:free",       # Primary - fastest
    "mistralai/devstral-2512:free",    # Fallback 1 - reliable
    "qwen/qwen3-coder:free",           # Fallback 2 - good
    "z-ai/glm-4.5-air:free",           # Fallback 3 - slower but solid
]


def get_llm(temperature=0.1, model=None, task_type=None):
    """
    Factory function to get a reliable LLM with automatic fallbacks.
    
    Args:
        temperature: LLM temperature setting
        model: Override specific model
        task_type: Task type for smart routing (clause_extraction, risk_analysis, etc.)
    
    Priority:
    1. Explicit model parameter
    2. Task-specific model routing
    3. Primary provider (Gemini/OpenRouter)
    4. Fallback chain
    """
    primary_provider = settings.llm_provider.lower()
    llms = []
    
    # Determine model to use
    if model:
        selected_model = model
    elif task_type and task_type in TASK_MODEL_ROUTING:
        selected_model = TASK_MODEL_ROUTING[task_type]
        print(f"🎯 Task '{task_type}' routed to model: {selected_model}")
    else:
        selected_model = None

    # 1. If we have a selected OpenRouter model, use it as primary
    if selected_model and settings.openrouter_api_key:
        llms.append(ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
            model=selected_model,
            temperature=temperature
        ))
    # 2. Otherwise use configured primary provider
    elif primary_provider == "gemini":
        raw_model = model or settings.gemini_model
        target_model = raw_model if raw_model.startswith("models/") else f"models/{raw_model}"
        llms.append(ChatGoogleGenerativeAI(
            model=target_model,
            google_api_key=settings.gemini_api_key,
            temperature=temperature,
            convert_system_message_to_human=True
        ))
    elif primary_provider == "openai":
        llms.append(ChatOpenAI(
            model=model or settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=temperature
        ))
    elif primary_provider == "openrouter":
        llms.append(ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
            model=model or settings.openrouter_model,
            temperature=temperature
        ))

    # 3. Add Fallbacks from optimized fallback chain
    if settings.openrouter_api_key:
        for fallback_model in FALLBACK_MODELS:
            # Avoid adding models already in the chain
            model_already_added = any(
                getattr(llm, 'model_name', '') == fallback_model or 
                getattr(llm, 'model', '') == fallback_model
                for llm in llms
            )
            if model_already_added:
                continue
            
            llms.append(ChatOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.openrouter_api_key,
                model=fallback_model,
                temperature=temperature
            ))

    if not llms:
        # Emergency Default
        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            temperature=temperature
        )

    # Return the chain with fallbacks
    primary_llm = llms[0]
    task_tag = f"dealguard-{task_type}" if task_type else "dealguard-general"
    
    if len(llms) > 1:
        return primary_llm.with_fallbacks(llms[1:]).with_config({"tags": [task_tag]})
    
    return primary_llm.with_config({"tags": [task_tag]})


def get_reliable_json_llm(temperature=0.0, task_type=None):
    """
    Returns an LLM chain that specifically validates JSON output 
    and triggers fallbacks if the model produces invalid JSON.
    
    Args:
        temperature: LLM temperature
        task_type: Task type for smart model routing
    """
    from langchain_core.output_parsers import JsonOutputParser
    
    runnables = []
    
    # Helper to create a validated runnable
    def create_validated_runnable(llm):
        return llm | JsonOutputParser()

    # 1. Primary with task routing
    runnables.append(create_validated_runnable(get_llm(temperature=temperature, task_type=task_type)))
    
    # 2. Fallbacks using the optimized chain
    if settings.openrouter_api_key:
        for model_name in FALLBACK_MODELS:
            runnables.append(create_validated_runnable(
                ChatOpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=settings.openrouter_api_key,
                    model=model_name,
                    temperature=temperature
                )
            ))
             
    primary_runnable = runnables[0]
    task_tag = f"dealguard-json-{task_type}" if task_type else "dealguard-json-reliable"
    
    if len(runnables) > 1:
        return primary_runnable.with_fallbacks(runnables[1:]).with_config({"tags": [task_tag]})
    
    return primary_runnable.with_config({"tags": [task_tag]})


def get_task_model(task_type: str) -> str:
    """Get the assigned model for a specific task type"""
    return TASK_MODEL_ROUTING.get(task_type, TASK_MODEL_ROUTING["default"])
