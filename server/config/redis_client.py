# server/config/redis.py
from pathlib import Path
import sys
import redis

sys.path.append(str(Path(__file__).parent.parent.parent))

from server.config.settings import REDIS_URL

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def get_redis() -> redis.Redis:
    return redis_client