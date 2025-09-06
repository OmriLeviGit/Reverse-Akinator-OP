# server/services/prompt_service.py
import json
import re

from langchain_core.messages import SystemMessage, HumanMessage

from guessing_game.config import COLLECTION_NAME, get_embedding_model, get_vector_client, GAME_PROMPT_PATH
from guessing_game.schemas.arc_schemas import Arc
from guessing_game.schemas.character_schemas import FullCharacter


class PromptService:
    """Service for handling all prompt construction and template management"""
    
    def __init__(self):
        self.template_path = GAME_PROMPT_PATH

    def create_game_prompt(self, character: FullCharacter, forbidden_arcs: list[Arc]) -> str:
        """Create the initial prompt for the LLM using the template file"""
        # Read the prompt template
        with open(self.template_path, 'r', encoding='utf-8') as f:
            template = f.read()

        # Handle spoiler restrictions section
        if forbidden_arcs:
            # Create comma-separated list of forbidden arc names
            spoiler_arc_names = ", ".join(arc.name for arc in forbidden_arcs) + " and anything after"
            prompt = template.replace("{SPOILER_ARCS}", spoiler_arc_names)
        else:
            # Remove the entire spoiler restrictions section if no forbidden arcs
            spoiler_section_pattern = r'<spoiler_restrictions>.*?</spoiler_restrictions>\n*'
            prompt = re.sub(spoiler_section_pattern, '', template, flags=re.DOTALL)

        character_profile = self._build_character_profile(character)

        # Replace character profile placeholder
        prompt = prompt.replace("{CHARACTER_PROFILE}", character_profile)

        return prompt

    def _build_character_profile(self, character: FullCharacter) -> str:
        """Build structured character profile"""
        sections = [f"SECRET CHARACTER: {character.name}"]

        # Appearance info
        if character.chapter or character.episode:
            appearance_parts = []
            if character.chapter:
                appearance_parts.append(f"Chapter: {character.chapter}")
            if character.episode:
                appearance_parts.append(f"Episode: {character.episode}")
            sections.append("First appearance: " + ", ".join(appearance_parts))

        # Structured data
        structured_info = self._get_structured_data(character.id)
        if structured_info:
            sections.append("[STRUCTURED DATA]")
            sections.extend(structured_info)

        return "\n".join(sections)

    def _get_structured_data(self, character_id: str) -> list[str]:
        """Get structured data for character from vector database"""
        client = get_vector_client()
        collection = client.get_collection(COLLECTION_NAME)

        try:
            target_results_data = collection.get(
                where={"character_id": character_id},
                include=['metadatas']
            )

            # Extract and process structured data from target character
            if target_results_data['metadatas'] and len(target_results_data['metadatas']) > 0:
                structured_data_json = target_results_data['metadatas'][0].get('structured_data', '{}')
                try:
                    structured_data = json.loads(structured_data_json) if structured_data_json else {}
                    if structured_data:
                        structured_info = []
                        for key, value in structured_data.items():
                            if value:
                                structured_info.append(f"{key}: {value}")
                        return structured_info
                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
        except Exception as e:
            print(f"Error getting character structured data: {e}")

        return []

    def get_character_context(self, character_id: str, question: str, target_results: int = 6,
                              other_results: int = 0) -> str:
        """Get relevant character context from vector database based on question"""
        client = get_vector_client()
        model = get_embedding_model()
        collection = client.get_collection(COLLECTION_NAME)

        # Enhance the question but also include original for character-specific keywords
        enhanced_query = self.enhance_question_for_search(question)

        # Encode the combined question to find similar content
        query_embedding = model.encode([enhanced_query])

        context_parts = []

        # Search for relevant chunks for the target character
        target_results_data = collection.query(
            query_embeddings=query_embedding.tolist(),
            where={"character_id": character_id},
            n_results=target_results,
            include=['documents', 'distances']
        )

        # Add relevant target character chunks
        target_chunks = []
        for doc, distance in zip(target_results_data['documents'][0], target_results_data['distances'][0]):
            if distance < 1.0:
                target_chunks.append(doc)

        if target_chunks:
            context_parts.append(f"[TARGET CHARACTER CONTEXT]\n" + "\n".join(target_chunks))

        if other_results > 0:
            # Search for relevant chunks from other characters
            other_results_data = collection.query(
                query_embeddings=query_embedding.tolist(),
                where={"character_id": {"$ne": character_id}},
                n_results=other_results,
                include=['documents', 'distances', 'metadatas']
            )

            # Add other character chunks
            other_chunks = []
            for doc, distance, metadata in zip(other_results_data['documents'][0],
                                               other_results_data['distances'][0],
                                               other_results_data['metadatas'][0]):
                if distance < 1.0:
                    other_char_id = metadata.get('character_id', 'unknown')
                    other_chunks.append(f"- {other_char_id}: {doc}")

            if other_chunks:
                context_parts.append(f"[OTHER CHARACTERS CONTEXT]\n" + "\n".join(other_chunks))

        return "\n\n".join(context_parts) if context_parts else ""

    def enhance_question_for_search(self, question: str) -> str:
        """Transform user question into better vector search terms"""

        # Map common question patterns to search terms
        question_mappings = {
            # Strength/Power questions
            r'strong|powerful|strength': 'physical strength combat ability fighting power battle',
            r'devil fruit|powers|abilities': 'devil fruit powers abilities special skills',

            # Relationship questions
            r'family|relative|parent|child|kid|brother|sister|sibling': 'family parents children siblings relatives blood relation',
            r'crew|team|group|member': 'crew pirates marines organization group affiliation',
            r'friend|ally|enemy': 'relationships allies enemies friends rivals interactions',

            # Physical appearance
            r'young|old|age': 'age years old appearance youth elderly',
            r'hair|color': 'hair color appearance physical features',

            # Personality
            r'good|evil|bad|moral': 'personality morality character behavior alignment ethics',

            # Role/Status
            r'captain|leader': 'captain leader commander authority position role',
            r'citizen': 'occupation job civilian family',
        }

        question_lower = question.lower()

        # Find matching enhancement terms
        enhanced_terms = None
        for pattern, search_terms in question_mappings.items():
            if re.search(pattern, question_lower):
                enhanced_terms = search_terms
                break

        # Always include the original question, plus enhanced terms if found
        if enhanced_terms:
            return f"{enhanced_terms} {question}"

        return question

    def build_dynamic_prompt(self, base_prompt: str, character_context: str, chat_history: list, question: str) -> list:
        """Build the complete message sequence with dynamic content for a specific question"""
        # Replace the RELEVANT_CONTEXT placeholder in the system prompt
        system_content = base_prompt.replace("{RELEVANT_CONTEXT}", f"\n[RELEVANT CONTEXT]\n{character_context}")
        
        # Build message sequence
        messages = [
            SystemMessage(content=system_content),
            *chat_history,  # Already HumanMessage/AIMessage objects from LangChain memory
            HumanMessage(content=question)  # Current question
        ]
        
        return messages

    def create_character_description(self, character_id: str) -> str | None:
        """Create a fun, spoiler-free description of a character focusing on personality and relationships"""
        client = get_vector_client()
        model = get_embedding_model()
        collection = client.get_collection(COLLECTION_NAME)

        # Search for character info focusing on personality and relationships
        personality_query = "personality traits character behavior relationships friends allies enemies interactions social abilities power"
        query_embedding = model.encode([personality_query])

        # Get relevant character information
        results = collection.query(
            query_embeddings=query_embedding.tolist(),
            where={"character_id": character_id},
            n_results=10,
            include=['documents', 'distances']
        )

        # Filter and collect relevant chunks
        relevant_chunks = []
        for doc, distance in zip(results['documents'][0], results['distances'][0]):
            if distance < 1.0:
                relevant_chunks.append(doc)

        if not relevant_chunks:
            return

        # Create context for the LLM
        character_info = "\n".join(relevant_chunks)
        
        # Prompt for generating the description
        description_prompt = f"""You are a character expert. Based on the following information about a character, write a short fun and engaging 1-2 sentence description that focuses on their personality and relationships with others. Avoid major plot spoilers.

Character Information:
{character_info}

Write the character description now:"""

        return description_prompt

    def create_character_fun_fact(self, character_id: str) -> str | None:
        """Create a fun and interesting fact about a character"""
        client = get_vector_client()
        model = get_embedding_model()
        collection = client.get_collection(COLLECTION_NAME)

        # Search for character info focusing on interesting details, trivia, and unique aspects
        fun_fact_query = "interesting facts trivia unique unusual special abilities powers quirks habits hobbies talents skills achievements background history origins"
        query_embedding = model.encode([fun_fact_query])

        # Get relevant character information
        results = collection.query(
            query_embeddings=query_embedding.tolist(),
            where={"character_id": character_id},
            n_results=10,
            include=['documents', 'distances']
        )

        # Filter and collect relevant chunks
        relevant_chunks = []
        for doc, distance in zip(results['documents'][0], results['distances'][0]):
            if distance < 1.0:  # More selective threshold for quality
                relevant_chunks.append(doc)

        if not relevant_chunks:
            return None

        # Create context for the LLM
        character_info = "\n".join(relevant_chunks)
        
        # Prompt for generating the fun fact
        fun_fact_prompt = f"""You are a character trivia expert. Based on the following information about a character, write one interesting and fun fact about them. Focus on something unique, surprising, or entertaining about their abilities, personality traits, quirks, or physical characteristics. Keep it to one short sentence and avoid any plot events, story outcomes, or narrative developments.

Character Information:
{character_info}

Write one fun fact about this character now:"""

        return fun_fact_prompt
