# Guess Game

A reverse Akinator-style guessing game where the app selects a random character and players ask yes/no questions to identify who it is. Players must deduce the character through strategic questioning.

## Features

- Random character selection from comprehensive database
- Yes/no question system for character deduction
- Strategic guessing mechanics with attempt tracking
- Modern React frontend with TypeScript
- FastAPI backend with Redis session management
- Automated character database population from external sources
- Docker deployment support

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Redis** - Session and game state management  
- **SQLAlchemy** - Database ORM
- **AI Integration** - Question answering system
- **Pydantic** - Data validation and serialization

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **React Query** - API state management

## Getting Started

### Prerequisites
- Python 3.9+ (3.11 recommended)
- [uv](https://astral.sh/uv) - Fast Python package manager
- Node.js 18+
- Redis (or use Docker Compose)
- AI API key for question answering

### Quick Start with Docker

1. Clone the repository and navigate to the directory
2. Set up environment variables:
```bash
# Create .env file with your AI API key
echo "GOOGLE_AI_API_KEY=your_api_key_here" > .env
```

3. Run with Docker Compose:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`

### Manual Setup

#### Backend Setup
1. Install dependencies with uv:
```bash
uv sync
```

2. Start Redis server (if not using Docker)

3. Run the FastAPI server:
```bash
uv run python -m guessing_game.app
```

#### Frontend Setup
1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Database Setup

The game uses an automated bootstrap process to populate the character database:

### Bootstrap Process
Run the complete bootstrap sequence:
```bash
python -m server.database.bootstrap_tools.bootstrap
```

This runs three sequential steps:

#### 1. Character Data Scraping
```bash
python -m server.database.bootstrap_tools.fetch_character_data
```
- Scrapes character information from One Piece wiki
- Extracts character names, types (Canon/Non-Canon), episodes, chapters
- Handles duplicate characters by priority (Canon > Filler > Movie)
- Sanitizes character names for filesystem compatibility
- Outputs: `server/database/character_data.csv`

#### Phase 2: Character Processing
```bash
cd scripts
uv run python -m bootstrap_tools.bootstrap_orchestrator --phase=2
```

For testing with limited characters:
```bash
cd scripts
uv run python -m bootstrap_tools.bootstrap_orchestrator --phase=2 --limit=10
```

To resume from a specific character:
```bash
cd scripts
uv run python -m bootstrap_tools.bootstrap_orchestrator --phase=2 --start-from="Character_Name"
```

Phase 2 includes:
- Character data scraping from wiki pages
- Avatar downloading and processing
- Database storage with vector embeddings
- Thumbnail generation

### Bootstrap Features
- **Skip existing**: Avoids re-downloading existing files
- **Rate limiting**: Prevents IP blocking with delays between requests
- **Error recovery**: Automatic retry logic for failed downloads
- **Progress tracking**: Detailed logging of success/failure counts
- **Resume capability**: Can restart from specific points in the alphabet

## Project Structure

```
guess_game/
├── src/
│   └── guessing_game/        # Main Python package
│       ├── config/           # Configuration files
│       ├── database/         # Database models and utilities
│       ├── models/           # Data models
│       ├── routes/           # API endpoints
│       ├── schemas/          # Data validation schemas
│       ├── services/         # Business logic services
│       ├── dependencies.py   # Dependency injection
│       └── app.py            # FastAPI app entry point
├── scripts/
│   └── bootstrap_tools/      # Database population scripts
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Application pages
│   │   └── lib/             # Utilities
│   └── package.json
├── docker-compose.yaml       # Docker services
├── Dockerfile               # Backend container
└── pyproject.toml           # Python dependencies
```