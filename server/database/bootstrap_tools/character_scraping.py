import requests
from bs4 import BeautifulSoup
import re
from collections import defaultdict
import time
import sys
from pathlib import Path

# Add the server directory to the Python path so we can import settings
sys.path.append(str(Path(__file__).parent.parent.parent))
from server.config.settings import WHITELISTED_SECTIONS, WHITELISTED_STATISTICS

# Configuration
DELAY_BETWEEN_REQUESTS = 0.1

def clean_narrative_text(text):
    """Clean narrative text by removing wiki reference tags and other unwanted elements"""
    if not text:
        return text
    
    # Remove [number] reference tags
    text = re.sub(r'\[\d+\]', '', text)
    
    # Remove empty brackets
    text = re.sub(r'\[\s*\]', '', text)
    
    # Remove citation needed tags
    text = re.sub(r'\[citation needed\]', '', text)
    
    # Remove other common wiki tags
    text = re.sub(r'\[edit\]', '', text)
    
    # Remove zero-width spaces and other invisible Unicode characters
    text = re.sub(r'[\u200b-\u200f\u2028-\u202f\u205f-\u206f\ufeff]', '', text)
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def clean_bounty_value(bounty_str):
    """Extract and separate bounty values from concatenated string"""
    if not bounty_str:
        return {}
    
    # Extract all bounty amounts (numbers followed by zeros or with commas)
    bounty_pattern = r'(\d{1,3}(?:,\d{3})*(?:,\d{3})*)'
    matches = re.findall(bounty_pattern, bounty_str)
    
    if not matches:
        return {'current_bounty': bounty_str}
    
    # Convert to integers for proper sorting
    bounties = []
    for match in matches:
        try:
            bounty_int = int(match.replace(',', ''))
            bounties.append(bounty_int)
        except ValueError:
            continue
    
    if not bounties:
        return {'current_bounty': bounty_str}
    
    # Sort bounties in descending order (highest first)
    bounties.sort(reverse=True)
    
    # Format bounties back to string format
    formatted_bounties = [f"{bounty:,}" for bounty in bounties]
    
    return {
        'current_bounty': formatted_bounties[0] if formatted_bounties else bounty_str,
        'previous_bounties': formatted_bounties[1:] if len(formatted_bounties) > 1 else []
    }

def clean_structured_data(structured_data):
    """Clean and organize structured data"""
    if not structured_data:
        return {}
    
    cleaned_data = {}
    
    for field, value in structured_data.items():
        if not value:
            continue
            
        # Clean the field name
        clean_field = field.strip().lower()
        
        # Clean the value
        clean_value = value.strip()
        
        # Remove wiki markup from values
        clean_value = re.sub(r'\[\d+\]', '', clean_value)
        clean_value = re.sub(r'\[.*?\]', '', clean_value)
        clean_value = re.sub(r'\s+', ' ', clean_value).strip()
        
        # Special handling for bounties
        if clean_field.lower() == 'bounty':
            bounty_data = clean_bounty_value(clean_value)
            # Only add bounty fields if they have meaningful values
            for bounty_field, bounty_value in bounty_data.items():
                if bounty_value and bounty_value != [] and bounty_value != '':
                    # Convert list to string for ChromaDB compatibility
                    if isinstance(bounty_value, list) and bounty_value:
                        cleaned_data[bounty_field] = ', '.join(map(str, bounty_value))
                    elif not isinstance(bounty_value, list):
                        cleaned_data[bounty_field] = bounty_value
        else:
            cleaned_data[clean_field] = clean_value
    
    return cleaned_data


def get_character_subpages(main_page_url):
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
            else:
                break

        except Exception:
            break

    return subpages


def is_section_whitelisted(section_name):
    """Check if a section name is in the whitelist (case-insensitive)"""
    return any(section_name.lower() == whitelisted.lower() for whitelisted in WHITELISTED_SECTIONS)


def is_statistic_whitelisted(field_name, section_name):
    """Check if a statistic field from a specific section is in the whitelist"""
    field_tuple = (field_name.lower(), section_name.lower())
    return any(field_tuple == (whitelisted[0].lower(), whitelisted[1].lower()) for whitelisted in WHITELISTED_STATISTICS)


def extract_paragraphs_from_page(url, section_override=None):
    """Extract paragraphs from a page using H2-to-H2 method, including pre-H2 content"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        sections_data = defaultdict(list)

        def extract_paragraphs_after_element(start_element):
            """Helper function to extract paragraphs after a given element until next H2"""
            paragraphs = []
            current_element = start_element.find_next_sibling()

            while current_element:
                if current_element.name == 'h2':
                    break
                elif current_element.name == 'p':
                    text = current_element.get_text().strip()
                    if text:
                        cleaned_text = clean_narrative_text(text)
                        if cleaned_text:
                            paragraphs.append(cleaned_text)
                current_element = current_element.find_next_sibling()

            return paragraphs

        # Extract intro paragraphs (after infoboxes, before first H2)
        intro_paragraphs = []
        infobox_containers = soup.find_all('div', style=re.compile(r'float\s*:\s*right', re.I))

        if infobox_containers:
            last_infobox = infobox_containers[-1]
            intro_paragraphs = extract_paragraphs_after_element(last_infobox)

        if section_override:
            # For subpages: add intro first, then H2 content to same section
            if is_section_whitelisted(section_override):
                if intro_paragraphs:
                    sections_data[section_override].extend(intro_paragraphs)

                # Add paragraphs from all H2 sections
                for h2 in soup.find_all('h2'):
                    h2_paragraphs = extract_paragraphs_after_element(h2)
                    if h2_paragraphs:
                        sections_data[section_override].extend(h2_paragraphs)
        else:
            # For main pages: intro as separate section, then whitelisted H2 sections
            if intro_paragraphs:
                sections_data['introduction'].extend(intro_paragraphs)

            for h2 in soup.find_all('h2'):
                h2_text = h2.get_text().replace('[edit]', '').strip().replace("[]", "").lower()

                if is_section_whitelisted(h2_text):
                    h2_paragraphs = extract_paragraphs_after_element(h2)
                    if h2_paragraphs:
                        sections_data[h2_text].extend(h2_paragraphs)

        return dict(sections_data)

    except Exception:
        return {}


def extract_structured_data(url):
    """Extract structured data from infobox tables, filtered by whitelist"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        structured_data = {}

        infobox_containers = soup.find_all('div', style=re.compile(r'float\s*:\s*right', re.I))

        for container in infobox_containers:
            if container is None:
                continue

            sections = container.find_all('section', class_='pi-item')

            for section in sections:
                # Get section header for context
                section_header = section.find('h2', class_='pi-header')
                if section_header:
                    section_context = section_header.get_text(strip=True)
                    section_context = re.sub(r'\[.*?]', '', section_context).strip().lower()
                else:
                    section_context = "unknown"

                data_items = section.find_all('div', class_='pi-item')

                for item in data_items:
                    label_element = item.find('h3', class_='pi-data-label')
                    if label_element:
                        field_name = label_element.get_text(strip=True)
                        field_name = re.sub(r'\[.*?]', '', field_name)
                        field_name = field_name.strip().lower()

                        if field_name.endswith(':'):
                            field_name = field_name[:-1].strip()

                        if not is_statistic_whitelisted(field_name, section_context):
                            continue

                        value_element = item.find('div', class_='pi-data-value')
                        if value_element:
                            field_value = value_element.get_text(strip=True)
                            field_value = re.sub(r'\[.*?]', '', field_value)
                            field_value = field_value.strip()

                            if field_name and field_value:
                                # Format field name based on section
                                if section_context == "statistics":
                                    final_field_name = field_name
                                else:
                                    final_field_name = f"{section_context} - {field_name}"

                                structured_data[final_field_name] = field_value

        return structured_data

    except Exception:
        return {}


def extract_subpage_name(subpage_url):
    """Extract clean subpage name from URL"""
    return subpage_url.split('/')[-1].replace('_', ' ').strip().lower()


def scrape_character(wiki_url):
    """
    Scrape a single character's data from their wiki page and all subpages

    Args:
        wiki_url (str): Main character wiki URL

    Returns:
        tuple: (structured_data, narrative_sections)
    """

    narrative_sections = defaultdict(list)

    # Extract and clean structured data
    raw_structured_data = extract_structured_data(wiki_url)
    structured_data = clean_structured_data(raw_structured_data)
    
    # Extract narrative sections from main page
    main_page_sections = extract_paragraphs_from_page(wiki_url)

    for section_name, paragraphs in main_page_sections.items():
        narrative_sections[section_name].extend(paragraphs)

    # Extract narrative sections from subpages
    subpages = get_character_subpages(wiki_url)

    for subpage_url in subpages:
        subpage_name = extract_subpage_name(subpage_url)

        if is_section_whitelisted(subpage_name):
            subpage_sections = extract_paragraphs_from_page(subpage_url, section_override=subpage_name)

            for section_name, paragraphs in subpage_sections.items():
                narrative_sections[section_name].extend(paragraphs)

        if DELAY_BETWEEN_REQUESTS > 0:
            time.sleep(DELAY_BETWEEN_REQUESTS)

    narrative_sections = dict(narrative_sections)

    return structured_data, narrative_sections

# Example usage
def example_usage():
    """Example of how to use the scraper"""

    # Scrape a single character
    wiki_url = "https://onepiece.fandom.com/wiki/Monkey_D._Luffy"
    structured_data, narrative_sections = scrape_character(wiki_url)

    print(f"Structured data fields: {len(structured_data)}")
    print(f"Narrative sections: {len(narrative_sections)}")
    print(f"Total paragraphs: {sum(len(paragraphs) for paragraphs in narrative_sections.values())}")

    # Example of structured data
    print("\nStructured Data:")
    for field, value in structured_data.items():
        print(f"  {field}: {value}")

    # Example of narrative sections
    print("\nNarrative Sections:")
    for section_name, paragraphs in narrative_sections.items():
        print(f"  {section_name}: {len(paragraphs)} paragraphs")


if __name__ == "__main__":
    example_usage()