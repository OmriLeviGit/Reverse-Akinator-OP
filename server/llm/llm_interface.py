from abc import ABC, abstractmethod
import os
import time
from collections import defaultdict, deque
from dotenv import load_dotenv


class LLMInterface(ABC):
    """Abstract interface for LLM providers."""

    # Class-level attribute for rate limiting
    _requests = defaultdict(deque)

    def __init__(self):
        self._load_env_file()

    def _load_env_file(self):
        """Load environment variables from .env file relative to the concrete implementation."""
        # Get the directory of the concrete class file (not this interface file)
        concrete_class_file = self.__class__.__module__.replace('.', os.sep) + '.py'
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(concrete_class_file)))
        env_path = os.path.join(script_dir, '.env')

        result = load_dotenv(env_path)
        if not result:
            print(f"Warning: Could not load .env from {env_path}")

    def _get_required_env_var(self, var_name: str) -> str:
        """Get a required environment variable or raise an error."""
        value = os.getenv(var_name)
        if not value:
            raise ValueError(f"{var_name} not found in environment variables")
        return value

    def _is_rate_limited(self, identifier: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
        """Check if request should be rate limited."""
        now = time.time()
        user_requests = self._requests[identifier]

        # Remove old requests outside the window
        while user_requests and user_requests[0] <= now - window_seconds:
            user_requests.popleft()

        # Check if over limit
        if len(user_requests) >= max_requests:
            return True

        # Add current request
        user_requests.append(now)
        return False

    @abstractmethod
    def query(self, prompt: str, user_identifier: str = None, max_requests: int = 10, window_seconds: int = 60) -> str:
        """Send a prompt to the LLM and return the response."""
        pass