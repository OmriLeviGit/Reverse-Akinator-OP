import csv
import requests
from bs4 import BeautifulSoup
from collections import Counter
import time
from pathlib import Path
import sys

from server.config import CHARACTER_CSV_PATH

# Configuration
DELAY_BETWEEN_REQUESTS = 1
MAX_CHARACTERS = 5


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

            # Skip empty headers
            if header_text.endswith('[]'):
                valid_section = header_text.replace('[]', '').strip()
                sections.append(valid_section)

        return sections

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return []
    except Exception as e:
        print(f"Error parsing {url}: {e}")
        return []


def discover_sections():
    """Main discovery function"""
    print("Starting section discovery...")
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

    # Collect all sections
    all_sections = Counter()
    character_section_map = {}  # Track which characters have which sections
    processed_count = 0

    for char_info in characters:
        char_name = char_info['name']
        char_url = char_info['url']

        print(f"Processing {processed_count + 1}/{len(characters)}: {char_name}")

        sections = extract_h2_headers(char_url)

        if sections:
            # Update counters
            for section in sections:
                all_sections[section] += 1

            # Track per character
            character_section_map[char_name] = sections
            print(f"  Found {len(sections)} sections")
        else:
            print(f"  No sections found")

        processed_count += 1

        # Delay to be respectful to the server
        if DELAY_BETWEEN_REQUESTS > 0 and processed_count < len(characters):
            time.sleep(DELAY_BETWEEN_REQUESTS)

    # Print results
    print("\n" + "=" * 80)
    print("SECTION DISCOVERY RESULTS")
    print("=" * 80)

    print(f"\nProcessed {processed_count} characters")
    print(f"Found {len(all_sections)} unique sections")

    # Sort sections by frequency (most common first)
    sorted_sections = all_sections.most_common()

    print(f"\nSECTIONS BY FREQUENCY:")
    print("-" * 50)
    for section, count in sorted_sections:
        percentage = (count / len(characters)) * 100
        print(f"{count:4d} ({percentage:5.1f}%) - {section}")

    # Print alphabetical list for easy manual review
    print(f"\nSECTIONS ALPHABETICALLY:")
    print("-" * 50)
    alphabetical_sections = sorted(all_sections.keys())
    for i, section in enumerate(alphabetical_sections, 1):
        count = all_sections[section]
        print(f"{i:3d}. {section} ({count} characters)")

    # Print some examples of characters with many sections
    print(f"\nCHARACTERS WITH MOST SECTIONS:")
    print("-" * 50)
    char_section_counts = [(name, len(sections)) for name, sections in character_section_map.items()]
    char_section_counts.sort(key=lambda x: x[1], reverse=True)

    for char_name, section_count in char_section_counts[:10]:  # Top 10
        sections_list = ', '.join(character_section_map[char_name])
        print(f"{char_name} ({section_count} sections): {sections_list}")

    # Save results to file for reference
    output_file = Path("section_discovery_results.txt")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("ONE PIECE CHARACTER SECTIONS DISCOVERY\n")
        f.write("=" * 50 + "\n\n")

        f.write(f"Processed {processed_count} characters\n")
        f.write(f"Found {len(all_sections)} unique sections\n\n")

        f.write("SECTIONS BY FREQUENCY:\n")
        f.write("-" * 30 + "\n")
        for section, count in sorted_sections:
            percentage = (count / len(characters)) * 100
            f.write(f"{count:4d} ({percentage:5.1f}%) - {section}\n")

        f.write("\nSECTIONS ALPHABETICALLY:\n")
        f.write("-" * 30 + "\n")
        for section in alphabetical_sections:
            count = all_sections[section]
            f.write(f"{section} ({count})\n")

    print(f"\nResults also saved to: {output_file}")


if __name__ == "__main__":
    discover_sections()