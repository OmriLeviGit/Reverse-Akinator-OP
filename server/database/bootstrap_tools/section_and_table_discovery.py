import csv
import requests
from bs4 import BeautifulSoup
from collections import Counter
import time
import sys
import re

from server.config import CHARACTER_CSV_PATH, DISCOVERY_PATH

# Configuration
DELAY_BETWEEN_REQUESTS = 1
MAX_CHARACTERS = None


def load_character_urls(csv_path):
    """Load character URLs from the CSV file"""
    character_urls = []

    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                wiki_url = row.get('Wiki')
                character_id = row.get('ID')

                if wiki_url and character_id and isinstance(wiki_url, str) and wiki_url.strip():
                    character_urls.append({
                        'id': character_id,
                        'url': wiki_url.strip()
                    })

    except FileNotFoundError:
        print(f"Error: Could not find CSV file at {csv_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)

    return character_urls


def get_all_character_subpages(main_page_url):
    """Get all subpages for a character using MediaWiki API"""
    character_name = main_page_url.split('/')[-1]
    subpages = []

    api_url = "https://onepiece.fandom.com/api.php"
    continue_token = None

    while True:
        params = {
            'action': 'query',
            'list': 'allpages',
            'apprefix': f'{character_name}/',
            'format': 'json',
            'aplimit': 500
        }

        if continue_token:
            params['apcontinue'] = continue_token

        try:
            response = requests.get(api_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            pages = data.get('query', {}).get('allpages', [])
            for page in pages:
                page_title = page.get('title')
                if page_title:
                    page_url = f"https://onepiece.fandom.com/wiki/{page_title.replace(' ', '_')}"
                    subpages.append(page_url)

            if 'continue' in data:
                continue_token = data['continue']['apcontinue']
                print(f"  Found {len(pages)} subpages, continuing...")
            else:
                break

        except Exception as e:
            print(f"Error getting subpages for {character_name}: {e}")
            break

    return subpages


def extract_h2_headers(url):
    """Extract all h2 headers from a character page"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        h2_tags = soup.find_all('h2')
        sections = []

        for h2 in h2_tags:
            h2_text = h2.get_text().strip().replace('[]', '')
            current_element = h2.find_next_sibling()

            while current_element:
                if current_element.name == 'h2':
                    break
                elif current_element.name == 'p':
                    text = current_element.get_text().strip()
                    if text:
                        sections.append(h2_text)
                        break
                current_element = current_element.find_next_sibling()

        return sections

    except requests.exceptions.RequestException as e:
        print(f"Error fetching the URL {url}: {e}")
        return []
    except Exception as e:
        print(f"An error occurred processing {url}: {e}")
        return []


def extract_statistics_entries(url):
    """Extract statistics entries with their section names from character infobox"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        statistics_entries = []

        infobox_containers = soup.find_all('div', style=re.compile(r'float\s*:\s*right', re.I))

        for container in infobox_containers:
            if container is None:
                continue

            sections = container.find_all('section', class_='pi-item')

            for section in sections:
                section_header = section.find('h2', class_='pi-header')
                if section_header:
                    section_name = section_header.get_text(strip=True)
                    section_name = re.sub(r'\[.*?]', '', section_name).strip()
                else:
                    section_name = "Unknown"

                label_elements = section.find_all('h3', class_='pi-data-label')

                for label in label_elements:
                    field_text = label.get_text(strip=True)
                    field_text = re.sub(r'\[.*?]', '', field_text)
                    field_text = field_text.strip()

                    if field_text.endswith(':'):
                        field_text = field_text[:-1].strip()

                    if not field_text:
                        continue

                    if not re.search(r'[a-zA-Z]', field_text):
                        continue

                    statistics_entries.append((field_text, section_name))

        return statistics_entries

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return []
    except Exception as e:
        print(f"Error parsing statistics from {url}: {e}")
        return []


def extract_subpage_name(subpage_url):
    """Extract the subpage name from URL for use as section name"""
    subpage_name = subpage_url.split('/')[-1].replace('_', ' ')
    return subpage_name


def discover_sections(character_csv_path=CHARACTER_CSV_PATH):
    """Main discovery function using API to find all subpages"""

    print("Starting section and statistics discovery with API method...")
    print(f"Loading characters from: {character_csv_path}")

    characters = load_character_urls(character_csv_path)

    if not characters:
        print("No characters found in CSV file")
        return

    if MAX_CHARACTERS:
        characters = characters[:MAX_CHARACTERS]
        print(f"Limited to first {MAX_CHARACTERS} characters for testing")

    print(f"Found {len(characters)} characters to process")

    all_sections = Counter()
    all_statistics = Counter()
    character_subpages_map = {}
    character_section_map = {}
    character_statistics_map = {}
    processed_count = 0

    for char_info in characters:
        character_id = char_info['id']
        main_page_url = char_info['url']

        print(f"Processing {processed_count + 1}/{len(characters)}: {character_id}")

        subpages = get_all_character_subpages(main_page_url)
        character_subpages_map[character_id] = subpages

        print(f"  Found {len(subpages)} subpages")

        main_page_sections = extract_h2_headers(main_page_url)
        main_page_statistics = extract_statistics_entries(main_page_url)

        subpage_sections = []
        for subpage_url in subpages:
            subpage_name = extract_subpage_name(subpage_url)
            subpage_sections.append(subpage_name)

        all_character_sections = main_page_sections + subpage_sections

        for section in all_character_sections:
            all_sections[section] += 1

        for stat in main_page_statistics:
            all_statistics[stat] += 1

        character_section_map[character_id] = all_character_sections
        character_statistics_map[character_id] = main_page_statistics

        print(f"  H2 sections from main page: {len(main_page_sections)}")
        print(f"  Subpage sections: {len(subpage_sections)}")
        print(f"  Statistics from main page: {len(main_page_statistics)}")
        print(f"  Total sections: {len(all_character_sections)}")

        processed_count += 1

        if DELAY_BETWEEN_REQUESTS > 0:
            time.sleep(DELAY_BETWEEN_REQUESTS)

    # Print and save results (same as before but using character_id)
    print("\n" + "=" * 60)
    print("DISCOVERY RESULTS")
    print("=" * 60)

    print(f"\nProcessed {processed_count} characters")
    print(f"Found {len(all_sections)} unique sections")
    print(f"Found {len(all_statistics)} unique statistics entries")

    if all_sections:
        print(f"\nSECTIONS BY FREQUENCY:")
        print("-" * 30)
        for section, count in all_sections.most_common():
            percentage = (count / processed_count) * 100
            print(f"{count:4d} ({percentage:5.1f}%) - {section}")

    if all_statistics:
        print(f"\nSTATISTICS ENTRIES BY FREQUENCY:")
        print("-" * 30)
        for stat, count in all_statistics.most_common():
            percentage = (count / processed_count) * 100
            print(f"{count:4d} ({percentage:5.1f}%) - {stat}")

    # Save to file (using character_id instead of names)
    output_file = DISCOVERY_PATH
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("ONE PIECE CHARACTER SECTIONS AND STATISTICS DISCOVERY (API METHOD)\n")
        f.write("=" * 70 + "\n\n")

        f.write(f"Processed {processed_count} characters\n")
        f.write(f"Found {len(all_sections)} unique sections\n")
        f.write(f"Found {len(all_statistics)} unique statistics entries\n\n")

        if all_sections:
            f.write("SECTIONS BY FREQUENCY:\n")
            f.write("-" * 30 + "\n")
            for section, count in all_sections.most_common():
                percentage = (count / processed_count) * 100
                f.write(f"{count:4d} ({percentage:5.1f}%) - {section}\n")

        if all_statistics:
            f.write("\nSTATISTICS ENTRIES BY FREQUENCY:\n")
            f.write("-" * 30 + "\n")
            for stat, count in all_statistics.most_common():
                percentage = (count / processed_count) * 100
                f.write(f"{count:4d} ({percentage:5.1f}%) - {stat}\n")

        if character_section_map:
            f.write("\nCHARACTER SECTIONS (H2 + Subpage Names):\n")
            f.write("-" * 40 + "\n")
            for character_id, sections in character_section_map.items():
                sections_list = ', '.join(sections)
                f.write(f"{character_id}: {sections_list}\n")

    print(f"\nResults also saved to: {output_file}")


if __name__ == "__main__":
    discover_sections()