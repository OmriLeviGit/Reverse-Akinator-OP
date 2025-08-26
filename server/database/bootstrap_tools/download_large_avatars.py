import csv
import random
import sys

import requests
import re
import os
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image
import time
from urllib.parse import urljoin
from io import BytesIO


def get_image_from_wiki(wiki_url):
    """Extract full-resolution image URL from One Piece wiki page"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
    'Referer': 'https://onepiece.fandom.com/',
    }

    try:
        response = requests.get(wiki_url, headers=headers, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Look for infobox images
        infobox_imgs = soup.find_all('img', class_='pi-image-thumbnail')

        if not infobox_imgs:
            return None

        anime_img = None
        manga_img = None
        generic_img = None

        for img in infobox_imgs:
            src = img.get('src', '')
            if not src:
                continue

            # Check image type based on filename
            src_lower = src.lower()

            if 'anime' in src_lower and 'infobox' in src_lower:
                anime_img = src
                break
            elif 'manga' in src_lower and 'infobox' in src_lower and not manga_img:
                manga_img = src
            elif ('infobox' in src_lower or 'nopicavailable' in src_lower) and not generic_img:
                generic_img = src

        # Prioritize: Anime > Manga > Generic Infobox
        selected_img = anime_img or manga_img or generic_img

        if selected_img:
            # Handle relative URLs first
            if selected_img.startswith('//'):
                selected_img = 'https:' + selected_img
            elif selected_img.startswith('/'):
                selected_img = urljoin(wiki_url, selected_img)

            # Remove scaling to get full-resolution image
            full_res_url = re.sub(r'/scale-to-width-down/\d+', '', selected_img)

            return full_res_url

        return None

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 403:
            print(f"Access forbidden (403) for {wiki_url}")
            return "403_BLOCKED"  # Special return value to indicate IP block
        else:
            print(f"HTTP error {e.response.status_code} for {wiki_url}: {e}")
            return None
    except Exception as e:
        print(f"Error parsing wiki page {wiki_url}: {e}")
        return None


def download_large_image(image_url, character_id, large_folder):
    """Download image and save as-is (no cropping)"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }

    try:
        if 'NoPicAvailable' in image_url:
            placeholder_path = large_folder / "_NoPicAvailable.webp"

            # If placeholder already exists, just return success
            if placeholder_path.exists():
                return True

            # Download the placeholder image once
            print(f"📥 Downloading placeholder image")
            response = requests.get(image_url, headers=headers, timeout=30)
            response.raise_for_status()

            img = Image.open(BytesIO(response.content))
            if img.mode != 'RGB':
                img = img.convert('RGB')

            img.save(placeholder_path, 'WEBP', quality=95, optimize=True)
            return True

        response = requests.get(image_url, headers=headers, timeout=30)
        response.raise_for_status()

        # Open image from memory
        img = Image.open(BytesIO(response.content))

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Save as-is without cropping
        large_path = large_folder / f"{character_id}.webp"
        img.save(large_path, 'WEBP', quality=95, optimize=True)

        return True

    except Exception as e:
        print(f"Error downloading large avatar for {character_id}: {e}")
        return False


def download_character_avatars(csv_char_path, output_path, skip_existing=True, start_from_letter=None):
    # Create output folder
    os.makedirs(output_path, exist_ok=True)

    skipped_count = 0
    successful_downloads = 0
    failed_downloads = []
    consecutive_403_errors = 0
    MAX_CONSECUTIVE_403S = 2
    skipped_letters = 0
    skipped_no_pic = 0  # Track characters with no picture available

    with open(csv_char_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)

        processed_count = 0

        for row in reader:
            character_id = row['ID']
            wiki_url = row['Wiki']

            if not wiki_url or not character_id:
                print(f"Missing details: {character_id}, {wiki_url}")
                continue

            # Skip characters based on starting letter
            if start_from_letter:
                first_letter = character_id[0].lower()
                if first_letter < start_from_letter.lower():
                    skipped_letters += 1
                    continue

            if skip_existing:
                large_path = output_path / f"{character_id}.webp"
                if large_path.exists():
                    skipped_count += 1
                    continue

            print(f"Processing {character_id}: {wiki_url}")

            # Extract image URL from wiki page
            image_url = get_image_from_wiki(wiki_url)

            # Check if the last error was a 403 (IP blocked)
            if image_url == "403_BLOCKED":
                consecutive_403_errors += 1
                print(f"✗ Access blocked for {character_id} (403 error #{consecutive_403_errors})")

                if consecutive_403_errors >= MAX_CONSECUTIVE_403S:
                    print(f"\n⏱️ PAUSE: {MAX_CONSECUTIVE_403S} consecutive 403 errors detected.")
                    print("Taking a 5-minute break to let the rate limit reset...")

                    # Sleep for 5 minutes (300 seconds) with countdown
                    for remaining in range(300, 0, -30):
                        minutes = remaining // 60
                        seconds = remaining % 60
                        print(f"⏰ Resuming in {minutes}m {seconds}s...")
                        time.sleep(30)  # Update every 30 seconds

                    print("🔄 Resuming downloads...")
                    consecutive_403_errors = 0  # Reset counter after the break

                    # RETRY the current character after the break
                    print(f"🔄 Retrying {character_id}: {wiki_url}")
                    image_url = get_image_from_wiki(wiki_url)

                    # Process the retry result
                    if image_url == "403_BLOCKED":
                        print(f"✗ Still blocked after break: {character_id}")
                        failed_downloads.append((character_id, wiki_url))
                    elif not image_url:
                        print(f"✗ No image found for {character_id}")
                        failed_downloads.append((character_id, wiki_url))
                    else:
                        # Check if retry result is NoPicAvailable
                        if 'NoPicAvailable' in image_url:
                            print(f"🚫 No picture available for {character_id}")
                            skipped_no_pic += 1

                        if download_large_image(image_url, character_id, output_path):
                            print(f"✓ Downloaded after retry: {character_id}")
                            successful_downloads += 1
                        else:
                            print(f"✗ Failed to download after retry: {character_id}")
                            failed_downloads.append((character_id, wiki_url))
                else:
                    # Less than MAX_CONSECUTIVE_403S, just add to failed list for now
                    failed_downloads.append((character_id, wiki_url))

            elif not image_url:
                consecutive_403_errors = 0
                print(f"✗ No image found for {character_id}")
                failed_downloads.append((character_id, wiki_url))
            else:
                consecutive_403_errors = 0

                # Check if this is a "No Picture Available" image
                if 'NoPicAvailable' in image_url:
                    skipped_no_pic += 1
                    download_large_image(image_url, character_id, output_path)
                    print(f"🚫 No picture available for {character_id}")
                    successful_downloads += 1
                else:
                    if download_large_image(image_url, character_id, output_path):
                        print(f"✓ Downloaded: {character_id}")
                        successful_downloads += 1
                    else:
                        print(f"✗ Failed to download: {character_id}")
                        failed_downloads.append((character_id, wiki_url))

            # Increment counter for characters that were actually processed (not skipped)
            processed_count += 1

            # Regular sleep between requests
            time.sleep(random.uniform(1.0, 3.0))

            # Additional longer pause every 10 characters
            if processed_count % 10 == 0:
                print(f"📊 Processed {processed_count} characters - taking extra 10 second break...")
                time.sleep(10)

    print(f"\n" + "=" * 50)
    print(f"DOWNLOAD SUMMARY")
    print(f"=" * 50)
    if start_from_letter:
        print(f"Started from letter: {start_from_letter.upper()}")
        print(f"Skipped (letter filter): {skipped_letters}")
    print(f"Successful: {successful_downloads}")
    print(f"Skipped (already exist): {skipped_count}")
    print(f"Skipped (no picture available): {skipped_no_pic}")
    print(f"Failed: {len(failed_downloads)}")

    if failed_downloads:
        print(f"\nFAILED DOWNLOADS:")
        print("-" * 30)
        for char_id, wiki_url in failed_downloads:
            print(f"{char_id}: {wiki_url}")


if __name__ == "__main__":
    start_letter = None
    if len(sys.argv) > 1:
        start_letter = sys.argv[1]
        print(f"Starting from letter: {start_letter.upper()}")

    csv_char_path = Path(__file__).parent.parent / "static_data" / "character_data.csv"
    output_path = Path(__file__).parent.parent / "static_data" / "img" / "lg_avatars"

    download_character_avatars(csv_char_path, output_path, skip_existing=True, start_from_letter=start_letter)