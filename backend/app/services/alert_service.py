import time
from typing import List, Optional
from app.models.alert import TerrainAlert, AlertLevel, AlertStatus

class AlertService:
    def __init__(self):
        now = time.time()
        self.alerts: List[TerrainAlert] = [
            TerrainAlert(
                id="ALT-101",
                drone_id="GF-FALCON-01",
                timestamp=now - 180,
                level=AlertLevel.CRITICAL,
                category="Search & Rescue",
                title="Stranded Hiker Detected - Immediate Response",
                description="Person visual confirmation in snow ravine at 32.3789° N, 77.2521° E. Low temperature exposure hazard.",
                gps_lat=32.3789,
                gps_lon=77.2521,
                status=AlertStatus.ACTIVE,
                action_suggested="Drop emergency radio transponder & alert rescue team"
            ),
            TerrainAlert(
                id="ALT-102",
                drone_id="GF-FALCON-01",
                timestamp=now - 300,
                level=AlertLevel.CRITICAL,
                category="Wildfire",
                title="Thermal Hotspot Ridge Fire Plume",
                description="Thermal sensor detected anomalous IR signature (+68°C) near Eastern Ridge forest boundary.",
                gps_lat=32.3812,
                gps_lon=77.2545,
                status=AlertStatus.ACTIVE,
                action_suggested="Dispatch Forest Fire Warden coordinates & track perimeter"
            ),
            TerrainAlert(
                id="ALT-103",
                drone_id="GF-FALCON-01",
                timestamp=now - 540,
                level=AlertLevel.WARNING,
                category="Geological",
                title="Active Landslide Scree Slope Slippage",
                description="Fissure progression detected on 44° mountain flank. Soil shear risk high.",
                gps_lat=32.3820,
                gps_lon=77.2490,
                status=AlertStatus.ACTIVE,
                action_suggested="Establish 100m no-flight-altitude zone to avoid updraft debris"
            ),
            TerrainAlert(
                id="ALT-104",
                drone_id="GF-FALCON-01",
                timestamp=now - 900,
                level=AlertLevel.INFO,
                category="Navigation",
                title="Waypoint WP-2 Reached Successfully",
                description="Automated altitude compensation active. Heading changed to 062° for WP-3.",
                gps_lat=32.3748,
                gps_lon=77.2510,
                status=AlertStatus.RESOLVED,
                action_suggested=None
            )
        ]

    def get_all(self, level: Optional[AlertLevel] = None, status: Optional[AlertStatus] = None) -> List[TerrainAlert]:
        res = self.alerts
        if level:
            res = [a for a in res if a.level == level]
        if status:
            res = [a for a in res if a.status == status]
        return sorted(res, key=lambda a: a.timestamp, reverse=True)

    def acknowledge_alert(self, alert_id: str) -> bool:
        for a in self.alerts:
            if a.id == alert_id:
                a.status = AlertStatus.ACKNOWLEDGED
                return True
        return False

    def resolve_alert(self, alert_id: str) -> bool:
        for a in self.alerts:
            if a.id == alert_id:
                a.status = AlertStatus.RESOLVED
                return True
        return False

alert_service = AlertService()
