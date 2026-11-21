from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class AgentDecisionType(str, Enum):
    COURSE_CORRECTION = "COURSE_CORRECTION"
    EMERGENCY_RTL = "EMERGENCY_RTL"
    THERMAL_SCAN_LOCK = "THERMAL_SCAN_LOCK"
    HAZARD_AVOIDANCE = "HAZARD_AVOIDANCE"
    PAYLOAD_ORBIT = "PAYLOAD_ORBIT"
    GEOFENCE_STABILIZE = "GEOFENCE_STABILIZE"
    NOMINAL_SURVEILLANCE = "NOMINAL_SURVEILLANCE"

class ReasoningStep(BaseModel):
    step_number: int
    component: str  # "PerceptionNode", "RiskAssessor", "ActionPlanner", "SafetyValidator"
    thought: str
    evidence: str
    confidence: float

class AgentDecision(BaseModel):
    id: str
    timestamp: float
    drone_id: str
    action_type: AgentDecisionType
    headline: str
    summary: str
    reasoning_steps: List[ReasoningStep]
    recommended_action: str
    risk_score: float  # 0.0 to 100.0
    auto_executed: bool = False
    requires_pilot_ack: bool = False

class AgentChatRequest(BaseModel):
    drone_id: str
    message: str

class AgentChatResponse(BaseModel):
    reply: str
    suggested_action: Optional[str] = None
    reasoning_trail: List[str]
    context_threat_level: str
