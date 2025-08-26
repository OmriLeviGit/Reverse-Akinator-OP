# server/config/vector_db.py
import chromadb
from sentence_transformers import SentenceTransformer
from .settings import VECTOR_DB_PATH, EMBEDDING_MODEL, COLLECTION_NAME, COLLECTION_METADATA, CHUNK_SIZE

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
        print("Found existing collection")
    except:
        collection = client.create_collection(
            name=COLLECTION_NAME,
            metadata=COLLECTION_METADATA
        )
        print("Created new collection")

    return client, collection, get_embedding_model()


def add_character_to_db(collection, model, name, structured_data, narrative_text):
    """Add a character with chunking - handles both string and list of narratives"""

    # Handle multiple narratives
    if isinstance(narrative_text, list):
        all_chunks = []
        for narrative in narrative_text:
            chunks = _chunk_text(narrative)  # Helper function
            all_chunks.extend(chunks)
    else:
        all_chunks = _chunk_text(narrative_text)

    # Add each chunk to database
    for i, chunk in enumerate(all_chunks):
        embedding = model.encode([chunk])
        collection.add(
            embeddings=embedding.tolist(),
            documents=[chunk],
            metadatas=[{
                'character_name': name,
                'chunk_id': i,
                'total_chunks': len(all_chunks),
                **structured_data
            }],
            ids=[f"{name.replace(' ', '_')}_chunk_{i}"]
        )

    print(f"Added {name} with {len(all_chunks)} chunks")


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