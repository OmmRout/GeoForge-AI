import time
from collections import defaultdict
from fastapi import Request
from slowapi import Limiter
from app.core.security import get_client_ip

# SlowAPI Limiter instance using real client IP behind reverse proxy (Render / Cloudflare)
limiter = Limiter(key_func=get_client_ip)

# In-memory Token Bucket rate limiter for custom endpoints or websockets
class TokenBucketLimiter:
    def __init__(self, capacity: int = 60, refill_rate: float = 1.0):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.tokens = defaultdict(lambda: float(capacity))
        self.last_update = defaultdict(lambda: time.time())

    def allow_request(self, client_ip: str) -> bool:
        now = time.time()
        elapsed = now - self.last_update[client_ip]
        self.last_update[client_ip] = now
        
        # Refill tokens
        self.tokens[client_ip] = min(self.capacity, self.tokens[client_ip] + elapsed * self.refill_rate)
        
        if self.tokens[client_ip] >= 1.0:
            self.tokens[client_ip] -= 1.0
            return True
        return False

telemetry_token_limiter = TokenBucketLimiter(capacity=100, refill_rate=10.0)
