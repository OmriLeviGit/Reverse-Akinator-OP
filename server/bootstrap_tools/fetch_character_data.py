import os
import re
from io import StringIO
from pathlib import Path
import pandas as pd
import requests
from bs4 import BeautifulSoup


def scrape_table_from_wikia(url, table_child):
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

    # Find duplicates
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

        # Clean the name
        id_name = re.sub(r'_', ' ', duplicate_id)
        id_name = re.sub(r'#', ' - ', id_name)
        df.at[best_row_idx, 'Name'] = id_name

    # Remove duplicate rows
    if rows_to_drop:
        df = df.drop(rows_to_drop).reset_index(drop=True)
        print(f"Removed {len(rows_to_drop)} duplicate entries")

    return df


def scrape_character_data(output_file=None):
    """Fetch and save character data from One Piece wikia"""
    if output_file is None:
        output_file = Path(__file__).parent.parent / "data" / "character_data.csv"

    try:
        url1 = "https://onepiece.fandom.com/wiki/List_of_Canon_Characters"
        url2 = "https://onepiece.fandom.com/wiki/List_of_Non-Canon_Characters"
        table_child1 = 8
        table_child2 = 6

        df1 = scrape_table_from_wikia(url1, table_child1)
        df1 = clean_dataframe(df1)

        if not df1.empty:
            df1.insert(1, 'Type', 'Canon')
            # Clean character names
            if 'Name' in df1.columns:
                df1['Name'] = df1['Name']

        df2 = scrape_table_from_wikia(url2, table_child2)
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

            # Ensure output directory exists
            os.makedirs(output_file.parent, exist_ok=True)
            combined_df.to_csv(output_file, index=False)

            print(f"- Total rows: {len(combined_df)}")
            print(f"- Final columns: {combined_df.columns.tolist()}")
            print(f"- Saved to: {output_file}")
        else:
            print("No character data could be fetched")

    except Exception as e:
        print(f"Error fetching character data: {e}")


if __name__ == "__main__":
    scrape_character_data()