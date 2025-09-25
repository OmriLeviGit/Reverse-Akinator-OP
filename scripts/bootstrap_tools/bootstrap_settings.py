# scripts/bootstrap_tools/bootstrap_settings.py
"""
Bootstrap-specific configuration settings.

These settings are used exclusively by the bootstrap pipeline tools for:
- Character data discovery and scraping
- Wiki section whitelisting
- Statistics extraction configuration
- File paths and directories

Main application code should NOT import from this file.
"""
import sys
import re
from pathlib import Path

# Get paths relative to bootstrap tools directory
BOOTSTRAP_DIR = Path(__file__).parent  # scripts/bootstrap_tools/
PROJECT_ROOT = BOOTSTRAP_DIR.parent.parent  # guessing_game/

# Add src to path so we can import from the main app
src_path = PROJECT_ROOT / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

# Bootstrap data directory
DATA_DIR = BOOTSTRAP_DIR / "data"

# Bootstrap-specific file paths
DISCOVERY_PATH = DATA_DIR / "discovery_results.txt"
CHARACTER_CSV_PATH = DATA_DIR / "character_data.csv"

# Image directories - pointing to client public folder
LARGE_AVATARS_DIR = PROJECT_ROOT / "client" / "public" / "img" / "avatars" / "large"
SMALL_AVATARS_DIR = PROJECT_ROOT / "client" / "public" / "img" / "avatars" / "small"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
LARGE_AVATARS_DIR.mkdir(parents=True, exist_ok=True)
SMALL_AVATARS_DIR.mkdir(parents=True, exist_ok=True)

# Character scraping settings - sections to extract from wiki pages
WHITELISTED_SECTIONS = [
    'Abilities',
    'Abilities & Powers',
    'Abilities and Biology',
    'Abilities and Power',
    'Abilities and Powers',
    'Abilities and powers',
    'Abilities And Powers',
    'Abilities and Traits',
    'Appearance',
    'Appearances',
    'Behavior',
    'Biography',
    'Citizens',
    'Crew Members',
    'Crew Strength',
    'Development Towards Nami',
    'During and After the Timeskip',
    'Emperors and Crews',
    'Emperors and Groups',
    'Entering Impel Down',
    'Family',
    'Final',
    'History',
    'Jolly Roger',
    'New World',
    'Other Appearances',
    'Overall Strength',
    'Overview',
    'Paradise',
    'Personalities',
    'Personality',
    'Personality and Relationships',
    'Pirates',
    'Post Timeskip',
    'Powers and Abilities',
    'Relationship',
    'Relationships',
    'Ship',
    'Ship Design and Appearance',
    'Ships',
    'Summit War',
    'The Final Sea: The New World Saga',
    'Turtles',
    'Wano',
    'Whole Cake',
    'World Government',
    'Yonko and Crews'
]

# Character statistics to extract from wiki infoboxes
WHITELISTED_STATISTICS = [
    ('status', 'statistics'),
    ('occupations', 'statistics'),
    ('affiliations', 'statistics'),
    ('residence', 'statistics'),
    ('birthday', 'statistics'),
    ('origin', 'statistics'),
    ('age', 'statistics'),
    ('height', 'statistics'),
    ('epithet', 'statistics'),
    ('bounty', 'statistics'),
    ('type', 'devil fruit'),
    ('english name', 'devil fruit'),
    ('japanese name', 'devil fruit'),
    ('meaning', 'devil fruit'),
    ('alias', 'statistics'),
    ('age at death', 'statistics'),
    ('birth name', 'statistics'),
    ('doriki', 'statistics'),
    ('weight', 'statistics'),
    ('gladiatornumber', 'statistics'),
    ('cp9key', 'statistics'),
    ('length', 'statistics'),
    ('size', 'statistics'),
]


# Utility functions
def clean_unicode_text(text):
    """Remove or replace problematic Unicode characters to prevent encoding issues"""
    if not isinstance(text, str):
        return text
    
    # Replace common problematic Unicode characters with ASCII equivalents
    replacements = {
        '\u2192': '->',      # Right arrow
        '\u2190': '<-',      # Left arrow  
        '\u2191': '^',       # Up arrow
        '\u2193': 'v',       # Down arrow
        '\u2022': '*',       # Bullet point
        '\u201c': '"',       # Left double quote
        '\u201d': '"',       # Right double quote
        '\u2018': "'",       # Left single quote
        '\u2019': "'",       # Right single quote
        '\u2013': '-',       # En dash
        '\u2014': '--',      # Em dash
        '\u2026': '...',     # Ellipsis
        '\u00a0': ' ',       # Non-breaking space
    }
    
    for unicode_char, replacement in replacements.items():
        text = text.replace(unicode_char, replacement)
    
    # Remove any remaining non-ASCII characters
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    
    return text