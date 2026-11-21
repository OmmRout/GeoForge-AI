from fastapi import APIRouter, Request
from typing import List
from app.models.agent import AgentDecision, AgentChatRequest, AgentChatResponse
from app.services.agentic_engine import agentic_engine
from app.services.telemetry_simulator import telemetry_simulator
from app.core.rate_limiter import limiter

router = APIRouter()

@router.get("/decisions", response_model=List[AgentDecision])
@limiter.limit("60/minute")
def get_agent_decisions(request: Request):
    return agentic_engine.get_latest_decisions()

@router.post("/chat", response_model=AgentChatResponse)
@limiter.limit("45/minute")
def chat_with_copilot(request: Request, body: AgentChatRequest):
    telemetry = telemetry_simulator.update().model_dump()
    return agentic_engine.query_copilot(
        drone_id=body.drone_id,
        prompt=body.message,
        telemetry=telemetry
    )
