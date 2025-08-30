# server/services/prompt_service.py
import os
import json
import re

from server.config import COLLECTION_NAME, get_embedding_model, get_vector_client, GAME_PROMPT_PATH
from server.schemas.arc_schemas import Arc
from server.schemas.character_schemas import Character


class PromptService:
    """Service for handling all prompt construction and template management"""
    
    def __init__(self):
        self.template_path = GAME_PROMPT_PATH

    def create_game_prompt(self, character: Character, forbidden_arcs: list[Arc]) -> str:
        """Create the initial prompt for the LLM using the template file"""
        # Read the prompt template
        with open(self.template_path, 'r', encoding='utf-8') as f:
            template = f.read()
        
        # Build appearance info from character object
        appearance_parts = []
        if character.chapter:
            appearance_parts.append(f"Chapter: {character.chapter}")
        if character.episode:
            appearance_parts.append(f"Episode: {character.episode}")
        
        appearance_info = "\n".join(appearance_parts) if appearance_parts else "No specific appearance info"
        
        # Build static character profile (without structured data)
        client = get_vector_client()
        collection = client.get_collection(COLLECTION_NAME)

        character_profile = f"""SECRET CHARACTER: {character.name}
APPEARANCE INFO: {appearance_info}
CHARACTER TYPE: {character.filler_status}"""

        # Get structured data for the target character
        try:
            target_results_data = collection.get(
                where={"character_id": character.id},
                include=['metadatas']
            )

            # Extract and add structured data from target character (from first result)
            if target_results_data['metadatas'] and len(target_results_data['metadatas']) > 0:
                structured_data_json = target_results_data['metadatas'][0].get('structured_data', '{}')
                try:
                    structured_data = json.loads(structured_data_json) if structured_data_json else {}
                    if structured_data:
                        structured_info = []
                        for key, value in structured_data.items():
                            if value:  # Only include non-empty values
                                structured_info.append(f"{key}: {value}")

                        if structured_info:
                            character_profile += f"\n[STRUCTURED DATA]\n" + "\n".join(structured_info)
                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
        except Exception as e:
            print(f"Error getting character structured data: {e}")

        # Handle spoiler restrictions section
        if forbidden_arcs:
            # Create comma-separated list of forbidden arc names
            spoiler_arc_names = ", ".join(arc.name for arc in forbidden_arcs) + "AND ANYTHING AFTER"
            prompt = template.replace("{SPOILER_ARCS}", spoiler_arc_names)
        else:
            # Remove the entire spoiler restrictions section if no forbidden arcs
            spoiler_section_pattern = r'<spoiler_restrictions>.*?</spoiler_restrictions>\s*'
            prompt = re.sub(spoiler_section_pattern, '', template, flags=re.DOTALL)
        
        # Replace character profile placeholder
        prompt = prompt.replace("{CHARACTER_PROFILE_PLACEHOLDER}", character_profile)
        
        return prompt
    
    def get_character_context(self, character_id: str, question: str, target_results: int = 10, other_results: int = 0)\
            -> str:
        """Get relevant character context from vector database based on question"""
        client = get_vector_client()
        model = get_embedding_model()
        collection = client.get_collection(COLLECTION_NAME)

        # Encode the question to find similar content
        query_embedding = model.encode([question])

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
            # Group chunks by field type (e.g., [appearance], [history], etc.)
            grouped_chunks = {}
            for chunk in target_chunks:
                # Extract the field type from the chunk (e.g., [appearance], [history])
                if chunk.startswith('[') and ']' in chunk:
                    field_type = chunk.split(']')[0] + ']'
                    content = chunk.split(']', 1)[1].strip()
                    if field_type not in grouped_chunks:
                        grouped_chunks[field_type] = []
                    grouped_chunks[field_type].append(f"- {field_type} {content}")
                else:
                    # If no field type, put in 'other' category
                    if '[other]' not in grouped_chunks:
                        grouped_chunks['[other]'] = []
                    grouped_chunks['[other]'].append(f"- {chunk}")
            
            # Sort field types with [introduction] first, then alphabetically
            sorted_chunks = []
            field_types = list(grouped_chunks.keys())
            
            # Add [introduction] first if it exists
            if '[introduction]' in field_types:
                sorted_chunks.extend(grouped_chunks['[introduction]'])
                field_types.remove('[introduction]')
            
            # Add remaining field types alphabetically
            for field_type in sorted(field_types):
                sorted_chunks.extend(grouped_chunks[field_type])
            
            context_parts.append(f"[TARGET CHARACTER CONTEXT]\n" + "\n".join(sorted_chunks))

        if other_results > 0:
            # Search for relevant chunks from other characters
            other_results_data = collection.query(
                query_embeddings=query_embedding.tolist(),
                where={"character_id": {"$ne": character_id}},  # Not equal to target character
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
                context_parts.append(f"[OTHER CHARACTERS CONTEXT THAT MAY OR MAY NOT BE RELATED]\n" + "\n".join(other_chunks))

        return "\n\n".join(context_parts) if context_parts else ""
    
    def build_dynamic_prompt(self, base_prompt: str, character_context: str, chat_history: list, question: str) -> str:
        """Build the complete prompt with dynamic content for a specific question"""
        updated_prompt = base_prompt
        
        # Add character context to the existing character profile
        if character_context:
            # Find the existing character profile in the prompt
            if '<character_profile>' in updated_prompt and '</character_profile>' in updated_prompt:
                # Extract the existing profile content
                start = updated_prompt.find('<character_profile>') + len('<character_profile>')
                end = updated_prompt.find('</character_profile>')
                existing_profile = updated_prompt[start:end].strip()
                
                # Create enhanced profile with structured data
                enhanced_profile = f"{existing_profile}\n\n{character_context}"
                
                # Replace the profile section
                updated_prompt = (
                    updated_prompt[:start] + 
                    f"\n{enhanced_profile}\n" + 
                    updated_prompt[end:]
                )
        
        # Add chat history
        if chat_history:
            history_text = "\n".join([
                f"User: {msg.content}" if hasattr(msg, 'type') and msg.type == "human" 
                else f"Assistant: {msg.content}" 
                for msg in chat_history
            ])
            updated_prompt = updated_prompt.replace("{CHAT_HISTORY_PLACEHOLDER}", history_text)
        else:
            updated_prompt = updated_prompt.replace("{CHAT_HISTORY_PLACEHOLDER}", "No previous conversation")
        
        # Add current question
        updated_prompt = updated_prompt.replace("{CURRENT_QUESTION}", question)
        
        return updated_prompt