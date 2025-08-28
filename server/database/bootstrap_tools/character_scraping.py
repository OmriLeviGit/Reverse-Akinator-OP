import requests
from bs4 import BeautifulSoup
import re
from collections import defaultdict
import time

# Configuration
DELAY_BETWEEN_REQUESTS = 1

# WHITELISTS - Only scrape these sections and statistics
WHITELISTED_SECTIONS = [
    'Appearance',
    'Personality',
    'History',
    'Abilities and Powers',
    'Relationships',
    'Gallery',
    'Trivia'
]

WHITELISTED_STATISTICS = [
    'Age',
    'Birthday',
    'Height',
    'Bounty',
    'Devil Fruit',
    'Haki',
    'Epithet',
    'Affiliation',
    'Occupation',
    'Origin',
    'Dream',
    'Japanese Name',
    'English Name'
    'Status'
]


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


def is_statistic_whitelisted(field_name):
    """Check if a statistic field is in the whitelist (case-insensitive)"""
    return any(field_name.lower() == whitelisted.lower() for whitelisted in WHITELISTED_STATISTICS)


def extract_paragraphs_from_page(url, section_override=None):
    """Extract paragraphs from a page using H2-to-H2 method"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        sections_data = defaultdict(list)

        if section_override:
            # For subpages: collect paragraphs from ALL H2 sections under the subpage name
            if is_section_whitelisted(section_override):
                h2_tags = soup.find_all('h2')

                for h2 in h2_tags:
                    paragraphs = []
                    current_element = h2.find_next_sibling()

                    while current_element:
                        if current_element.name == 'h2':
                            break
                        elif current_element.name == 'p':
                            text = current_element.get_text().strip()
                            if text:
                                paragraphs.append(text)
                        current_element = current_element.find_next_sibling()

                    if paragraphs:
                        sections_data[section_override].extend(paragraphs)
        else:
            # For main pages: organize by H2 headers, filter by whitelist
            h2_tags = soup.find_all('h2')

            for h2 in h2_tags:
                h2_text = h2.get_text().replace('[edit]', '').strip().replace("[]", "")


                if not is_section_whitelisted(h2_text):
                    continue

                paragraphs = []
                current_element = h2.find_next_sibling()

                while current_element:
                    if current_element.name == 'h2':
                        break
                    elif current_element.name == 'p':
                        text = current_element.get_text().strip()
                        if text:
                            paragraphs.append(text)
                    current_element = current_element.find_next_sibling()

                if paragraphs:
                    sections_data[h2_text].extend(paragraphs)

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
                data_items = section.find_all('div', class_='pi-item')

                for item in data_items:
                    label_element = item.find('h3', class_='pi-data-label')
                    if label_element:
                        field_name = label_element.get_text(strip=True)
                        field_name = re.sub(r'\[.*?]', '', field_name)
                        field_name = field_name.strip()

                        if field_name.endswith(':'):
                            field_name = field_name[:-1].strip()

                        if not is_statistic_whitelisted(field_name):
                            continue

                        value_element = item.find('div', class_='pi-data-value')
                        if value_element:
                            field_value = value_element.get_text(strip=True)
                            field_value = re.sub(r'\[.*?]', '', field_value)
                            field_value = field_value.strip()

                            if field_name and field_value:
                                structured_data[field_name] = field_value

        return structured_data

    except Exception:
        return {}


def extract_subpage_name(subpage_url):
    """Extract clean subpage name from URL"""
    return subpage_url.split('/')[-1].replace('_', ' ')


def scrape_character(wiki_url):
    """
    Scrape a single character's data from their wiki page and all subpages

    Args:
        wiki_url (str): Main character wiki URL

    Returns:
        tuple: (structured_data, narrative_sections)
    """

    narrative_sections = defaultdict(list)

    structured_data = extract_structured_data(wiki_url)
    main_page_sections = extract_paragraphs_from_page(wiki_url)

    for section_name, paragraphs in main_page_sections.items():
        narrative_sections[section_name].extend(paragraphs)

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
    wiki_url = "https://onepiece.fandom.com/wiki/150"
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