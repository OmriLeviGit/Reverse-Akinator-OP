import os
import csv
import json
import re
from io import StringIO
from pathlib import Path

import pandas as pd
import requests
from bs4 import BeautifulSoup


class DataManager:
    _instance = None
    _initialized = False

    def __new__(cls, api_key=None):
        if cls._instance is None:
            cls._instance = super(DataManager, cls).__new__(cls)
        return cls._instance

    def __init__(self, api_key=None):
        if DataManager._initialized:
            return

        self.base_path = Path(__file__).parent
        self.data_dir = self.base_path / "data"

        self.games_file = self.data_dir / "games.csv"
        self.characters_file = self.data_dir / "character_data.csv"
        self.user_preferences_file = self.data_dir / "user_preferences.csv"
        self.arc_list_file = self.data_dir / "arc_list.json"
        self.game_prompt_file = self.data_dir / "game_prompt.txt"

        self.data_dir.mkdir(exist_ok=True)

        self._initialize_csv_files()
        self._load_json_and_text_files()

        if api_key:
            # genai.configure(api_key=api_key)
            pass

        DataManager._initialized = True

    @classmethod
    def get_instance(cls, api_key=None):
        """Alternative way to get the singleton instance"""
        if cls._instance is None:
            cls._instance = cls(api_key)
        return cls._instance

    def _initialize_csv_files(self):
        if not os.path.exists(self.games_file):
            with open(self.games_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(
                    ['game_session_id', 'character_name', 'filler_status', 'session_status', 'created_at',
                     'conversation'])

        if not os.path.exists(self.characters_file):
            self._load_character_data()

        if not os.path.exists(self.user_preferences_file):
            self._load_preferences()

    def _load_json_and_text_files(self):
        try:
            with open(self.arc_list_file, 'r') as file:
                data = json.load(file)
                self.arc_list = data['arc_list']  # Returns just the list, not the wrapper object
        except FileNotFoundError:
            print("Arc list file not found")
            self.arc_list = []
        except json.JSONDecodeError:
            print("Error decoding arc list JSON")
            self.arc_list = []

        try:
            with open(self.game_prompt_file, 'r') as f:
                self.instructions = f.read()
        except FileNotFoundError as e:
            print(f"Error loading game prompt: {e}")
            self.instructions = ""

    def _scrape_table_from_wikia(self, url, table_child):
        """Scrape a specific table from a Wikia page using CSS selector"""
        try:
            response = requests.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            table = soup.select_one(f"table.fandom-table:nth-child({table_child})")

            if not table:
                raise ValueError(f"Table with selector 'table.fandom-table:nth-child({table_child})' not found")

            # Extract links from Name column (second column, index 1)
            links_data = []
            rows = table.find_all('tr')

            for row in rows:
                cells = row.find_all(['td', 'th'])
                try:
                    name_cell = cells[1]  # Second column
                    link_element = name_cell.find('a')
                    if link_element and link_element.get('href'):
                        href = link_element.get('href')
                        if href.startswith('/'):
                            full_url = 'https://onepiece.fandom.com' + href
                        else:
                            full_url = href
                        links_data.append(full_url)
                    else:
                        links_data.append(None)
                except IndexError:
                    links_data.append(None)

            # Convert table to DataFrame
            df = pd.read_html(StringIO(str(table)))[0]

            # Add Wiki column with extracted links
            if not df.empty and links_data:
                # Skip header row if needed
                if len(links_data) > len(df):
                    links_data = links_data[1:]

                df['Wiki'] = links_data[:len(df)]

            return df
        except requests.RequestException as e:
            print(f"Error fetching data from {url}: {e}")
            return pd.DataFrame()
        except Exception as e:
            print(f"Error parsing table from {url}: {e}")
            return pd.DataFrame()

    def _load_character_data(self):
        """Fetch and save character data from One Piece wikia"""

        def clean_dataframe(df):
            """Remove unwanted columns"""
            if df.empty:
                return df

            cols_to_drop = [col for col in df.columns if col.lower().startswith('unnamed') or col.lower() in ['v e']]

            if cols_to_drop:
                df = df.drop(columns=cols_to_drop)
                print(f"Dropped columns: {cols_to_drop}")

            return df

        def extract_id_from_wiki_url(url):
            """Extract the page identifier from the Wiki URL"""
            if pd.isna(url) or not isinstance(url, str):
                return None

            base_url = "https://onepiece.fandom.com/wiki/"
            if url.startswith(base_url):
                return url[len(base_url):]
            return None

        def handle_duplicate_ids(df):
            """Handle duplicate IDs by keeping one entry with 'ninja' + original_id as name"""
            if df.empty or 'ID' not in df.columns:
                return df

            # Find duplicates
            id_counts = df['ID'].value_counts()
            duplicate_ids = id_counts[id_counts > 1].index

            if len(duplicate_ids) > 0:
                print(f"Found {len(duplicate_ids)} duplicate IDs, converting to ninja entries")

            # Keep track of rows to remove
            rows_to_drop = []

            for duplicate_id in duplicate_ids:
                # Get all rows with this duplicate ID
                duplicate_rows = df[df['ID'] == duplicate_id].copy()

                # Create priority score for Type column
                def get_type_priority(type_val):
                    if pd.isna(type_val):
                        return 0
                    type_val = str(type_val).lower()
                    if 'canon' in type_val:
                        return 4
                    elif 'filler' in type_val:
                        return 3
                    elif 'movie' in type_val:
                        return 2
                    else:
                        return 1

                # Add priority columns for sorting
                duplicate_rows['type_priority'] = duplicate_rows['Type'].apply(get_type_priority)

                # Convert numeric columns to numeric, filling NaN with -1 for sorting
                for col in ['Episode', 'Chapter', 'Number', 'Year']:
                    if col in duplicate_rows.columns:
                        duplicate_rows[col] = pd.to_numeric(duplicate_rows[col], errors='coerce').fillna(-1)
                    else:
                        duplicate_rows[col] = -1

                # Sort by priority: type_priority (desc), Episode (desc), Chapter (desc), Number (desc), Year (desc)
                sort_columns = ['type_priority']
                sort_ascending = [False]

                for col in ['Episode', 'Chapter', 'Number', 'Year']:
                    if col in duplicate_rows.columns:
                        sort_columns.append(col)
                        sort_ascending.append(False)

                duplicate_rows_sorted = duplicate_rows.sort_values(
                    by=sort_columns,
                    ascending=sort_ascending
                )

                # Keep the best row (first after sorting)
                best_row_idx = duplicate_rows_sorted.index[0]

                name = re.sub(r'_', ' ', duplicate_id)
                name = re.sub(r'#', ' - ', name)

                df.at[best_row_idx, 'Name'] = name

                # Mark other occurrences for removal
                other_indices = duplicate_rows_sorted.index[1:].tolist()
                rows_to_drop.extend(other_indices)

            # Remove duplicate rows
            if rows_to_drop:
                df = df.drop(rows_to_drop).reset_index(drop=True)
                print(f"Removed {len(rows_to_drop)} duplicate entries")

            return df

        try:
            url1 = "https://onepiece.fandom.com/wiki/List_of_Canon_Characters"
            url2 = "https://onepiece.fandom.com/wiki/List_of_Non-Canon_Characters"
            table_child1 = 8
            table_child2 = 6

            df1 = self._scrape_table_from_wikia(url1, table_child1)
            df1 = clean_dataframe(df1)

            if not df1.empty:
                df1.insert(1, 'Type', 'Canon')
                # Clean character names
                if 'Name' in df1.columns:
                    df1['Name'] = df1['Name']

            df2 = self._scrape_table_from_wikia(url2, table_child2)
            df2 = clean_dataframe(df2)

            if not df2.empty and 'Name' in df2.columns:
                df2['Name'] = df2['Name']

            # Updated desired order with ID as first column
            desired_order = ['ID', 'Name', 'Type', 'Wiki', 'Chapter', 'Episode', 'Number', 'Year', 'Appears in', 'Note']

            all_columns_set = set()
            if not df1.empty:
                all_columns_set.update(df1.columns)
            if not df2.empty:
                all_columns_set.update(df2.columns)

            final_columns = []
            for col in desired_order:
                if col in all_columns_set or col == 'ID':  # Always include ID column
                    final_columns.append(col)

            cleaned_dfs = []
            for df in [df1, df2]:
                if not df.empty:
                    # Add ID column by extracting from Wiki URLs
                    if 'Wiki' in df.columns:
                        df['ID'] = df['Wiki'].apply(extract_id_from_wiki_url)
                    else:
                        df['ID'] = pd.NA

                    for col in final_columns:
                        if col not in df.columns:
                            df[col] = pd.NA

                    df = df[final_columns]
                    df_cleaned = df.dropna(axis=1, how='all')
                    if not df_cleaned.empty:
                        cleaned_dfs.append(df_cleaned)

            if cleaned_dfs:
                combined_df = pd.concat(cleaned_dfs, ignore_index=True)

                # Handle duplicate IDs before final processing
                combined_df = handle_duplicate_ids(combined_df)

                combined_df = combined_df.drop_duplicates()
                combined_df = combined_df.sort_values('Name', na_position='last').reset_index(drop=True)
                combined_df.to_csv(self.characters_file, index=False)

                print(f"- Total rows: {len(combined_df)}")
                print(f"- Final columns: {combined_df.columns.tolist()}")
            else:
                print("No character data could be fetched")

        except Exception as e:
            print(f"Error fetching character data: {e}")

    def _load_preferences(self):
        """Initialize user preferences file from character data if it doesn't exist"""

        try:
            # Read character data
            characters_df = pd.read_csv(self.characters_file)

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

            # Create user preferences file using CSV writer
            with open(self.user_preferences_file, 'w', newline='') as f:
                writer = csv.writer(f)
                # Write header
                writer.writerow(['character_id', 'rating', 'ignore_status'])

                # Write each character with default values
                for character_id in character_ids:
                    writer.writerow([character_id, 0, False])

            print(f"User preferences file created with {len(character_ids)} characters")

        except Exception as e:
            print(f"Error creating user preferences from character data: {e}")