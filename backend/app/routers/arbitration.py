"""
Arbitration router for summarizing and comparing Arena battle results
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import asyncio
from app.database import get_db
from app.auth import get_current_active_user
from app.models.user import User, UsageLog
from app.ai_providers import call_ai_model, calculate_cost


router = APIRouter()


class ResponseSummary(BaseModel):
    model: str
    model_name: str
    response: str


class ArbitrationRequest(BaseModel):
    prompt: str
    responses: List[ResponseSummary]


class ArbitrationResponse(BaseModel):
    summary: str
    cost: float


@router.post("/summarize", response_model=ArbitrationResponse)
async def arbitrate_responses(
    request: ArbitrationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Use GPT-5.2 (or best available model) to analyze and compare arena responses
    """
    if not request.responses or len(request.responses) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 responses to arbitrate")
    
    # Build arbitration prompt
    arbitration_prompt = f"""Вы - эксперт по анализу ответов ИИ-моделей. Проанализируйте следующие ответы разных моделей на один и тот же запрос.

**Исходный запрос пользователя:**
{request.prompt}

**Ответы моделей:**

"""
    
    for idx, resp in enumerate(request.responses, 1):
        arbitration_prompt += f"\n--- Модель {idx}: {resp.model_name} ({resp.model}) ---\n{resp.response}\n"
    
    arbitration_prompt += """

**Задача:**
1. Сравните качество, точность, полноту и полезность каждого ответа
2. Выделите сильные и слабые стороны каждой модели
3. Определите, какая модель дала наиболее качественный ответ и почему
4. Дайте общую рекомендацию пользователю

Используйте структуру:
- **Сравнительный анализ:** (краткое сравнение подходов)
- **Сильные стороны по моделям:** (для каждой модели)
- **Слабые стороны по моделям:** (для каждой модели)
- **Победитель:** (какая модель лучше и почему)
- **Рекомендация:** (советы пользователю)
"""
    
    messages = [
        {"role": "user", "content": arbitration_prompt}
    ]
    
    # Use GPT-5.2 for arbitration (best available model)
    arbitration_model = "gpt-5.2"
    
    try:
        response_text, input_tokens, output_tokens = await call_ai_model(arbitration_model, messages)
        cost = calculate_cost(arbitration_model, input_tokens, output_tokens)
        
        # Check if user has sufficient balance
        if current_user.balance < cost:
            raise HTTPException(
                status_code=402,
                detail=f"Insufficient balance. Required: ${cost:.4f}, Available: ${current_user.balance:.2f}"
            )
        
        # Deduct balance and log usage
        current_user.balance -= cost
        
        usage_log = UsageLog(
            user_id=current_user.id,
            model=arbitration_model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
            session_type="arbitration"
        )
        db.add(usage_log)
        db.commit()
        
        return ArbitrationResponse(
            summary=response_text,
            cost=cost
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arbitration failed: {str(e)}")
