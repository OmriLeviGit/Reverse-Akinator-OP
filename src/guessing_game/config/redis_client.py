# server/config/redis.py
from pathlib import Path
import sys
import redis
from redis.exceptions import ConnectionError, TimeoutError

sys.path.append(str(Path(__file__).parent.parent.parent))

from guessing_game.config.settings import REDIS_URL

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def get_redis() -> redis.Redis:
    return redis_client

def test_redis_connection() -> tuple[bool, str]:
    """Test Redis connection and return status with clear error message"""
    try:
        redis_client.ping()
        return True, "Redis connection successful"
    except ConnectionError:
        return False, f"Cannot connect to Redis server at {REDIS_URL}. Please ensure Redis is running."
    except TimeoutError:
        return False, f"Redis connection timeout at {REDIS_URL}. Server may be overloaded."
    except Exception as e:
        return False, f"Redis connection error: {str(e)}"