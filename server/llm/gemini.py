import google.generativeai as genai
from .llm_interface import LLMInterface


class GeminiLLM(LLMInterface):
    """Gemini LLM implementation."""

    def __init__(self, model_name: str = 'gemini-1.5-flash'):
        super().__init__()  # This now handles environment loading

        api_key = self._get_required_env_var('GEMINI_API_KEY')
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)

    def query(self, prompt: str, user_identifier: str = None, max_requests: int = 10, window_seconds: int = 60) -> str:
        """Query the Gemini API with rate limiting."""

        if user_identifier and self._is_rate_limited(user_identifier, max_requests, window_seconds):
            raise RuntimeError("Rate limit exceeded. Please wait before making another request.")

        try:
            response = self.model.generate_content(prompt)
            return response.candidates[0].content.parts[0].text
        except Exception as e:
            raise RuntimeError(f"Error querying Gemini: {e}")