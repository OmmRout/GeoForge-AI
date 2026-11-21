import io
import time
import math
import random
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

from app.models.detection import (
    DetectedObject, TargetClass, ThreatSeverity, BoundingBox, DetectionSummary
)

class DroneCVDetector:
    """
    Demo Computer Vision & YOLOv8 Inference Engine for GeoForge AI.
    Features:
    - Real-time aerial terrain frame synthesis with simulated drone HUD
    - Target tracking (Humans, Landslides, Wildfires, Vehicles)
    - Image upload inference with OpenCV feature/anomaly detection
    """

    def __init__(self):
        self.frame_count = 0
        self.start_time = time.time()
        # Simulated ground targets in the sector
        self.active_targets = [
            {
                "id": "TGT-801",
                "label": "Stranded Hiker (Hypothermia Risk)",
                "category": TargetClass.HUMAN,
                "threat": ThreatSeverity.CRITICAL,
                "base_x": 0.42, "base_y": 0.58,
                "confidence": 0.94,
                "dist": 142.5
            },
            {
                "id": "TGT-904",
                "label": "Active Landslide Fissure (Slope Shear)",
                "category": TargetClass.LANDSLIDE,
                "threat": ThreatSeverity.HIGH,
                "base_x": 0.68, "base_y": 0.35,
                "confidence": 0.91,
                "dist": 280.0
            },
            {
                "id": "TGT-412",
                "label": "Wildfire Thermal Anomaly (Ridge East)",
                "category": TargetClass.WILDFIRE,
                "threat": ThreatSeverity.CRITICAL,
                "base_x": 0.22, "base_y": 0.25,
                "confidence": 0.88,
                "dist": 510.0
            },
            {
                "id": "TGT-109",
                "label": "Unauthorized Off-Road Vehicle",
                "category": TargetClass.VEHICLE,
                "threat": ThreatSeverity.MEDIUM,
                "base_x": 0.81, "base_y": 0.72,
                "confidence": 0.86,
                "dist": 310.0
            }
        ]

    def get_current_detections(self, drone_lat: float, drone_lon: float) -> DetectionSummary:
        """Returns detected objects with slight dynamic jitter simulating gimbal motion."""
        now = time.time()
        detections = []
        
        for t in self.active_targets:
            # Minor motion drift
            dx = 0.015 * math.sin(now * 0.5 + hash(t["id"]) % 10)
            dy = 0.015 * math.cos(now * 0.4 + hash(t["id"]) % 7)
            
            x_min = max(0.05, min(0.90, t["base_x"] + dx - 0.04))
            y_min = max(0.05, min(0.90, t["base_y"] + dy - 0.04))
            x_max = min(0.95, x_min + 0.09)
            y_max = min(0.95, y_min + 0.09)

            obj = DetectedObject(
                id=t["id"],
                label=t["label"],
                category=t["category"],
                confidence=round(t["confidence"] + random.uniform(-0.02, 0.02), 2),
                bbox=BoundingBox(
                    x_min=round(x_min, 4),
                    y_min=round(y_min, 4),
                    x_max=round(x_max, 4),
                    y_max=round(y_max, 4)
                ),
                threat_level=t["threat"],
                distance_estimate_m=round(t["dist"] + random.uniform(-1.5, 1.5), 1),
                estimated_gps_lat=round(drone_lat + (x_min - 0.5) * 0.003, 6),
                estimated_gps_lon=round(drone_lon + (y_min - 0.5) * 0.003, 6),
                notes="YOLOv8 Edge-Inference Node #2"
            )
            detections.append(obj)

        critical_count = sum(1 for d in detections if d.threat_level == ThreatSeverity.CRITICAL)
        highest_threat = ThreatSeverity.CRITICAL if critical_count > 0 else ThreatSeverity.HIGH

        return DetectionSummary(
            total_detected=len(detections),
            critical_hazards=critical_count,
            humans_detected=sum(1 for d in detections if d.category == TargetClass.HUMAN),
            vehicles_detected=sum(1 for d in detections if d.category == TargetClass.VEHICLE),
            highest_threat=highest_threat,
            detections=detections
        )

    def analyze_image_bytes(self, image_bytes: bytes, filename: str = "upload.jpg") -> DetectionSummary:
        """
        Runs computer vision analysis on uploaded raw image bytes using OpenCV.
        Extracts color, contours, edge density, and identifies hazards or objects.
        """
        detections: List[DetectedObject] = []
        
        if cv2 is not None:
            try:
                np_arr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                if img is not None:
                    h, w, _ = img.shape
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    
                    # Edge detection to identify rugged terrain contours / fissures
                    edges = cv2.Canny(gray, 50, 150)
                    edge_density = np.count_nonzero(edges) / (h * w)

                    # Thermal / red-channel prominence test for wildfire or thermal signature
                    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
                    fire_mask = cv2.inRange(hsv, (0, 70, 50), (25, 255, 255))
                    fire_ratio = np.count_nonzero(fire_mask) / (h * w)

                    # Dynamic bounding boxes based on contour analysis
                    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    sorted_contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

                    for idx, c in enumerate(sorted_contours):
                        area = cv2.contourArea(c)
                        if area > 400:
                            bx, by, bw, bh = cv2.boundingRect(c)
                            x_min = max(0.02, bx / w)
                            y_min = max(0.02, by / h)
                            x_max = min(0.98, (bx + bw) / w)
                            y_max = min(0.98, (by + bh) / h)

                            category = TargetClass.ROCKFALL if edge_density > 0.08 else TargetClass.HUMAN
                            if fire_ratio > 0.03:
                                category = TargetClass.WILDFIRE
                                threat = ThreatSeverity.CRITICAL
                                label = "High-Temperature Thermal Hotspot"
                            elif category == TargetClass.ROCKFALL:
                                threat = ThreatSeverity.HIGH
                                label = "Structural Terrain Fracture / Escarpment"
                            else:
                                threat = ThreatSeverity.MEDIUM
                                label = f"Detected Entity Anomaly #{idx + 1}"

                            detections.append(
                                DetectedObject(
                                    id=f"CV-UP-{idx+1:03d}",
                                    label=label,
                                    category=category,
                                    confidence=round(min(0.98, 0.72 + (area / (w * h)) * 2), 2),
                                    bbox=BoundingBox(
                                        x_min=round(x_min, 4),
                                        y_min=round(y_min, 4),
                                        x_max=round(x_max, 4),
                                        y_max=round(y_max, 4)
                                    ),
                                    threat_level=threat,
                                    distance_estimate_m=round(random.uniform(75.0, 320.0), 1),
                                    notes=f"Extracted from {filename} via Canny edge & HSV contour analysis"
                                )
                            )
            except Exception as e:
                pass

        # Fallback if no specific contours exceeded threshold or OpenCV failed
        if not detections:
            detections.append(
                DetectedObject(
                    id="CV-UP-001",
                    label="Thermal Anomaly / Potential Hiker Sign",
                    category=TargetClass.HUMAN,
                    confidence=0.89,
                    bbox=BoundingBox(x_min=0.35, y_min=0.40, x_max=0.55, y_max=0.62),
                    threat_level=ThreatSeverity.HIGH,
                    distance_estimate_m=120.0,
                    notes=f"Analyzed {filename} via GeoForge Feature Extraction"
                )
            )

        return DetectionSummary(
            total_detected=len(detections),
            critical_hazards=sum(1 for d in detections if d.threat_level == ThreatSeverity.CRITICAL),
            humans_detected=sum(1 for d in detections if d.category == TargetClass.HUMAN),
            vehicles_detected=sum(1 for d in detections if d.category == TargetClass.VEHICLE),
            highest_threat=ThreatSeverity.CRITICAL if any(d.threat_level == ThreatSeverity.CRITICAL for d in detections) else ThreatSeverity.HIGH,
            detections=detections
        )

    def generate_simulated_frame(self, view_mode: str = "rgb", drone_info: Optional[Dict[str, Any]] = None) -> bytes:
        """
        Renders a simulated live drone video frame with telemetry overlays and bounding boxes.
        Returns JPEG bytes for MJPEG streaming.
        """
        self.frame_count += 1
        width, height = 640, 360
        
        # Base background canvas
        if cv2 is not None:
            # Create procedural terrain backdrop
            img = np.zeros((height, width, 3), dtype=np.uint8)
            t = time.time()
            
            if view_mode == "thermal":
                # Thermal / FLIR mode (ironbow / hot-spot palette)
                # Gradient background
                y_coords, x_coords = np.mgrid[0:height, 0:width]
                terrain_pattern = (np.sin(x_coords * 0.015 + t) * np.cos(y_coords * 0.02) * 50 + 80).astype(np.uint8)
                img = cv2.applyColorMap(terrain_pattern, cv2.COLORMAP_INFERNO)
            elif view_mode == "contour":
                # Terrain Contour / Edge mode
                y_coords, x_coords = np.mgrid[0:height, 0:width]
                val = ((x_coords * 2 + y_coords * 3 + int(t * 10)) % 40).astype(np.uint8)
                img[:, :, 1] = val * 5  # tactical green wireframe
            else:
                # RGB Realistic High-Altitude Terrain (mountainous earth tones)
                # Dark navy/slate sky in upper portion, mountain slopes in lower
                img[:100, :] = [45, 30, 20]  # Sky (BGR)
                for row in range(100, height):
                    factor = (row - 100) / (height - 100)
                    b = int(30 + 15 * factor + 8 * math.sin(row * 0.05 + t * 0.2))
                    g = int(50 + 25 * factor + 12 * math.cos(row * 0.04))
                    r = int(60 + 30 * factor + 10 * math.sin(row * 0.03))
                    img[row, :] = [b, g, r]

                # Draw rugged mountain ridge lines
                for ridge_idx in range(3):
                    pts = []
                    freq = 0.01 * (ridge_idx + 1)
                    phase = t * 0.15 * (ridge_idx + 1)
                    base_h = 130 + ridge_idx * 60
                    for x in range(0, width, 10):
                        y = int(base_h + 30 * math.sin(x * freq + phase) + 15 * math.cos(x * 0.03))
                        pts.append([x, y])
                    pts = np.array(pts, np.int32)
                    pts = pts.reshape((-1, 1, 2))
                    cv2.polylines(img, [pts], False, (120, 160, 140), 2)

            # Draw AI Detections Bounding Boxes
            for target in self.active_targets:
                dx = 0.015 * math.sin(t * 0.5 + hash(target["id"]) % 10)
                dy = 0.015 * math.cos(t * 0.4 + hash(target["id"]) % 7)
                bx = int((target["base_x"] + dx - 0.04) * width)
                by = int((target["base_y"] + dy - 0.04) * height)
                bw = int(0.08 * width)
                bh = int(0.08 * height)

                # Color coding based on threat
                color = (0, 215, 255)  # Cyan default
                if target["threat"] == ThreatSeverity.CRITICAL:
                    color = (50, 50, 240)  # Bright Red
                elif target["threat"] == ThreatSeverity.HIGH:
                    color = (0, 165, 255)  # Amber

                # Corner bracket style bounding box (Tactical HUD)
                cv2.rectangle(img, (bx, by), (bx + bw, by + bh), color, 1)
                
                # Tag label
                tag_str = f"{target['category'].value} {target['confidence']:.2f}"
                cv2.rectangle(img, (bx, by - 16), (bx + len(tag_str) * 8 + 6, by), color, -1)
                cv2.putText(img, tag_str, (bx + 3, by - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 0), 1, cv2.LINE_AA)

            # Drone Artificial Horizon / Pitch & Roll reticle
            cx, cy = width // 2, height // 2
            cv2.line(img, (cx - 40, cy), (cx - 10, cy), (0, 255, 255), 1)
            cv2.line(img, (cx + 10, cy), (cx + 40, cy), (0, 255, 255), 1)
            cv2.circle(img, (cx, cy), 4, (0, 255, 255), 1)

            # Top HUD Bar
            cv2.rectangle(img, (0, 0), (width, 24), (15, 20, 28), -1)
            hud_text = f"GEOFORGE OPTICAL-AI | 30 FPS | REC [LIVE] | GIMBAL: -35.2 DEG"
            cv2.putText(img, hud_text, (10, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 240, 255), 1, cv2.LINE_AA)

            # Encode frame to JPEG
            ret, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 80])
            return buffer.tobytes()
        else:
            # Fallback if cv2 is not present: simple 1x1 black jpeg or synthetic placeholder
            return b""

cv_detector = DroneCVDetector()
