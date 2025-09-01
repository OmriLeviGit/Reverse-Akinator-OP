from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models import BaseLanguageModel

import time
import os
from collections import defaultdict, deque

class LLMService:
    def __init__(self):
        self._requests = defaultdict(deque)
        self._current_model = None
        load_dotenv()

    def set_model(self, provider: str, **kwargs) -> BaseLanguageModel:
        """Set the current model. LangChain handles the interface consistency."""
        if provider == 'gemini':
            model = kwargs.pop('model', 'gemini-1.5-flash')
            self._current_model = ChatGoogleGenerativeAI(
                model=model,
                google_api_key=os.getenv('GEMINI_API_KEY'),
                **kwargs
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")

        return self._current_model

    def query(self, prompt: str, user_id: str = None, max_requests: int = 10,
              window_seconds: int = 60) -> str:
        """Query the current model with rate limiting."""

        if not self._current_model:
            raise RuntimeError("No model set. Call set_model() first.")

        if user_id and self._is_rate_limited(user_id, max_requests, window_seconds):
            raise RuntimeError("Rate limit exceeded. Please wait before making another request.")

        try:
            return self._current_model.invoke(prompt).content  # Updated method
        except Exception as e:
            raise RuntimeError(f"Error querying LLM: {e}")

    def _is_rate_limited(self, user_id: str, max_requests: int, window_seconds: int) -> bool:
        """Check if request should be rate limited."""
        now = time.time()
        user_requests = self._requests[user_id]

        while user_requests and user_requests[0] <= now - window_seconds:
            user_requests.popleft()

        if len(user_requests) >= max_requests:
            return True

        user_requests.append(now)
        return False

    def get_current_model_info(self) -> str:
        """Get info about the currently set model."""
        if not self._current_model:
            return "No model set"
        return f"Current model: {type(self._current_model).__name__}"