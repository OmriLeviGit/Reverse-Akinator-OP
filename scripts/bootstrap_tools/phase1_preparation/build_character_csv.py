import os
import re
import unicodedata
from io import StringIO
import pandas as pd
import requests
from bs4 import BeautifulSoup
import urllib.parse
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from ..bootstrap_settings import CHARACTER_CSV_PATH


def sanitize_filename(filename):
    """Convert accented characters to unaccented equivalents, handle filesystem chars"""
    if not filename:
        return filename

    # Normalize to decomposed form (separates base chars from accents)
    filename = unicodedata.normalize('NFD', filename)

    # Remove combining characters (accents, diacritics) but keep base letters
    filename = ''.join(char for char in filename
                       if unicodedata.category(char) != 'Mn')

    # Handle filesystem problematic characters
    replacements = {
        '/': '_', '\\': '_', ':': '_', '*': '_', '?': '_',
        '"': '_', '<': '_', '>': '_', '|': '_',
    }

    for old, new in replacements.items():
        filename = filename.replace(old, new)

    return filename


def find_character_table(soup):
    """Find the main character table based on content, not structure"""

    # Strategy 1: Look for tables with character-related headers
    character_headers = ['name', 'character', 'debut', 'episode', 'chapter']

    tables = soup.find_all('table')
    for table in tables:
        # Check if table has character-related headers
        headers = table.find_all(['th', 'td'])
        header_texts = [h.get_text().lower().strip() for h in headers[:10]]  # Check first 10 cells

        if any(header in ' '.join(header_texts) for header in character_headers):
            # Additional validation: table should have multiple rows
            rows = table.find_all('tr')
            if len(rows) >= 5:  # At least header + 4 character rows
                return table

    # Strategy 2: Look for tables with wikia/fandom classes (but don't rely on structure)
    fandom_tables = soup.find_all('table', class_=['fandom-table', 'wikitable', 'sortable'])
    if fandom_tables:
        # Return the largest table (likely the main character list)
        return max(fandom_tables, key=lambda t: len(t.find_all('tr')))

    # Strategy 3: Fallback to largest table
    if tables:
        return max(tables, key=lambda t: len(t.find_all('tr')))

    return None


def find_name_column_index(table):
    """Find which column contains character names based on content"""
    rows = table.find_all('tr')
    if not rows:
        return None

    # Check header row first
    header_row = rows[0]
    header_cells = header_row.find_all(['th', 'td'])

    for i, cell in enumerate(header_cells):
        cell_text = cell.get_text().lower().strip()
        if 'name' in cell_text or 'character' in cell_text:
            return i

    # If no clear header, analyze content of first few data rows
    for row in rows[1:4]:  # Check first 3 data rows
        cells = row.find_all(['td', 'th'])
        for i, cell in enumerate(cells):
            # Look for cells with wiki links (likely character names)
            if cell.find('a') and '/wiki/' in str(cell):
                # Additional check: text should look like a name (not just numbers or dates)
                text = cell.get_text().strip()
                if text and not text.isdigit() and not re.match(r'^\d+\.\d+$', text):
                    return i

    # Default to second column (index 1) as fallback
    return 1


def extract_character_links_and_data(table):
    """Extract character data and wiki links from table"""
    if not table:
        return [], None

    name_col_index = find_name_column_index(table)
    if name_col_index is None:
        print("Could not determine name column")
        return [], None

    rows = table.find_all('tr')
    links_data = []

    for row in rows:
        cells = row.find_all(['td', 'th'])

        if len(cells) > name_col_index:
            name_cell = cells[name_col_index]
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
        else:
            links_data.append(None)

    return links_data, name_col_index


def scrape_table_from_wikia(url):
    """Scrape character table from a Wikia page using content-based detection"""
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find the main character table
        table = find_character_table(soup)
        if not table:
            raise ValueError("No character table found on the page")

        # Extract links and determine structure
        links_data, name_col_index = extract_character_links_and_data(table)

        # Convert table to DataFrame using pandas
        df = pd.read_html(StringIO(str(table)))[0]

        # Add Wiki column with extracted links
        if not df.empty and links_data:
            # Align links with DataFrame rows
            if len(links_data) > len(df):
                # Remove extra links (likely from header row)
                links_data = links_data[-len(df):]
            elif len(links_data) < len(df):
                # Pad with None values if needed
                links_data.extend([None] * (len(df) - len(links_data)))

            df['Wiki'] = links_data[:len(df)]

        print(f"Found table with {len(df)} rows and name column at index {name_col_index}")
        return df

    except requests.RequestException as e:
        print(f"Error fetching data from {url}: {e}")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error parsing table from {url}: {e}")
        return pd.DataFrame()


def clean_dataframe(df):
    """Remove unwanted columns"""
    if df.empty:
        return df

    cols_to_drop = [col for col in df.columns
                    if str(col).lower().startswith('unnamed') or
                    str(col).lower() in ['v e', 'v', 'e']]

    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        print(f"Dropped columns: {cols_to_drop}")

    return df


def extract_id_from_wiki_url(url):
    """Extract the page identifier from the Wiki URL and decode it"""
    if pd.isna(url) or not isinstance(url, str):
        return None

    base_url = "https://onepiece.fandom.com/wiki/"
    if url.startswith(base_url):
        encoded_id = url[len(base_url):]
        # URL decode the ID
        decoded_id = urllib.parse.unquote(encoded_id)
        return decoded_id
    return None


def get_type_priority(type_val):
    """Create priority score for Type column"""
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


def handle_duplicate_ids(df):
    """Handle duplicate IDs by keeping one entry with cleaned name"""
    if df.empty or 'ID' not in df.columns:
        return df

    # Find duplicates based on sanitized IDs
    id_counts = df['ID'].value_counts()
    duplicate_ids = id_counts[id_counts > 1].index

    if len(duplicate_ids) > 0:
        print(f"Found {len(duplicate_ids)} duplicate IDs, converting to cleaned entries")

    # Keep track of rows to remove
    rows_to_drop = []
    for duplicate_id in duplicate_ids:
        duplicate_rows = df[df['ID'] == duplicate_id].copy()

        # Add priority and convert numeric columns
        duplicate_rows['type_priority'] = duplicate_rows['Type'].apply(get_type_priority)

        for col in ['Episode', 'Chapter', 'Number', 'Year']:
            if col in duplicate_rows.columns:
                duplicate_rows[col] = pd.to_numeric(duplicate_rows[col], errors='coerce').fillna(-1)

        # Sort by priority, then episode, chapter, etc.
        duplicate_rows_sorted = duplicate_rows.sort_values(
            by=['type_priority', 'Episode', 'Chapter', 'Number', 'Year'],
            ascending=[False, False, False, False, False]
        )

        # Keep first, drop the rest
        best_row_idx = duplicate_rows_sorted.index[0]
        rows_to_drop.extend(duplicate_rows_sorted.index[1:].tolist())

        # Clean the name using original Wiki ID
        if 'Wiki_ID' in df.columns and not pd.isna(df.at[best_row_idx, 'Wiki_ID']):
            original_id = df.at[best_row_idx, 'Wiki_ID']
            id_name = re.sub(r'_', ' ', original_id)
            id_name = re.sub(r'#', ' - ', id_name)
            df.at[best_row_idx, 'Name'] = id_name

    # Remove duplicate rows
    if rows_to_drop:
        df = df.drop(rows_to_drop).reset_index(drop=True)
        print(f"Removed {len(rows_to_drop)} duplicate entries")

    return df


def scrape_character_data(output_file=CHARACTER_CSV_PATH):
    """Fetch and save character database from One Piece wikia"""
    try:
        url1 = "https://onepiece.fandom.com/wiki/List_of_Canon_Characters"
        url2 = "https://onepiece.fandom.com/wiki/List_of_Non-Canon_Characters"

        df1 = scrape_table_from_wikia(url1)
        df1 = clean_dataframe(df1)

        if not df1.empty:
            df1.insert(1, 'Type', 'Canon')

        df2 = scrape_table_from_wikia(url2)
        df2 = clean_dataframe(df2)

        # Rest of the function remains the same...
        desired_order = ['ID', 'Name', 'Type', 'Wiki', 'Chapter', 'Episode', 'Number', 'Year', 'Appears in', 'Note']

        all_columns_set = set()
        if not df1.empty:
            all_columns_set.update(df1.columns)
        if not df2.empty:
            all_columns_set.update(df2.columns)

        final_columns = []
        for col in desired_order:
            if col in all_columns_set or col == 'ID':
                final_columns.append(col)

        cleaned_dfs = []
        for df in [df1, df2]:
            if not df.empty:
                if 'Wiki' in df.columns:
                    df['Wiki_ID'] = df['Wiki'].apply(extract_id_from_wiki_url)
                    df['ID'] = df['Wiki_ID'].apply(sanitize_filename)
                else:
                    df['Wiki_ID'] = pd.NA
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
            combined_df = handle_duplicate_ids(combined_df)

            if 'Wiki_ID' in combined_df.columns:
                combined_df = combined_df.drop('Wiki_ID', axis=1)

            combined_df = combined_df.drop_duplicates()
            combined_df = combined_df.sort_values('Name', na_position='last').reset_index(drop=True)

            if 'Wiki' in combined_df.columns:
                before_count = len(combined_df)
                combined_df = combined_df[~combined_df['Wiki'].str.contains('#', na=False)]
                dropped_count = before_count - len(combined_df)
                print(f"- Rows dropped due to '#' in Wiki: {dropped_count}")

            os.makedirs(output_file.parent, exist_ok=True)
            combined_df.to_csv(output_file, index=False)

            print(f"- Total rows: {len(combined_df)}")
            print(f"- Final columns: {combined_df.columns.tolist()}")
            print(f"- Saved to: {output_file}")
        else:
            print("No character database could be fetched")

    except Exception as e:
        print(f"Error fetching character database: {e}")


if __name__ == "__main__":
    scrape_character_data()