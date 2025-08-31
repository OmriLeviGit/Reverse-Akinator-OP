# server/config/vector_db.py
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer
import csv
import sys
import json

sys.path.append(str(Path(__file__).parent.parent.parent))

from server.config import VECTOR_DB_PATH, EMBEDDING_MODEL, COLLECTION_NAME, COLLECTION_METADATA, CHARACTER_CSV_PATH, \
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
        print("Loading embedding model (this may take a few minutes on first run)...")
        get_embedding_model._model = SentenceTransformer(EMBEDDING_MODEL)

    return get_embedding_model._model


def initialize_collection():
    """Initialize the database and model"""
    client = get_vector_client()

    try:
        collection = client.get_collection(COLLECTION_NAME)
        print("Found existing collection")
    except:
        collection = client.create_collection(
            name=COLLECTION_NAME,
            metadata=COLLECTION_METADATA
        )
        print("Created new collection")

    return client, collection, get_embedding_model()


def load_characters_from_csv(csv_path=CHARACTER_CSV_PATH):
    """Load character data from CSV file"""
    characters = []

    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                wiki_url = row.get('Wiki')
                character_id = row.get('ID')

                if wiki_url and character_id and isinstance(wiki_url, str) and wiki_url.strip():
                    characters.append({
                        'id': character_id,
                        'url': wiki_url.strip()
                    })

    except FileNotFoundError:
        print(f"Error: Could not find CSV file at {csv_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)

    return characters


def add_character_to_db(collection, model, character_id, structured_data, narrative_sections):
    """Add a character with chunking - handles narrative sections dict"""

    # Convert narrative sections to list of paragraphs for chunking
    all_narratives = []
    for section_name, paragraphs in narrative_sections.items():
        for paragraph in paragraphs:
            all_narratives.append(f"[{section_name}] {paragraph}")

    # Handle case where no narratives found
    if not all_narratives:
        print(f"No narrative content found for {character_id}")
        return

    # Chunk all narratives
    all_chunks = []
    for narrative in all_narratives:
        chunks = _chunk_text(narrative)
        all_chunks.extend(chunks)

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




def _chunk_text(text):
    """Helper function to chunk a single text"""
    if len(text) <= CHUNK_SIZE:
        return [text]

    chunks = []
    sentences = text.split('. ')
    current_chunk = ""

    for sentence in sentences:
        if len(current_chunk + sentence) < CHUNK_SIZE:
            current_chunk += sentence + ". "
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
    print("python -c \"from server.config.vector_db import inspect_collection; inspect_collection()\"")
    print("\nTo query the database:")
    print("python -c \"from server.config.vector_db import query_characters; query_characters('your query here')\")")

    inspect_collection()