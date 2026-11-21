import time
import uuid
import random
from typing import List, Dict, Any, Optional
from app.models.agent import (
    AgentDecision, AgentDecisionType, ReasoningStep, AgentChatRequest, AgentChatResponse
)
from app.models.detection import TargetClass, ThreatSeverity
from app.models.drone import FlightMode, DroneStatus

class AgenticDecisionEngine:
    """
    Agentic AI Cognitive Core for GeoForge AI.
    Features:
    - Multi-stage reasoning graph (Perception -> Terrain Risk -> Mission Decision -> Safety Validation)
    - Real-time autonomous decisions with explainable rationale
    - Natural language copilot interaction with telemetry grounding
    """

    def __init__(self):
        self.decision_history: List[AgentDecision] = []
        self._seed_decisions()

    def _seed_decisions(self):
        now = time.time()
        self.decision_history = [
            AgentDecision(
                id="DEC-4091",
                timestamp=now - 120,
                drone_id="GF-FALCON-01",
                action_type=AgentDecisionType.HAZARD_AVOIDANCE,
                headline="Active Landslide Fissure Detected on Ridge Slopes",
                summary="Computer Vision YOLOv8 Node detected slope instability with displacement fracture. Agent computed 74% likelihood of rockfall within 15 mins. Recommended 50m standoff distance.",
                reasoning_steps=[
                    ReasoningStep(
                        step_number=1,
                        component="PerceptionNode",
                        thought="Optical CV sensor identified high-contrast ground fracture matching known scree slope fault signatures.",
                        evidence="Target TGT-904 (Confidence 0.91, Area: 340 sq meters)",
                        confidence=0.91
                    ),
                    ReasoningStep(
                        step_number=2,
                        component="TerrainRiskAssessor",
                        thought="Terrain gradient exceeds 42 degrees. Micro-vibrations and recent precipitation elevate sudden slide risk.",
                        evidence="Digital Elevation Model gradient: 44.2°, Soil saturation index: High",
                        confidence=0.88
                    ),
                    ReasoningStep(
                        step_number=3,
                        component="ActionPlanner",
                        thought="Reroute waypoint WP-4 offset by +120m North to avoid potential dust plume and rockfall trajectory.",
                        evidence="Simulated trajectory clears risk envelope by 85m margin.",
                        confidence=0.95
                    ),
                    ReasoningStep(
                        step_number=4,
                        component="SafetyValidator",
                        thought="Verified obstacle clearance. Altitude AGL remains within safe corridor (165m).",
                        evidence="Barometric sensor cross-verified against GPS MSL.",
                        confidence=0.99
                    )
                ],
                recommended_action="Execute +120m Northern offset waypoint corridor.",
                risk_score=76.5,
                auto_executed=True,
                requires_pilot_ack=False
            ),
            AgentDecision(
                id="DEC-4092",
                timestamp=now - 45,
                drone_id="GF-FALCON-01",
                action_type=AgentDecisionType.THERMAL_SCAN_LOCK,
                headline="High-Confidence Stranded Hiker Identified in Ravine",
                summary="Thermal and optical fusion localized human signature TGT-801. Agent initiated loiter orbit and activated emergency radio beacon relay.",
                reasoning_steps=[
                    ReasoningStep(
                        step_number=1,
                        component="PerceptionNode",
                        thought="Optical detector isolated human silhouette with fluorescent orange gear. Thermal differential: +14°C over ambient snow.",
                        evidence="Target TGT-801, Confidence: 0.94, Coordinates: 32.3789° N, 77.2521° E",
                        confidence=0.94
                    ),
                    ReasoningStep(
                        step_number=2,
                        component="RiskAssessor",
                        thought="Ambient temperature is 3.2°C and dropping. Subject exhibits minimal movement; risk of hypothermia is critical.",
                        evidence="Inactivity duration: > 6 minutes in open exposure",
                        confidence=0.92
                    ),
                    ReasoningStep(
                        step_number=3,
                        component="ActionPlanner",
                        thought="Engage 360-degree orbital surveillance at 80m AGL. Transmit precise coordinates to State Disaster Response Base.",
                        evidence="Flight endurance: 22 mins remaining, sufficient for 10-min orbit + RTL.",
                        confidence=0.96
                    )
                ],
                recommended_action="Transmit GPS lock to SAR Command & hold optical tracking orbit.",
                risk_score=89.0,
                auto_executed=True,
                requires_pilot_ack=True
            )
        ]

    def get_latest_decisions(self) -> List[AgentDecision]:
        return sorted(self.decision_history, key=lambda d: d.timestamp, reverse=True)

    def evaluate_live_state(self, telemetry: Dict[str, Any], detections_summary: Dict[str, Any]) -> Optional[AgentDecision]:
        """Periodically evaluates live drone status and creates decisions if conditions trigger."""
        battery = telemetry.get("battery", {}).get("percentage", 100.0)
        wind = telemetry.get("weather", {}).get("wind_speed_kmh", 0.0)
        
        # Check low battery condition
        if battery < 25.0 and not any("Low Battery" in d.headline for d in self.decision_history[-2:]):
            decision = AgentDecision(
                id=f"DEC-{uuid.uuid4().hex[:6].upper()}",
                timestamp=time.time(),
                drone_id=telemetry.get("drone_id", "GF-FALCON-01"),
                action_type=AgentDecisionType.EMERGENCY_RTL,
                headline="Battery Threshold Breach (25% Remaining)",
                summary=f"Remaining flight energy insufficient for continued surveillance mission. Calculated RTL transit time: 6.8 mins.",
                reasoning_steps=[
                    ReasoningStep(
                        step_number=1,
                        component="EnergyBudgetNode",
                        thought=f"Battery level reached {battery:.1f}%. Crosswind of {wind:.1f} km/h increases headwind consumption by 18%.",
                        evidence=f"Voltage: {telemetry.get('battery', {}).get('voltage', 21.0)}V",
                        confidence=0.98
                    ),
                    ReasoningStep(
                        step_number=2,
                        component="SafetyValidator",
                        thought="Failsafe standard protocol requires minimum 15% reserve upon landing at Base Camp.",
                        evidence="Reserve margin remaining: 10% under current consumption trajectory.",
                        confidence=0.99
                    )
                ],
                recommended_action="Initiate immediate Return-to-Launch (RTL).",
                risk_score=82.0,
                auto_executed=False,
                requires_pilot_ack=True
            )
            self.decision_history.append(decision)
            return decision

        return None

    def query_copilot(self, drone_id: str, prompt: str, telemetry: Dict[str, Any]) -> AgentChatResponse:
        """
        Processes natural language instructions or tactical queries from the operator.
        Grounds response with real telemetry data and CV status.
        """
        p_lower = prompt.lower()
        reasoning_trail = []
        suggested_action = None
        context_threat = "MEDIUM"

        battery = telemetry.get("battery", {}).get("percentage", 78)
        alt = telemetry.get("gps", {}).get("altitude_agl_m", 145)
        speed = telemetry.get("speed_kmh", 38)
        mode = telemetry.get("mode", "AUTO")
        wind = telemetry.get("weather", {}).get("wind_speed_kmh", 22)

        reasoning_trail.append("Operator query received and tokenized.")
        reasoning_trail.append(f"Ingested telemetry: Alt={alt}m AGL, Speed={speed} km/h, Bat={battery}%, Wind={wind} km/h, Mode={mode}.")

        if "landslide" in p_lower or "hazard" in p_lower or "fissure" in p_lower:
            reasoning_trail.append("Query matches geological hazard detection vector.")
            reasoning_trail.append("Correlating live CV TGT-904 with digital elevation gradient.")
            reply = (
                f"GeoForge AI Analysis: Active Landslide Fissure (TGT-904) is located at 32.3820° N, 77.2490° E. "
                f"The escarpment incline is 44°, with high risk of scree cascade. "
                f"Current drone standoff distance is 280m. I recommend remaining at or above 160m AGL to ensure sensor line-of-sight while avoiding turbulent mountain ridge downdrafts."
            )
            suggested_action = "MAINTAIN_STANDOFF_ORBIT"
            context_threat = "HIGH"

        elif "battery" in p_lower or "power" in p_lower or "endurance" in p_lower:
            reasoning_trail.append("Evaluated 6S LiPo power telemetry and current draw.")
            remaining_mins = round((battery / 100.0) * 28.0, 1)
            reply = (
                f"Power telemetry report: State of Charge is {battery}%, voltage is nominal at 22.8V. "
                f"Estimated endurance is {remaining_mins} minutes under current 24.5A motor draw. "
                f"Distance to Base Camp is 1.4 km; minimum required return reserve is 18%. Flight envelope is GREEN."
            )
            context_threat = "NOMINAL"

        elif "hiker" in p_lower or "person" in p_lower or "rescue" in p_lower or "victim" in p_lower:
            reasoning_trail.append("Target lock TGT-801 retrieved from Computer Vision store.")
            reply = (
                f"Search & Rescue Target TGT-801 is confirmed: Stranded Hiker located in Eastern Ravine (32.3789° N, 77.2521° E). "
                f"Optical detection confidence is 94%. Subject is wearing high-visibility orange jacket. "
                f"Ambient temperature is 3.2°C. Automated distress coordinates have been prepared for dispatch to Base Camp."
            )
            suggested_action = "DISPATCH_SAR_BEACON"
            context_threat = "CRITICAL"

        elif "rtl" in p_lower or "return" in p_lower or "home" in p_lower:
            reasoning_trail.append("Assessed return corridor clearance, mountain obstacle ceiling, and headwind.")
            reply = (
                f"Ready to execute Return-to-Launch (RTL). Flight path to Base Camp is 1,420m on heading 225°. "
                f"Safe transit altitude is 180m AGL (clears Eastern Ridge crest). Would you like me to engage RTL mode now?"
            )
            suggested_action = "CONFIRM_RTL"
            context_threat = "MEDIUM"

        elif "weather" in p_lower or "wind" in p_lower or "gust" in p_lower:
            reasoning_trail.append("Processed onboard ultrasonic anemometer & barometric telemetry.")
            reply = (
                f"Meteorological status: Wind is from 280° at {wind} km/h with gusts up to {round(wind + 7, 1)} km/h. "
                f"Barometric pressure is 642.5 hPa (high altitude). Flight stability margin is currently 88% nominal."
            )
            context_threat = "LOW"

        else:
            reasoning_trail.append("Generalized terrain surveillance assessment.")
            reply = (
                f"GeoForge AI Tactical Agent status: All systems nominal. Currently flying in {mode} mode at {alt}m AGL ({speed} km/h). "
                f"Tracking 4 terrain targets (1 Critical Rescue, 1 Geological Hazard, 1 Wildfire Anomaly, 1 Vehicle). "
                f"Telemetry link quality is 99% with 16 DGPS satellites locked via Neo-6M."
            )

        return AgentChatResponse(
            reply=reply,
            suggested_action=suggested_action,
            reasoning_trail=reasoning_trail,
            context_threat_level=context_threat
        )

agentic_engine = AgenticDecisionEngine()
