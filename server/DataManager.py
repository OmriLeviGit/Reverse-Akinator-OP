import os
import csv
import json
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
        self.user_preferences = self.data_dir / "user_preferences.csv"
        self.arc_list = self.data_dir / "arc_list.json"
        self.game_prompt = self.data_dir / "game_prompt.txt"

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

    # ... rest of your methods stay the same ...
    def _initialize_csv_files(self):
        if not os.path.exists(self.games_file):
            with open(self.games_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(
                    ['game_session_id', 'character_name', 'filler_status', 'session_status', 'created_at',
                     'conversation'])

        if not os.path.exists(self.characters_file):
            self._fetch_character_data()

        if not os.path.exists(self.user_preferences):
            with open(self.user_preferences, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['character_name', 'rating', 'ignore_status'])

    def _load_json_and_text_files(self):
        try:
            with open(self.arc_list, 'r') as f:
                self.arc_chapter_mapping = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error loading arc list: {e}")
            self.arc_chapter_mapping = {}

        try:
            with open(self.game_prompt, 'r') as f:
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

            df = pd.read_html(StringIO(str(table)))[0]
            return df
        except requests.RequestException as e:
            print(f"Error fetching data from {url}: {e}")
            return pd.DataFrame()
        except Exception as e:
            print(f"Error parsing table from {url}: {e}")
            return pd.DataFrame()

    def _clean_dataframe(self, df):
        """Remove unwanted columns"""
        if df.empty:
            return df

        cols_to_drop = [col for col in df.columns if col.lower().startswith('unnamed') or col.lower() in ['v e']]

        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)
            print(f"Dropped columns: {cols_to_drop}")

        return df

    def _fetch_character_data(self):
        """Fetch and save character data from One Piece wikia"""
        try:
            url1 = "https://onepiece.fandom.com/wiki/List_of_Canon_Characters"
            url2 = "https://onepiece.fandom.com/wiki/List_of_Non-Canon_Characters"
            table_child1 = 8
            table_child2 = 6

            df1 = self._scrape_table_from_wikia(url1, table_child1)
            df1 = self._clean_dataframe(df1)

            if not df1.empty:
                df1.insert(1, 'Type', 'Canon')

            df2 = self._scrape_table_from_wikia(url2, table_child2)
            df2 = self._clean_dataframe(df2)

            desired_order = ['Name', 'Type', 'Chapter', 'Episode', 'Number', 'Year', 'Appears in', 'Note']

            all_columns_set = set()
            if not df1.empty:
                all_columns_set.update(df1.columns)
            if not df2.empty:
                all_columns_set.update(df2.columns)

            final_columns = []
            for col in desired_order:
                if col in all_columns_set:
                    final_columns.append(col)

            cleaned_dfs = []
            for df in [df1, df2]:
                if not df.empty:
                    for col in final_columns:
                        if col not in df.columns:
                            df[col] = pd.NA

                    df = df[final_columns]
                    df_cleaned = df.dropna(axis=1, how='all')
                    if not df_cleaned.empty:
                        cleaned_dfs.append(df_cleaned)

            if cleaned_dfs:
                combined_df = pd.concat(cleaned_dfs, ignore_index=True)
                combined_df = combined_df.drop_duplicates()
                combined_df = combined_df.sort_values('Name', na_position='last').reset_index(drop=True)
                combined_df.to_csv(self.characters_file, index=False)

                print(f"- Total rows: {len(combined_df)}")
                print(f"- Final columns: {combined_df.columns.tolist()}")
            else:
                print("No character data could be fetched - creating empty file")
                with open(self.characters_file, 'w', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow(['Name', 'Type'])

        except Exception as e:
            print(f"Error fetching character data: {e}")
            with open(self.characters_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['Name', 'Type'])