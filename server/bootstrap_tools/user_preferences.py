import csv
import pandas as pd
from pathlib import Path


def create_user_preferences(character_data_file=None, preferences_file=None):
    """Initialize user preferences file from character data if it doesn't exist"""

    if character_data_file is None:
        character_data_file = Path(__file__).parent.parent / "data" / "character_data.csv"

    if preferences_file is None:
        preferences_file = Path(__file__).parent.parent / "data" / "user_preferences.csv"

    try:
        # Read character data
        characters_df = pd.read_csv(character_data_file)

        # Check if ID column exists
        if 'ID' not in characters_df.columns:
            print("ID column not found in character data. Creating empty user preferences file.")
            return

        # Get unique character IDs and remove NaN values
        character_ids = characters_df['ID'].dropna().unique()

        print(f"Rows with non-null IDs: {characters_df['ID'].notna().sum()}")
        print(f"Unique non-null IDs: {characters_df['ID'].dropna().nunique()}")
        duplicates = characters_df['ID'].value_counts()
        duplicate_ids = duplicates[duplicates > 1]
        if not duplicate_ids.empty:
            print(f"Found {len(duplicate_ids)} duplicate IDs:")
            print(duplicate_ids.head())

        # Ensure output directory exists
        preferences_file.parent.mkdir(parents=True, exist_ok=True)

        # Create user preferences file using CSV writer
        with open(preferences_file, 'w', newline='') as f:
            writer = csv.writer(f)
            # Write header
            writer.writerow(['ID', 'Difficulty', 'Ignore Status'])

            # Write each character with default values
            for character_id in character_ids:
                writer.writerow([character_id, 0, False])

        print(f"User preferences file created with {len(character_ids)} characters")

    except Exception as e:
        print(f"Error creating user preferences from character data: {e}")


if __name__ == "__main__":
    create_user_preferences()