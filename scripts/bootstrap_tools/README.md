# Bootstrap Tools

Unified pipeline for bootstrapping the One Piece character guessing game database and assets. This system processes character data from the One Piece wiki, extracts comprehensive information, and stores it across multiple databases and formats.

## Quick Start

```bash
# Check current system status
python bootstrap_orchestrator.py --status

# Phase 1: Initial setup and preparation
python bootstrap_orchestrator.py --phase=1

# Phase 2: Process characters (test with 5 characters first)
python bootstrap_orchestrator.py --phase=2 --limit=5

# Phase 2: Process all characters (after configuration)
python bootstrap_orchestrator.py --phase=2

# Resume from specific character if interrupted
python bootstrap_orchestrator.py --phase=2 --start-from="CHARACTER_ID"
```

## System Overview

The bootstrap system operates in two main phases:

### Phase 1: Preparation
- Scrapes character lists from One Piece wiki
- Creates character CSV with IDs and wiki URLs
- Initializes SQL and vector databases
- Optionally discovers available wiki sections and statistics
- Requires manual configuration of section/statistic whitelists

### Phase 2: Character Processing
- Processes each character in a single pass
- Scrapes structured data, narrative content, and images
- Stores data in SQL database with full character information
- Creates vector embeddings for semantic search
- Downloads and processes avatar images (large and small versions)
- Generates AI-powered descriptions and fun facts
- Extracts and stores character affiliations

## Directory Structure

```
bootstrap_tools/
├── phase1_preparation/           # Initial setup scripts
│   ├── build_character_csv.py    # Creates character list from wiki
│   ├── database_builder.py       # Initializes databases
│   └── section_and_table_discovery.py  # Discovers available wiki data
├── phase2_processing/            # Main character processing
│   ├── character_processor.py    # Main processing pipeline
│   ├── enhanced_character_scraping.py  # Wiki data extraction
│   ├── data_storage_manager.py   # Unified data storage
│   └── generate_small_avatars.py # Avatar thumbnail creation
├── data/                         # Generated data files
│   ├── character_data.csv        # Character list with wiki URLs
│   └── discovery_results.txt     # Section discovery output
├── bootstrap_settings.py         # Configuration settings
├── bootstrap_orchestrator.py     # Main entry point
└── README.md                     # This file
```

## Configuration

### Required Manual Configuration

After running Phase 1 with section discovery, you must update `bootstrap_settings.py`:

**WHITELISTED_SECTIONS**: List of wiki page sections to extract
```python
WHITELISTED_SECTIONS = [
    'Abilities',
    'Appearance', 
    'History',
    'Personality',
    # Add sections based on discovery_results.txt
]
```

**WHITELISTED_STATISTICS**: List of infobox statistics to extract
```python
WHITELISTED_STATISTICS = [
    ('age', 'statistics'),
    ('height', 'statistics'),
    ('bounty', 'statistics'),
    # Add statistics based on discovery_results.txt
]
```

### Processing Settings

Modify `character_processor.py` for performance tuning:
- `delay_between_characters`: Delay between character processing (default: 2.0 seconds)
- `delay_between_requests`: Delay between individual web requests (default: 0.1 seconds)

## Usage Examples

### Development and Testing
```bash
# Test with limited characters
python bootstrap_orchestrator.py --phase=2 --limit=10

# Resume interrupted processing
python bootstrap_orchestrator.py --phase=2 --start-from="Monkey_D._Luffy"

# Skip CSV generation if already exists
python bootstrap_orchestrator.py --phase=1 --skip-csv

# Check system status anytime
python bootstrap_orchestrator.py --status
```

### Production Workflow
```bash
# 1. Initial setup (first time only)
python bootstrap_orchestrator.py --phase=1

# 2. Configure bootstrap_settings.py based on discovery results

# 3. Process all characters
python bootstrap_orchestrator.py --phase=2
```

## Error Handling and Recovery

### Built-in Error Recovery
- **403 Rate Limiting**: Automatic 5-minute breaks after consecutive 403 errors
- **Network Timeouts**: Individual character failures don't stop processing
- **Processing Interruption**: Resume from last processed character
- **Retry Logic**: Up to 3 attempts per character for transient failures

### Common Recovery Commands
```bash
# Resume from specific character
python bootstrap_orchestrator.py --phase=2 --start-from="FAILED_CHARACTER_ID"

# Check what has been processed
python bootstrap_orchestrator.py --status

# Reprocess specific range
python bootstrap_orchestrator.py --phase=2 --limit=50 --start-from="CHARACTER_ID"
```

## Output and Results

### Generated Assets
- **SQL Database**: Complete character information with structured data
- **Vector Database**: Semantic embeddings for character search
- **Large Avatars**: High-resolution character images (client/public/img/avatars/large/)
- **Small Avatars**: Thumbnail versions for UI (client/public/img/avatars/small/)
- **AI Content**: Generated character descriptions and fun facts

## Performance

### Expected Processing Times
For ~2500 characters:
- Phase 1 (with discovery): 1-2 hours
- Phase 2 (full processing): 3-4 hours
- Total system setup: 4-6 hours

### Optimization
- Use `--limit` for testing to avoid full processing during development
- Adjust delay settings in character_processor.py for faster processing
- Monitor progress through automatic status updates every 10 characters

## Monitoring and Status

The system provides detailed progress tracking:
- Real-time processing status with character counts
- Success/failure rates for each component
- Detailed statistics on data extraction and storage
- Resume capabilities with specific character targeting

Use `--status` to check current system state including:
- Character CSV existence
- Database connection and content
- Avatar file counts
- Discovery results availability

## Dependencies

Key Python packages:
- requests (wiki scraping)
- BeautifulSoup4 (HTML parsing)  
- Pillow (image processing)
- pandas (data manipulation)
- SQLAlchemy (database ORM)
- ChromaDB (vector database)

The system integrates with the main application's:
- Database models and configuration
- Vector database setup
- LLM services for content generation
- Prompt services for AI interactions