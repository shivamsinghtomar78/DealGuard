from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings

def get_llm(temperature=0.1, model=None):
    """
    Factory function to get a reliable LLM with automatic fallbacks.
    Priority:
    1. Primary (Gemini or configured provider)
    2. Fallback Cluster (OpenRouter Free Models)
    """
    primary_provider = settings.llm_provider.lower()
    llms = []

    # 1. Prepare Primary LLM
    if primary_provider == "gemini":
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

    # 2. Add Fallbacks from OpenRouter (if enabled)
    if settings.openrouter_api_key:
        for fallback_model in settings.openrouter_models:
            # Avoid adding the same model twice if it was primary
            if primary_provider == "openrouter" and (model or settings.openrouter_model) == fallback_model:
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
    if len(llms) > 1:
        return primary_llm.with_fallbacks(llms[1:]).with_config({"tags": ["dealguard-general"]})
    
    return primary_llm.with_config({"tags": ["dealguard-general"]})

def get_reliable_json_llm(temperature=0.0):
    """
    Returns an LLM chain that specifically validates JSON output 
    and triggers fallbacks if the model hallucinations (invalid JSON).
    """
    from langchain_core.output_parsers import JsonOutputParser
    from langchain_core.exceptions import OutputParserException
    
    base_llm = get_llm(temperature=temperature)
    
    # We create a chain that includes parsing. 
    # If the parser fails, it raises OutputParserException, 
    # which will trigger with_fallbacks if we structure it correctly.
    
    # Actually, with_fallbacks works best on the Runnable level.
    # We will wrap the entire Parsing operation into each fallback step.
    
    primary_provider = settings.llm_provider.lower()
    fallback_models = [settings.openrouter_model] + settings.openrouter_models if settings.openrouter_api_key else []
    
    runnables = []
    
    # helper to create a validated runnable
    def create_validated_runnable(llm):
        return llm | JsonOutputParser()

    # 1. Primary
    runnables.append(create_validated_runnable(get_llm(temperature=temperature)))
    
    # 2. Fallbacks
    if settings.openrouter_api_key:
        for model_name in settings.openrouter_models:
             runnables.append(create_validated_runnable(
                 ChatOpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=settings.openrouter_api_key,
                    model=model_name,
                    temperature=temperature
                )
             ))
             
    primary_runnable = runnables[0]
    config = {"tags": ["dealguard-json-reliable"]}
    
    if len(runnables) > 1:
        return primary_runnable.with_fallbacks(runnables[1:]).with_config(config)
    
    return primary_runnable.with_config(config)
