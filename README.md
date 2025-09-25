I haven't got the chance to create a more comprehensive README yet, but this should be enough for now :)

This is a game that some friends and I used to play, where one chooses a character from the anime One Piece and others have to ask yes/no questions in an attempt to find the character.
While I don't watch anime anymore, I figured that implementing this game using an LLM as the challenger would give me a good excuse to mess around with some technologies I found interesting.

#### Some notes:
There are some choices that I would not have made in a serious production settings obviously, for example:
- All services are managed in a single container
- The SQLite DB is automatically backed up directly to Git (LFS) using a bash script, as the DB is small and makes taking backing up snapshots (for free) simple in case my machine goes down.  
- There are no real rate limits in place, as there is no real need for most of them, and for the LLM interactions - the API key is connected to a free limited account. 

The app is hosted on my home-lab ([link](https://strawhat_guessing_game.omrilevi.space)), and one of my friends actually plays it on a daily basis.

> Due to Git LFS rate limits, my hosting machine's CI/CD can't actually pull from GitHub for the next two weeks. As a result, the app is few commits behind, and misses some bug fixes and tweaks.

---

# Reverse Akinator

A reverse Akinator-style guessing game where the app selects a random One Piece character and players ask yes/no questions to identify who it is. Players must deduce the character through strategic questioning with AI-powered responses.

## Features

- Random character selection from comprehensive One Piece database
- AI-powered yes/no question answering system
- Strategic guessing mechanics with attempt tracking
- Modern React 18 frontend with TypeScript
- FastAPI backend with Redis session management
- Automated character database population from One Piece wiki
- Vector embeddings for semantic character search
- Docker deployment support

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Redis** - Session and game state management
- **SQLAlchemy** - Database ORM
- **LangChain** - AI integration framework
- **ChromaDB** - Vector database for embeddings
- **Pydantic** - Data validation and serialization

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **TanStack Query** - API state management

## Getting Started

### Prerequisites
- Python 3.11 (3.9-3.11 supported, 3.12+ not yet supported)
- [uv](https://astral.sh/uv) - Fast Python package manager
- Node.js 20+
- Redis (for development) or Docker
- Google AI API key (for question answering)

### Development Setup

#### 1. Backend with Redis in Docker
Start Redis:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

Set up environment:
```bash
# Create .env file with your API key
echo "GOOGLE_AI_API_KEY=your_api_key_here" > .env
```

Install dependencies and run:
```bash
uv sync
uv run python -m guessing_game.app
```

#### 2. Frontend
```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:8080` (frontend) connecting to `http://localhost:3000` (backend).

### Docker Deployment

Run the full stack with Docker Compose:

```bash
# Set up environment variables
echo "GOOGLE_AI_API_KEY=your_api_key_here" > .env

# Start all services
docker-compose up -d
```

The application will be available at `http://localhost:3000`

## Database Setup

The character database is populated using an automated bootstrap system that scrapes and processes One Piece wiki data. cd See [`scripts/bootstrap_tools/README.md`](scripts/bootstrap_tools/README.md) for detailed documentation.

**Quick start:**
```bash
cd scripts
# Phase 1: Initial setup and preparation
uv run python -m bootstrap_tools.bootstrap_orchestrator --phase=1

# Phase 2: Process all characters (after configuration)
uv run python -m bootstrap_tools.bootstrap_orchestrator --phase=2
```

The bootstrap system:
- Scrapes character data from One Piece wiki
- Downloads and processes character avatars
- Generates AI-powered descriptions and fun facts
- Creates vector embeddings for semantic search
- Stores structured data in SQL and vector databases

## Project Structure

```
guessing_game/
├── src/
│   └── guessing_game/          # Main Python package
│       ├── config/             # Configuration files
│       ├── models/             # SQLAlchemy models
│       ├── routes/             # API endpoints
│       ├── schemas/            # Pydantic schemas
│       ├── services/           # Business logic
│       ├── dependencies.py     # Dependency injection
│       └── app.py              # FastAPI app entry point
├── scripts/
│   └── bootstrap_tools/        # Database population scripts
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Application pages
│   │   └── lib/                # Utilities
│   └── package.json
├── docker-compose.yaml         # Docker services
├── Dockerfile                  # Backend container
└── pyproject.toml              # Python dependencies
```