# # server/config/redis.py
# import redis
# import os
#
# from server.config import REDIS_URL
#
# #
# # # Use environment variables but with fallback to default
# # REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
# # REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
# # REDIS_DB = int(os.getenv('REDIS_DB', 0))
# #
# # # Build Redis URL from components
# # REDIS_URL = os.getenv("REDIS_URL", f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}")
#
# redis_client = redis.from_url(REDIS_URL, decode_responses=True)
#
# def get_redis() -> redis.Redis:
#     return redis_client