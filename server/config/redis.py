# server/config/redis.py
import redis
from .settings import REDIS_URL

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def get_redis() -> redis.Redis:
    return redis_client