#!/bin/bash
set -e  # Exit on any error

echo "$(date): Starting database backup..."

# Check if .git exists in persistent storage (/data)
if [ ! -d "/data/.git" ]; then
    echo "$(date): Setting up git repository (first time only)..."

    # Clone to persistent storage
    git clone https://${GITHUB_TOKEN}@github.com/OmriLeviGit/OP_guessing_game.git /data/repo

    # Move .git to persistent location
    mv /data/repo/.git /data/.git

    # Clean up
    rm -rf /data/repo

    echo "$(date): Git repository setup complete"
fi

# Create symlink from app data directory to persistent git repo
if [ ! -L "/app/src/guessing_game/data/.git" ]; then
    ln -sf /data/.git /app/src/guessing_game/data/.git
fi

# Create symlink to .git in app root (in case it doesn't exist)
if [ ! -L "/app/.git" ]; then
    ln -sf /data/.git /app/.git
fi

# Navigate to app root (so git repo structure matches GitHub)
cd /app

# Configure git
git config --global user.email "backup-bot@automated.backup"
git config --global user.name "Database Backup Bot"

# Checkpoint SQLite database to consolidate WAL data
echo "$(date): Checkpointing SQLite database to consolidate WAL data..."

# Check if database file exists
if [ ! -f "src/guessing_game/data/app.db" ]; then
    echo "$(date): ERROR - Database file not found: src/guessing_game/data/app.db"
    exit 1
fi

# Check for WAL and SHM files before checkpoint
echo "$(date): Checking for WAL/SHM files..."
ls -la src/guessing_game/data/*.db* 2>/dev/null || echo "No database files found with ls"

# Show database file sizes before checkpoint
if [ -f "src/guessing_game/data/app.db" ]; then
    echo "$(date): app.db size before checkpoint: $(stat -f%z src/guessing_game/data/app.db 2>/dev/null || stat -c%s src/guessing_game/data/app.db 2>/dev/null || echo 'unknown')"
fi

# Perform WAL checkpoint to merge all data into main database file
echo "$(date): Running WAL checkpoint..."
if sqlite3 "src/guessing_game/data/app.db" "PRAGMA wal_checkpoint(FULL); SELECT 'Checkpoint result: ' || changes();" 2>&1; then
    echo "$(date): Database checkpoint completed"
else
    echo "$(date): WARNING - Database checkpoint failed, continuing with backup..."
fi

# Show database file sizes after checkpoint
if [ -f "src/guessing_game/data/app.db" ]; then
    echo "$(date): app.db size after checkpoint: $(stat -f%z src/guessing_game/data/app.db 2>/dev/null || stat -c%s src/guessing_game/data/app.db 2>/dev/null || echo 'unknown')"
fi

# Remove WAL and SHM files from git tracking after checkpoint (they should be empty now)
echo "$(date): Removing WAL/SHM files from git tracking..."
git rm --cached src/guessing_game/data/app.db-wal src/guessing_game/data/app.db-shm 2>/dev/null || echo "WAL/SHM files not in git or already removed"

# Add main database file to git
echo "$(date): Adding database file to git..."
if git add src/guessing_game/data/app.db; then
    echo "$(date): Database file added to git staging area"
else
    echo "$(date): ERROR - Failed to add database file to git"
    exit 1
fi

# Check if there are actually changes to commit
if git diff --staged --quiet; then
    echo "$(date): No database changes to backup"
    exit 0
fi

echo "$(date): Committing database changes..."
if git commit -m "Auto-backup database $(date '+%Y-%m-%d %H:%M:%S')"; then
    echo "$(date): Database changes committed successfully"
else
    echo "$(date): ERROR - Failed to commit database changes"
    exit 1
fi

# Push to GitHub with error handling
if git push origin main; then
    echo "$(date): Successfully pushed to GitHub"
else
    echo "$(date): Push failed, attempting to pull and retry..."
    if git pull --rebase origin main && git push origin main; then
        echo "$(date): Successfully resolved conflicts and pushed to GitHub"
    else
        echo "$(date): Failed to resolve conflicts - manual intervention may be needed"
        exit 1
    fi
fi

echo "$(date): Database backup completed successfully"