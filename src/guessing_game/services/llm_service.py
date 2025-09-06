from dotenv import load_dotenv
from langchain_core.messages import BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models import BaseLanguageModel

import time
import os
import json
from collections import defaultdict, deque

class LLMService:
    def __init__(self):
        self._requests = defaultdict(deque)
        self._violations = defaultdict(int)  # Track repeat offenses
        self._current_model = None
        load_dotenv()

    def set_model(self, provider: str, **kwargs) -> BaseLanguageModel:
        """Set the current model. LangChain handles the interface consistency."""
        if provider == 'gemini':
            model = kwargs.pop('model', 'gemini-1.5-flash')
            temperature = kwargs.pop('temperature', 0.1)
            self._current_model = ChatGoogleGenerativeAI(
                model=model,
                temperature=temperature,
                google_api_key=os.getenv('GEMINI_API_KEY'),
                **kwargs
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")

        return self._current_model

    def generate(self, prompt, user_id: str = None, max_requests: int = 10, window_seconds: int = 60) -> str:
        """
        Raw LLM generation - returns exactly what the model outputs.
        Use for general text generation, descriptions, fun facts, etc.
        """
        if not self._current_model:
            raise RuntimeError("No model set. Call set_model() first.")

        if user_id and self._is_rate_limited(user_id, max_requests, window_seconds):
            self._violations[user_id] += 1
            violation_count = self._violations[user_id]
            if violation_count >= 3:
                print(f"CRITICAL: User {user_id} exceeded rate limit 3 times. Shutting down server.")
                import sys
                sys.exit(1)
            raise RuntimeError(f"Rate limit exceeded ({violation_count}/3 violations). Server will shutdown after 3 violations.")

        try:
            return self._current_model.invoke(prompt).content
        except Exception as e:
            raise RuntimeError(f"Error querying LLM: {e}")

    def ask_game_question(self, prompt: list[BaseMessage], user_id: str = None, max_requests: int = 10, window_seconds: int = 60) -> str:
        """
        Game-specific method that expects JSON response and validates answers.
        Returns one of: "Yes", "No", "I don't know", "I can't answer that"
        """
        response_text = self.generate(prompt, user_id, max_requests, window_seconds)
        return self._parse_game_response(response_text)

    def _parse_game_response(self, response_text: str) -> str:
        """Parse and validate game response, ensuring it's one of the valid answers."""
        try:
            # Clean potential markdown formatting
            json_text = response_text.strip()
            if json_text.startswith('```json'):
                json_text = json_text[7:]
            if json_text.endswith('```'):
                json_text = json_text[:-3]
            json_text = json_text.strip()
            
            response_data = json.loads(json_text)
            
            # Extract and validate the answer field
            if 'answer' in response_data:
                answer = response_data['answer']
                valid_answers = ["Yes", "No", "I don't know", "I can't answer that"]
                
                # Check if answer is valid (exact match)
                if answer in valid_answers:
                    return answer

                # Invalid answer in JSON
                print(f"Invalid answer in JSON: '{answer}', defaulting to 'I can't answer that'")
                return "I can't answer that"
            else:
                print(f"No 'answer' field in JSON response: {response_data}")
                return "I can't answer that"
                
        except json.JSONDecodeError:
            print(f"Invalid response format, defaulting to 'I can't answer that': {response_text}")
            return "I can't answer that"

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