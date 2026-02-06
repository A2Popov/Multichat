"""
AI Provider integrations for MultiChat
Supports: OpenAI, Anthropic (Claude), Google (Gemini), DeepSeek, Qwen
"""
from typing import Dict, List, Tuple
from openai import OpenAI
from anthropic import Anthropic
import google.generativeai as genai
import httpx
from app.config.settings import settings


# Model configurations with pricing (per 1M tokens)
MODEL_CONFIGS = {
    # OpenAI GPT-5 Series
    "gpt-5.2": {
        "provider": "openai",
        "display_name": "GPT-5.2",
        "input_cost": 1.75,
        "output_cost": 14.00,
    },
    "gpt-5.2-pro": {
        "provider": "openai",
        "display_name": "GPT-5.2 Pro",
        "input_cost": 21.00,
        "output_cost": 168.00,
    },
    "gpt-5-mini": {
        "provider": "openai",
        "display_name": "GPT-5 mini",
        "input_cost": 0.25,
        "output_cost": 2.00,
    },
    # Anthropic Claude 4.5 Series  
    "claude-opus-4.5": {
        "provider": "anthropic",
        "display_name": "Claude Opus 4.5",
        "input_cost": 18.00,
        "output_cost": 90.00,
    },
    "claude-sonnet-4.5": {
        "provider": "anthropic",
        "display_name": "Claude Sonnet 4.5",
        "input_cost": 4.00,
        "output_cost": 20.00,
    },
    # Google Gemini 3 Series
    "gemini-3-pro": {
        "provider": "google",
        "display_name": "Gemini 3 Pro",
        "input_cost": 2.00,
        "output_cost": 12.00,
    },
    "gemini-3-flash": {
        "provider": "google",
        "display_name": "Gemini 3 Flash",
        "input_cost": 0.50,
        "output_cost": 3.00,
    },
    # DeepSeek R1 (via Together)
    "deepseek-r1": {
        "provider": "together",
        "display_name": "DeepSeek R1",
        "together_model": "deepseek-ai/DeepSeek-R1",
        "input_cost": 0.30,
        "output_cost": 1.20,
    },
    # Qwen 3 (via Together)
    "qwen-3-max": {
        "provider": "together",
        "display_name": "Qwen 3 Max",
        "together_model": "Qwen/Qwen2.5-72B-Instruct-Turbo",
        "input_cost": 0.60,
        "output_cost": 2.00,
    },
}


def get_available_models() -> List[Dict]:
    """Get list of available models based on configured API keys"""
    available = []
    
    for model_id, config in MODEL_CONFIGS.items():
        provider = config["provider"]
        api_key = None
        
        if provider == "openai" and settings.OPENAI_API_KEY:
            api_key = settings.OPENAI_API_KEY
        elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            api_key = settings.ANTHROPIC_API_KEY
        elif provider == "google" and settings.GOOGLE_API_KEY:
            api_key = settings.GOOGLE_API_KEY
        elif provider == "together" and settings.TOGETHER_API_KEY:
            api_key = settings.TOGETHER_API_KEY
        
        if api_key:
            available.append({
                "id": model_id,
                "name": config["display_name"],
                "provider": provider
            })
    
    return available


def calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate cost based on model and token usage"""
    if model not in MODEL_CONFIGS:
        return 0.0
    
    config = MODEL_CONFIGS[model]
    input_cost = (input_tokens / 1_000_000) * config["input_cost"]
    output_cost = (output_tokens / 1_000_000) * config["output_cost"]
    
    return input_cost + output_cost


async def call_ai_model(model: str, messages: List[Dict]) -> Tuple[str, int, int]:
    """
    Call AI model and return (response_text, input_tokens, output_tokens)
    """
    if model not in MODEL_CONFIGS:
        raise ValueError(f"Unknown model: {model}")
    
    provider = MODEL_CONFIGS[model]["provider"]
    
    if provider == "openai":
        return await call_openai(model, messages)
    elif provider == "anthropic":
        return await call_anthropic(model, messages)
    elif provider == "google":
        return await call_google(model, messages)
    elif provider == "together":
        return await call_together(model, messages)
    else:
        raise ValueError(f"Unknown provider: {provider}")


async def call_openai(model: str, messages: List[Dict]) -> Tuple[str, int, int]:
    """Call OpenAI API"""
    if not settings.OPENAI_API_KEY:
        raise ValueError("OpenAI API key not configured")
    
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=model,
        messages=messages
    )
    
    content = response.choices[0].message.content
    input_tokens = response.usage.prompt_tokens
    output_tokens = response.usage.completion_tokens
    
    return content, input_tokens, output_tokens


async def call_anthropic(model: str, messages: List[Dict]) -> Tuple[str, int, int]:
    """Call Anthropic Claude API"""
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("Anthropic API key not configured")
    
    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    # Convert messages format (remove system messages, handle differently)
    claude_messages = []
    system_message = None
    
    for msg in messages:
        if msg["role"] == "system":
            system_message = msg["content"]
        else:
            claude_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
    
    # Map to actual API model names - Claude uses hyphens
    # claude-opus-4.5 -> claude-opus-4-5
    # claude-sonnet-4.5 -> claude-sonnet-4-5
    api_model = model.replace("4.5", "4-5")
    
    response = client.messages.create(
        model=api_model,
        max_tokens=8192,
        system=system_message if system_message else "",
        messages=claude_messages
    )
    
    content = response.content[0].text
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens
    
    return content, input_tokens, output_tokens


async def call_google(model: str, messages: List[Dict]) -> Tuple[str, int, int]:
    """Call Google Gemini API"""
    if not settings.GOOGLE_API_KEY:
        raise ValueError("Google API key not configured")
    
    genai.configure(api_key=settings.GOOGLE_API_KEY)
    
    # Map to actual API model names
    api_model = "gemini-3-pro-preview" if model == "gemini-3-pro" else "gemini-3-flash-preview"
    gemini_model = genai.GenerativeModel(api_model)
    
    # Convert messages to Gemini format
    chat_history = []
    for msg in messages[:-1]:  # All except last
        chat_history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]]
        })
    
    chat = gemini_model.start_chat(history=chat_history)
    response = chat.send_message(messages[-1]["content"])
    
    content = response.text
    # Gemini provides token counts
    input_tokens = response.usage_metadata.prompt_token_count
    output_tokens = response.usage_metadata.candidates_token_count
    
    return content, int(input_tokens), int(output_tokens)


async def call_together(model: str, messages: List[Dict]) -> Tuple[str, int, int]:
    """Call Together API for DeepSeek R1 and Qwen models"""
    if not settings.TOGETHER_API_KEY:
        raise ValueError("Together API key not configured")
    
    config = MODEL_CONFIGS[model]
    together_model = config.get("together_model")
    
    if not together_model:
        raise ValueError(f"Together model not configured for {model}")
    
    client = OpenAI(
        api_key=settings.TOGETHER_API_KEY,
        base_url="https://api.together.xyz/v1"
    )
    
    response = client.chat.completions.create(
        model=together_model,
        messages=messages
    )
    
    content = response.choices[0].message.content
    input_tokens = response.usage.prompt_tokens
    output_tokens = response.usage.completion_tokens
    
    return content, input_tokens, output_tokens
