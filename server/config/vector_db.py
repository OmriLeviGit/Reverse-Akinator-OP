# server/config/vector_db.py
import chromadb
from sentence_transformers import SentenceTransformer
import csv
import sys

from server.config import VECTOR_DB_PATH, EMBEDDING_MODEL, COLLECTION_NAME, COLLECTION_METADATA, CHARACTER_CSV_PATH, \
    CHUNK_SIZE
from server.database.bootstrap_tools.character_scraping import scrape_character

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
                **structured_data
            }],
            ids=[f"{character_id}_chunk_{i}"]
        )

    print(f"Added {character_id} with {len(all_chunks)} chunks and {len(structured_data)} structured data entries")


def initialize_database_with_all_characters():
    """Initialize the database by scraping and adding all characters from the CSV file"""
    print("Initializing database with all characters...")

    # Initialize database
    client, collection, model = initialize_collection()

    # Load all characters from CSV
    characters = load_characters_from_csv()

    if not characters:
        print("No characters found in CSV file")
        return

    print(f"Found {len(characters)} characters to process")

    # Process each character
    successful = 0
    failed = 0

    for i, char_info in enumerate(characters, 1):
        character_id = char_info['id']
        wiki_url = char_info['url']

        print(f"Processing {i}/{len(characters)}: {character_id}")

        try:
            # Scrape character data
            structured_data, narrative_sections = scrape_character(wiki_url)

            # Add to database
            add_character_to_db(collection, model, character_id, structured_data, narrative_sections)

            successful += 1

        except Exception as e:
            print(f"ERROR processing {character_id}: {e}")
            failed += 1
            continue

    # Summary
    print(f"\n{'=' * 60}")
    print("DATABASE INITIALIZATION COMPLETE")
    print(f"{'=' * 60}")
    print(f"Successfully processed: {successful}")
    print(f"Failed: {failed}")
    print(f"Total characters: {len(characters)}")
    print(f"{'=' * 60}")

    return client, collection, model


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


if __name__ == "__main__":
    initialize_database_with_all_characters()