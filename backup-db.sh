#!/bin/bash
set -e  # Exit on any error

echo "$(date): Starting database backup..."

# Navigate to app directory
cd /app

# Copy current database from persistent storage to git-tracked location
cp /app/server/data/app.db /app/server/database/static_data/app.db

# Check if .git exists in persistent storage
if [ ! -d "/app/server/data/.git" ]; then
    echo "$(date): Setting up git repository (first time only)..."

    # Clone to persistent storage
    git clone https://${GITHUB_TOKEN}@github.com/OmriLeviGit/OP_guessing_game.git /app/server/data/repo

    # Move .git to persistent location
    mv /app/server/data/repo/.git /app/server/data/.git

    # Clean up
    rm -rf /app/server/data/repo

    echo "$(date): Git repository setup complete"
fi

# Create symlink to .git in persistent storage (in case it doesn't exist)
if [ ! -L "/app/.git" ]; then
    ln -sf /app/server/data/.git /app/.git
fi

# Configure git
git config --global user.email "backup-bot@automated.backup"
git config --global user.name "Database Backup Bot"

# Add and commit changes
git add server/database/static_data/app.db

# Check if there are actually changes to commit
if git diff --staged --quiet; then
    echo "$(date): No database changes to backup"
    exit 0
fi

git commit -m "Auto-backup database $(date '+%Y-%m-%d %H:%M:%S')"

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