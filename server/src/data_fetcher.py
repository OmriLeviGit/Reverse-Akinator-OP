import csv

import requests
from bs4 import BeautifulSoup
import pandas as pd
from io import StringIO
import sys
import os
import re


def fetch_character_list(is_canon, debug=False):
    """Fetch and save character database from the One Piece wiki"""
    if is_canon:
        url = "https://onepiece.fandom.com/wiki/List_of_Canon_Characters"
        file_path = "table_canon.csv"
        table_child = 8
    else:
        url = "https://onepiece.fandom.com/wiki/List_of_Non-Canon_Characters"
        file_path = "table_non_canon.csv"
        table_child = 6

    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    table = soup.select_one(f"table.fandom-table:nth-child({table_child})")

    if table:
        table_html = str(table)
        df = pd.read_html(StringIO(table_html))[0]
        df.to_csv(file_path, index=False)
        if debug:
            print(f"Successfully fetched and saved {file_path}")
    else:
        print(f"Failed to find table in {url}")


def filter_characters(character_list, exclusion_file_path, debug=False):
    try:
        with open(exclusion_file_path, 'r') as file:

            characters_to_exclude = []
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                characters_to_exclude.append(row['Character name'])

            original_count = len(character_list)
            filtered_list = [char_data for char_data in character_list if char_data[0] not in characters_to_exclude]

            if debug:
                print(f"Removed {original_count - len(filtered_list)} characters: {characters_to_exclude}")

            return filtered_list

    except (FileNotFoundError, IOError):
        return character_list


def get_canon_characters(exclusion_file_path, chapter_limit=None, debug=False):
    chapter_limit = chapter_limit or [sys.maxsize, sys.maxsize]
    max_chapter, _ = chapter_limit

    canon_file = "table_canon.csv"
    if not os.path.exists(canon_file):
        fetch_character_list(is_canon=True, debug=debug)

    df_canon = pd.read_csv(canon_file)

    df_canon.iloc[:, 2] = pd.to_numeric(df_canon.iloc[:, 2], errors='coerce')
    df_canon.iloc[:, 3] = pd.to_numeric(df_canon.iloc[:, 3], errors='coerce')

    chapter_filtered_df = df_canon[df_canon.iloc[:, 2] <= max_chapter]
    character_data = chapter_filtered_df.iloc[:, 1:4]
    valid_characters = [char for char in character_data.values.tolist() if all(pd.notna(char))]

    return filter_characters(valid_characters, exclusion_file_path, debug=debug)


def get_non_canon_characters(exclusion_file_path, episode_limit=None, debug=False):
    episode_limit = episode_limit or [sys.maxsize, sys.maxsize]
    _, max_episode = episode_limit

    non_canon_file = "table_non_canon.csv"
    if not os.path.exists(non_canon_file):
        fetch_character_list(is_canon=False, debug=debug)

    df_non_canon = pd.read_csv(non_canon_file)

    episode_column = pd.to_numeric(df_non_canon.iloc[:, 3], errors='coerce').fillna(-1)
    mask = (episode_column <= max_episode) | (episode_column == -1)
    filtered_df = df_non_canon[mask].fillna(-1)

    filtered_df.iloc[:, 3] = pd.to_numeric(filtered_df.iloc[:, 3], errors='coerce').fillna(-1).astype(int)

    character_data = filtered_df.iloc[:, [1, 2, 3, 5]]
    valid_characters = [char for char in character_data.values.tolist() if all(pd.notna(char))]

    return filter_characters(valid_characters, exclusion_file_path, debug=debug)


def get_main_info(chosen_name):
    url = get_link(chosen_name)
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    desired_row_titles = ['Bounty', 'Age', 'Status', 'Occupations', 'Origin', 'Residence',
                          'Height', 'Affiliations']

    data_items = soup.select('div.pi-item.pi-database')

    if not data_items:
        data_items = soup.select('[database-source]')

    all_data = []
    for item in data_items:
        label_elem = item.find('h3', class_='pi-database-label')
        if not label_elem:
            continue

        label_text = label_elem.text.strip().rstrip(':')

        if any(title in label_text for title in desired_row_titles):
            value_elem = item.find('div', class_='pi-database-value')
            if not value_elem:
                continue

            value_text = value_elem.text.strip()
            value_text = re.sub(r'\[\d+\]', ' ', value_text)
            value_text = re.sub(r'\s+', ' ', value_text)
            value_text = re.sub(r'[^\x00-\x7F]+', '', value_text)  # Remove non-ASCII characters
            value_text = value_text.strip()

            if "Bounty" in label_text:
                bounty_numbers = re.findall(r'[\d,]+', value_text)
                if bounty_numbers:
                    value_text = bounty_numbers[0]

            all_data.append(label_text + ": " + value_text)

    info_string = ", ".join(all_data)
    return info_string


def get_devil_fruit(chosen_name, debug=False):
    url = get_link(chosen_name)
    response = requests.get(url)

    soup = BeautifulSoup(response.content, 'html.parser')
    header = soup.find('th', string='Devil Fruit')

    if not header:
        return

    table = header.find_parent('table')
    all_rows = table.find_all('tr')

    selected_rows = [all_rows[i] for i in [1, 2, 4] if i < len(all_rows)]

    table_data = []
    for row in selected_rows:
        cells = row.find_all(['td', 'th'])

        row_data = []
        for cell in cells:
            text = cell.text.strip()
            text = re.sub(r'[^\x00-\x7F]+', '', text)  # Remove non-ASCII characters
            text = re.sub(r'\[\d+\]', '', text)
            text = re.sub(r'\s+', ' ', text)
            text = text.strip()

            row_data.append(text)

        if row_data:
            table_data.append(row_data)

    all_strings = [cell for row in table_data for cell in row if cell]
    fruit_string = ", ".join(all_strings)

    if debug:
        print("Successfully fetched devil fruit database from the wiki")

    return fruit_string


def extract_data_from_wiki(chosen_name, debug=False):
    url = get_link(chosen_name)
    response = requests.get(url)

    soup = BeautifulSoup(response.content, 'html.parser')
    main_content = soup.select_one('main') or soup.select_one('article') or soup.select_one('#content') or soup
    paragraphs = main_content.find_all('p')

    paragraph_texts = []
    for p in paragraphs:
        text = p.get_text().strip()
        text = re.sub(r'\[\d+\]', '', text)
        text = re.sub(r'[^\x00-\x7F]+', '', text)
        text = re.sub(r'\[[^\]]*\]', '', text)

        if text:
            paragraph_texts.append(text)

    # Join all paragraph texts into a single string with newlines
    character_wiki_info = "\n".join(paragraph_texts)

    # Check the content directly
    if character_wiki_info.startswith("There is currently no text in this page"):
        print(f"Cannot find character database in the wiki for the character: {chosen_name}")
        return -1

    if debug:
        print("Successfully fetched character database from the wiki")

    return character_wiki_info


def get_link(name):
    parsed_name = name.replace(' ', '_')
    return f"https://onepiece.fandom.com/wiki/{parsed_name}"
