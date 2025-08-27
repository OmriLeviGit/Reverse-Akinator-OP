import csv
import requests
from bs4 import BeautifulSoup
from collections import Counter
import time
import sys
import re

from sympy.codegen.ast import Raise

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
                character_name = row.get('Name', 'Unknown')

                if wiki_url and isinstance(wiki_url, str) and wiki_url.strip():
                    character_urls.append({
                        'name': character_name,
                        'url': wiki_url.strip()
                    })

    except FileNotFoundError:
        print(f"Error: Could not find CSV file at {csv_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)

    return character_urls


def extract_h2_headers(url):
    """Extract all h2 headers from a character page"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Find all h2 headers
        h2_headers = soup.find_all('h2')

        sections = []
        for header in h2_headers:
            # Get the text content, clean it up
            header_text = header.get_text().strip()

            # Remove edit links and other common wiki elements
            header_text = header_text.replace('[edit]', '').strip()

            sections.append(header_text)

        if not sections:
            raise ValueError(f"No h2 headers found at {url}")

        return sections

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return []
    except ValueError as e:
        print(f"Parsing issue with {url}: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error parsing {url}: {e}")
        return []


def extract_statistics_entries(url):
    """Extract statistics table entries by finding the character infobox area and extracting field names from all tables within it"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        statistics_entries = set()

        infobox_containers = soup.find_all('div', style=re.compile(r'float\s*:\s*right', re.I))

        for container in infobox_containers:
            if container is None:
                continue

            # Find all h3 elements with the pi-data-label class within this container
            label_elements = container.find_all('h3', class_='pi-data-label')

            for label in label_elements:
                field_text = label.get_text(strip=True)

                # Clean up the field text
                field_text = re.sub(r'\[.*?\]', '', field_text)  # Remove [edit] and citations
                field_text = field_text.strip()

                # Remove trailing colon if present
                if field_text.endswith(':'):
                    field_text = field_text[:-1].strip()

                # Skip empty entries
                if not field_text:
                    continue

                # Must contain at least one letter
                if not re.search(r'[a-zA-Z]', field_text):
                    continue

                statistics_entries.add(field_text)

        return list(statistics_entries)

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return []
    except Exception as e:
        print(f"Error parsing statistics from {url}: {e}")
        return []


def discover_sections():
    """Main discovery function"""
    print("Starting section and statistics discovery...")
    print(f"Loading characters from: {CHARACTER_CSV_PATH}")

    # Load character URLs
    characters = load_character_urls(CHARACTER_CSV_PATH)

    if not characters:
        print("No characters found in CSV file")
        return

    if MAX_CHARACTERS:
        characters = characters[:MAX_CHARACTERS]
        print(f"Limited to first {MAX_CHARACTERS} characters for testing")

    print(f"Found {len(characters)} characters to process")

    # Collect all sections and statistics
    all_sections = Counter()
    all_statistics = Counter()
    character_section_map = {}
    character_statistics_map = {}
    processed_count = 0

    for char_info in characters:
        char_name = char_info['name']
        char_url = char_info['url']

        if "teach" not in char_name.lower():
            continue

        print(f"Processing {processed_count + 1}/{len(characters)}: {char_name}")

        # Extract sections (h2 headers)
        sections = extract_h2_headers(char_url)

        # Extract statistics entries
        statistics = extract_statistics_entries(char_url)

        if sections:
            # Update section counters
            for section in sections:
                all_sections[section] += 1
            # Track per character
            character_section_map[char_name] = sections
            print(f"  Found {len(sections)} sections")
        else:
            print(f"  No sections found")

        if statistics:
            # Update statistics counters
            for stat in statistics:
                all_statistics[stat] += 1
            # Track per character
            character_statistics_map[char_name] = statistics
            print(f"  Found {len(statistics)} statistics entries")
        else:
            print(f"  No statistics entries found")

        processed_count += 1

        # Delay to be respectful to the server
        if DELAY_BETWEEN_REQUESTS > 0 and processed_count < len(characters):
            time.sleep(DELAY_BETWEEN_REQUESTS)

    # Print results
    print("\n" + "=" * 60)
    print("DISCOVERY RESULTS")
    print("=" * 60)

    print(f"\nProcessed {processed_count} characters")
    print(f"Found {len(all_sections)} unique sections")
    print(f"Found {len(all_statistics)} unique statistics entries")

    # SECTIONS RESULTS
    if all_sections:
        print(f"\nSECTIONS BY FREQUENCY:")
        print("-" * 30)
        for section, count in all_sections.most_common():
            percentage = (count / processed_count) * 100
            print(f"{count:4d} ({percentage:5.1f}%) - {section}")

    # STATISTICS RESULTS
    if all_statistics:
        print(f"\nSTATISTICS ENTRIES BY FREQUENCY:")
        print("-" * 30)
        for stat, count in all_statistics.most_common():
            percentage = (count / processed_count) * 100
            print(f"{count:4d} ({percentage:5.1f}%) - {stat}")

    # Save results to file for reference
    output_file = DISCOVERY_PATH
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("ONE PIECE CHARACTER SECTIONS AND STATISTICS DISCOVERY\n")
        f.write("=" * 60 + "\n\n")

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
            f.write("\nCHARACTER SECTIONS:\n")
            f.write("-" * 20 + "\n")
            for char_name, sections in character_section_map.items():
                sections_list = ', '.join(sections)
                f.write(f"{char_name}: {sections_list}\n")

        if character_statistics_map:
            f.write("\nCHARACTER STATISTICS:\n")
            f.write("-" * 20 + "\n")
            for char_name, stats in character_statistics_map.items():
                stats_list = ', '.join(stats)
                f.write(f"{char_name}: {stats_list}\n")

    print(f"\nResults also saved to: {output_file}")


if __name__ == "__main__":
    discover_sections()