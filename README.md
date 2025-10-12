# Reverse Akinator

A reverse-[Akinator](https://en.akinator.com/) style guessing game where players ask yes/no questions to identify a randomly selected character from the anime One-Piece. A RAG backed LLM answers the questions based on character knowledge.

**[Live Demo](https://strawhat_guessing_game.omrilevi.space)**

## Background

This project originated from a guessing game my friends and I used to play. While I don't watch anime anymore, I saw it as an opportunity to explore LLM integration, vector embeddings, and self-hosted deployment, resulting in a production application that one of my friends plays daily.

## Project Goals

Some architectural choices prioritize simplicity and zero-cost self-hosting over typical production patterns. Examples include:

- **Single-container deployment** - Everything runs in a single Docker container, with the same server handling both API and static frontend serving
- **Git LFS database backups** - Automated SQLite snapshots via bash script committed to Git; provides a simple zero-cost cloud backup solution that is viable at this scale
- **Minimal LLM rate limiting** - Low traffic volume and free-tier API quotas provide natural rate limiting at personal scale

## Features

- **Character management** - Filter, search, and sort through the character database
- **Character ratings and exclusions** - Rate difficulty and ignore characters to customize game pools
- **Arc-based filtering** - Limit character selection to specific story arcs with filler content control
- **Spoiler control** - Avoid spoilers from later arcs in the ongoing series
- **Dynamic theming** - Randomized backgrounds with adaptive color schemes on each load
- **Session persistence** - Continue games across browser sessions

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Redis** - Session and game state management
- **SQLite** - Relational database for character data
- **SQLAlchemy** - Database ORM
- **LangChain** - AI integration framework
- **ChromaDB** - Vector database for embeddings
- **Pydantic** - Data validation and serialization

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites
- Python 3.11 (3.9-3.11 supported, 3.12+ not yet supported)
- [uv](https://astral.sh/uv) - Fast Python package manager
- Node.js 20+
- Redis (for development) or Docker
- Google AI API key

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

The character database is populated using an automated two-phase bootstrap system. The process involves discovering available data from the wikia, configuring what to extract, then processing all characters.

See [`scripts/bootstrap_tools/README.md`](scripts/bootstrap_tools/README.md) for complete setup instructions.

## Future Goals

- **Rate limiting & CAPTCHA** - Add proper API rate limiting for production use
- **Enhanced spoiler control** - The current version is rather naive and subject to the LLM's subjectivity
- **Knowledge graphs for RAG** - Improve AI responses with structured character relationships
- **User authentication** - Add per-user data storage for ratings and character exclusion (currently shared globally by design)

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