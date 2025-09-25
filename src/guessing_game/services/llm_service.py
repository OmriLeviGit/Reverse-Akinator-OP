from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models import BaseLanguageModel
from langchain_core.tools import tool
from typing import Literal

import time
import os
from collections import defaultdict, deque


class LLMService:
    def __init__(self):
        self._requests = defaultdict(deque)
        self._violations = defaultdict(int)
        self._current_model = None
        self._game_model = None
        load_dotenv()
        self._game_tool = self._create_game_tool()

    def _create_game_tool(self):
        @tool
        def game_answer(
                reasoning: str,
                answer: Literal["Yes", "No", "I can't answer that"]
        ) -> dict:
            """Provide a game answer with detailed reasoning."""
            return {"reasoning": reasoning, "answer": answer}

        return game_answer

    def set_model(self, provider: str, **kwargs) -> BaseLanguageModel:
        """Set the current model. LangChain handles the interface consistency."""
        if provider == 'gemini':
            if not os.getenv('GEMINI_API_KEY'):
                print("WARNING: GEMINI_API_KEY is not set. LLM functionality will not work.")
                return None

            model = kwargs.pop('model', 'gemini-2.5-flash')
            temperature = kwargs.pop('temperature', 0.1)

            # Create base model
            self._current_model = ChatGoogleGenerativeAI(
                model=model,
                temperature=temperature,
                google_api_key=os.getenv('GEMINI_API_KEY'),
                **kwargs
            )

            # Create game model with tools bound
            self._game_model = self._current_model.bind_tools([self._game_tool])

        else:
            raise ValueError(f"Unsupported provider: {provider}")

        return self._current_model

    def generate(self, prompt, user_id: str = None, max_requests: int = 10, window_seconds: int = 60) -> str:
        """
        Raw LLM generation - returns exactly what the model outputs.
        Use for general text generation, descriptions, fun facts, etc.
        """
        if not os.getenv('GEMINI_API_KEY'):
            raise RuntimeError("API key is required. Please set GEMINI_API_KEY environment variable.")

        if not self._current_model:
            raise RuntimeError("No model set. Call set_model() first.")

        if user_id and self._is_rate_limited(user_id, max_requests, window_seconds):
            self._violations[user_id] += 1
            violation_count = self._violations[user_id]
            if violation_count >= 3:
                print(f"CRITICAL: User {user_id} exceeded rate limit 3 times. Shutting down server.")
                import sys
                sys.exit(1)
            raise RuntimeError(
                f"Rate limit exceeded ({violation_count}/3 violations). Server will shutdown after 3 violations.")

        try:
            return self._current_model.invoke(prompt).content
        except Exception as e:
            raise RuntimeError(f"Error querying LLM: {e}")

    def ask_game_question(self, prompt: list[BaseMessage], user_id: str = None, max_requests: int = 10,
                          window_seconds: int = 60) -> dict:
        """
        Game-specific method that uses structured output via function calling.
        Returns dict with 'reasoning' and 'answer' fields.
        """
        if not os.getenv('GEMINI_API_KEY'):
            raise RuntimeError("API key is required. Please set GEMINI_API_KEY environment variable.")

        if not self._game_model:
            raise RuntimeError("No model set. Call set_model() first.")

        if user_id and self._is_rate_limited(user_id, max_requests, window_seconds):
            self._violations[user_id] += 1
            violation_count = self._violations[user_id]
            if violation_count >= 3:
                print(f"CRITICAL: User {user_id} exceeded rate limit 3 times. Shutting down server.")
                import sys
                sys.exit(1)
            raise RuntimeError(
                f"Rate limit exceeded ({violation_count}/3 violations). Server will shutdown after 3 violations.")

        try:
            # Add instruction to use the tool

            response = self._game_model.invoke(
                prompt,
                tool_config={
                    "function_calling_config": {
                        "mode": "ANY"  # Forces the model to use a tool
                    }
                }
            )

            # Extract the function call result
            if hasattr(response, 'tool_calls') and response.tool_calls:
                tool_call = response.tool_calls[0]
                return {
                    "reasoning": tool_call['args']['reasoning'],
                    "answer": tool_call['args']['answer']
                }
            else:
                # Fallback if no tool call (shouldn't happen with proper prompting)
                print("Warning: No tool call in response, using fallback")
                return {
                    "reasoning": "Error: Model did not use the structured response tool",
                    "answer": "I can't answer that"
                }

        except Exception as e:
            print(f"Error in game question: {e}")
            return {
                "reasoning": f"Error processing question: {str(e)}",
                "answer": "I can't answer that"
            }

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