# server/config/vector_db.py
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer
import sys
import json

sys.path.append(str(Path(__file__).parent.parent.parent))

from guessing_game.config import VECTOR_DB_PATH, EMBEDDING_MODEL, COLLECTION_NAME, COLLECTION_METADATA, \
    CHUNK_SIZE

# ChromaDB configuration
CHROMA_SETTINGS = chromadb.config.Settings(
    persist_directory=str(VECTOR_DB_PATH),
    anonymized_telemetry=False
)


def get_vector_client():
    """Get ChromaDB client"""
    return chromadb.PersistentClient(
        path=str(VECTOR_DB_PATH),
        settings=CHROMA_SETTINGS
    )


def get_embedding_model():
    """Get the embedding model (cached)"""
    if not hasattr(get_embedding_model, '_model'):
        get_embedding_model._model = SentenceTransformer(EMBEDDING_MODEL)

    return get_embedding_model._model


def initialize_collection():
    """Initialize the database and model"""
    client = get_vector_client()

    try:
        collection = client.get_collection(COLLECTION_NAME)
    except:
        print("Creating a new collection...")
        collection = client.create_collection(
            name=COLLECTION_NAME,
            metadata=COLLECTION_METADATA
        )

    return client, collection, get_embedding_model()


def add_character_to_db(collection, model, character_id, structured_data, narrative_sections):
    """Add a character with chunking - handles narrative sections dict"""

    # Handle case where no narratives found
    if not narrative_sections:
        print(f"No narrative content found for {character_id}")
        return

    # Create chunks by combining paragraphs from same sections
    all_chunks = _create_section_based_chunks(narrative_sections)

    # Add each chunk to database
    for i, chunk in enumerate(all_chunks):
        embedding = model.encode([chunk])
        collection.add(
            embeddings=embedding.tolist(),
            documents=[chunk],
            metadatas=[{
                'character_id': character_id,
                'chunk_id': i,
                'total_chunks': len(all_chunks),
                'structured_data': json.dumps(structured_data)
            }],
            ids=[f"{character_id}_chunk_{i}"]
        )

    print(f"Added {character_id} with {len(all_chunks)} chunks and {len(structured_data)} structured data entries")




def _count_words(text):
    """Count words in text"""
    return len(text.split())


def _create_section_based_chunks(narrative_sections):
    """Create chunks by combining paragraphs from same sections, maintaining order"""
    all_chunks = []

    # Convert sections to ordered list preserving section order
    ordered_paragraphs = []
    for section_name, paragraphs in narrative_sections.items():
        for paragraph_text in paragraphs:
            ordered_paragraphs.append((section_name, paragraph_text))

    if not ordered_paragraphs:
        return []

    current_chunk = ""
    current_section = None
    last_finalized_section = None  # Track section of last chunk added to all_chunks

    for section_name, paragraph_text in ordered_paragraphs:

        # If we're switching sections, finalize current chunk
        if current_section is not None and current_section != section_name:
            if current_chunk:  # Only finalize if we have content
                all_chunks.append(current_chunk.strip())
                last_finalized_section = current_section
            current_chunk = ""

        current_section = section_name

        # Add current paragraph to the chunk
        if current_chunk:
            current_chunk += " " + paragraph_text
        else:
            current_chunk = paragraph_text

        # If chunk is now >= target size, finalize it
        if _count_words(current_chunk) >= CHUNK_SIZE:
            all_chunks.append(current_chunk.strip())
            last_finalized_section = current_section
            current_chunk = ""
            current_section = None  # Reset section so next paragraph starts fresh

    # Add final chunk if any content remains
    if current_chunk:
        all_chunks.append(current_chunk.strip())
        # Check if we should merge with previous chunk (same section and small)
        if (len(all_chunks) > 1 and
                _count_words(all_chunks[-1]) < CHUNK_SIZE // 2 and
                last_finalized_section == current_section):
            last_chunk = all_chunks.pop()
            all_chunks[-1] += " " + last_chunk

    return all_chunks

def _chunk_text(text):
    """Helper function to chunk a single text (deprecated - use _create_section_based_chunks)"""
    if _count_words(text) <= CHUNK_SIZE:
        return [text]

    chunks = []
    sentences = text.split('. ')
    current_chunk = ""

    for sentence in sentences:
        test_chunk = current_chunk + sentence + ". " if current_chunk else sentence + ". "
        if _count_words(test_chunk) <= CHUNK_SIZE:
            current_chunk = test_chunk
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks

def inspect_collection():
    """Inspect the contents of the vector database collection"""
    client = get_vector_client()
    
    try:
        collection = client.get_collection(COLLECTION_NAME)
        
        # Get basic stats
        count = collection.count()
        print(f"Collection '{COLLECTION_NAME}' contains {count} items")
        
        if count > 0:
            # Get a sample of items to see structure
            sample_size = min(5, count)
            results = collection.get(limit=sample_size)
            
            print(f"\nSample of {sample_size} items:")
            for i in range(len(results['ids'])):
                print(f"\nID: {results['ids'][i]}")
                print(f"Metadata: {results['metadatas'][i]}")
                print(f"Document preview: {results['documents'][i][:100]}...")
        
        return collection
        
    except Exception as e:
        print(f"Error inspecting collection: {e}")
        return None


def query_characters(query_text, n_results=5):
    """Query the vector database for similar characters"""
    client = get_vector_client()
    model = get_embedding_model()
    
    try:
        collection = client.get_collection(COLLECTION_NAME)
        
        # Generate embedding for query
        query_embedding = model.encode([query_text])
        
        # Query the collection
        results = collection.query(
            query_embeddings=query_embedding.tolist(),
            n_results=n_results
        )
        
        print(f"Query: '{query_text}'")
        print(f"Found {len(results['ids'][0])} results:")
        
        for i in range(len(results['ids'][0])):
            print(f"\nResult {i+1}:")
            print(f"ID: {results['ids'][0][i]}")
            print(f"Distance: {results['distances'][0][i]:.4f}")
            print(f"Character: {results['metadatas'][0][i].get('character_id', 'Unknown')}")
            print(f"Content: {results['documents'][0][i][:200]}...")
        
        return results
        
    except Exception as e:
        print(f"Error querying collection: {e}")
        return None


if __name__ == "__main__":
    print("This module provides vector database utilities.")
    print("To initialize the database with all characters, run:")
    print("python -m server.database.bootstrap_tools.vector_database_builder")
    print("\nTo inspect the current database contents:")
    print("python -c \"from guessing_game.config.vector_db import inspect_collection; inspect_collection()\"")
    print("\nTo query the database:")
    print("python -c \"from guessing_game.config.vector_db import query_characters; query_characters('your query here')\")")

    inspect_collection()