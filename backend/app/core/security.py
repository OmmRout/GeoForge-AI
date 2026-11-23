import re
import time
import logging
from typing import Dict, List, Any, Optional
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger("geoforge.security")

# Malicious vulnerability scanner and bot probe patterns
PROBE_REGEX = re.compile(
    r"""(
        /\.(env|git|svn|htaccess|aws|ssh|bash|config|ds_store|local) |
        \.(php|asp|aspx|jsp|cgi|pl|sh|bash|rb|action|do)(\?|/|$) |
        /(wp-login|wp-admin|wp-content|xmlrpc\.php|phpmyadmin|pma|adminer) |
        /(solr|actuator|eval-stdin|autodiscover|phpunit|telescope|_profiler) |
        /(cgi-bin|boaform|setup\.cgi|webdav|invoker|axis2|manager/html) |
        (\.\./|\.\.\\) |
        (etc/(passwd|shadow)|proc/self) |
        (select\+.*\+from|union\+.*\+select)
    )""",
    re.IGNORECASE | re.VERBOSE
)

ALLOWED_METHODS = {"GET", "POST", "OPTIONS", "HEAD", "PUT", "DELETE"}
MAX_REQUEST_BYTES = 12 * 1024 * 1024  # 12 MB max payload size for image uploads

def get_client_ip(request: Request) -> str:
    """Extract real client IP behind reverse proxies like Render / Cloudflare / Nginx."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # X-Forwarded-For can contain comma-separated IPs; client is the first one
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "127.0.0.1"

class SecurityAuditTracker:
    def __init__(self):
        self.blocked_events: List[Dict[str, Any]] = []
        self.probe_counts: Dict[str, List[float]] = defaultdict(list)
        self.quarantined_ips: Dict[str, float] = {}  # ip -> unban_timestamp
        self.total_blocked_probes: int = 0

    def is_quarantined(self, ip: str) -> bool:
        if ip in self.quarantined_ips:
            if time.time() < self.quarantined_ips[ip]:
                return True
            else:
                del self.quarantined_ips[ip]
        return False

    def record_probe(self, ip: str, path: str, method: str, reason: str):
        now = time.time()
        self.total_blocked_probes += 1
        
        # Keep track of timestamps for this IP within last 5 mins
        recent = [t for t in self.probe_counts[ip] if now - t < 300]
        recent.append(now)
        self.probe_counts[ip] = recent
        
        # If > 4 malicious probes within 5 minutes, quarantine IP for 15 minutes
        if len(recent) >= 4:
            self.quarantined_ips[ip] = now + 900
            logger.warning(f"[WAF QUARANTINE] IP {ip} quarantined for 15 mins due to repeated probe attempts.")

        event = {
            "timestamp": now,
            "ip_masked": self._mask_ip(ip),
            "method": method,
            "path": path[:120],
            "reason": reason
        }
        self.blocked_events.append(event)
        if len(self.blocked_events) > 100:
            self.blocked_events.pop(0)

        logger.warning(f"[WAF SHIELD BLOCKED] IP: {ip} | {method} {path} | Reason: {reason}")

    def _mask_ip(self, ip: str) -> str:
        parts = ip.split(".")
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.*.*"
        return ip[:8] + "***"

    def get_status(self) -> Dict[str, Any]:
        now = time.time()
        # Clean expired bans
        active_bans = sum(1 for unban in self.quarantined_ips.values() if unban > now)
        return {
            "waf_shield_status": "ACTIVE_ENFORCING",
            "active_rules": [
                "Automated Bot Vulnerability Probe Blocker",
                "Path Traversal & Injection Shield",
                "OWASP Hardened Headers",
                "Reverse-Proxy Real-IP Rate Limiting",
                "Dynamic Abusive Scanner Quarantine"
            ],
            "total_threats_neutralized": self.total_blocked_probes,
            "currently_quarantined_bot_ips": active_bans,
            "recent_incidents": list(reversed(self.blocked_events[-10:]))
        }

security_tracker = SecurityAuditTracker()

class SecurityWAFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = get_client_ip(request)
        path = request.url.path
        method = request.method

        # 1. Enforce allowed HTTP methods
        if method not in ALLOWED_METHODS:
            security_tracker.record_probe(client_ip, path, method, "Invalid/Dangerous HTTP Method")
            return JSONResponse(
                status_code=405,
                content={"error": "Method Not Allowed", "shield": "GeoForge WAF"}
            )

        # 2. Check if IP is currently quarantined for prior scan attempts
        if security_tracker.is_quarantined(client_ip):
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Access Temporarily Suspended",
                    "message": "Your IP has been quarantined due to automated security rule violations. Try again later.",
                    "shield": "GeoForge WAF"
                }
            )

        # 3. Check for automated exploit / vulnerability bot scanning probes
        if PROBE_REGEX.search(path):
            security_tracker.record_probe(client_ip, path, method, "Known Exploit / Probe Pattern")
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Access Forbidden",
                    "message": "Automated security scanner probe intercepted by GeoForge WAF Shield.",
                    "shield": "GeoForge WAF"
                }
            )

        # 4. Check for payload size excess
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_BYTES:
            security_tracker.record_probe(client_ip, path, method, "Payload size exceeds 12MB limit")
            return JSONResponse(
                status_code=413,
                content={"error": "Payload Too Large", "shield": "GeoForge WAF"}
            )

        # 5. Process normal application request
        response: Response = await call_next(request)

        # 6. Inject OWASP Hardened Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Content Security Policy (allows local assets, fonts, Leaflet maps, and WebSockets)
        csp = (
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: wss: ws:; "
            "connect-src 'self' https: wss: ws:; "
            "img-src 'self' data: blob: https:; "
            "font-src 'self' data: https:;"
        )
        response.headers["Content-Security-Policy"] = csp

        # Remove fingerprinting headers
        if "server" in response.headers:
            del response.headers["server"]
        if "x-powered-by" in response.headers:
            del response.headers["x-powered-by"]

        return response
