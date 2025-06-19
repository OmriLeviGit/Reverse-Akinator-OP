import csv
import requests
import os
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image
import time
from io import BytesIO


def crop_top_square(img):
    width, height = img.size
    square_size = min(width, height)
    left = (width - square_size) // 2
    top = 0
    right = left + square_size
    bottom = square_size
    return img.crop((left, top, right, bottom))


def get_image_from_wiki(wiki_url):
    """Extract image URL from wiki page using Beautiful Soup"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(wiki_url, headers=headers, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Find the first image with class "pi-image-thumbnail"
        img_tag = soup.find('img', class_='pi-image-thumbnail')

        if img_tag and img_tag.get('src'):
            image_url = img_tag['src']

            # Handle relative URLs by making them absolute
            if image_url.startswith('//'):
                image_url = 'https:' + image_url
            elif image_url.startswith('/'):
                from urllib.parse import urljoin
                image_url = urljoin(wiki_url, image_url)

            return image_url

        return None

    except Exception as e:
        print(f"Error parsing wiki page {wiki_url}: {e}")
        return None


def download_and_process_image(image_url, character_id, large_folder, avatar_folder):
    """Download image and create both sizes directly"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        response = requests.get(image_url, headers=headers, timeout=30)
        response.raise_for_status()

        # Open image from memory
        img = Image.open(BytesIO(response.content))

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Crop to top-center square
        img_square = crop_top_square(img)
        original_size = img_square.size[0]  # Square, so width = height

        # Create large version (always 256x256)
        large_img = img_square.resize((256, 256), Image.Resampling.LANCZOS)
        large_path = large_folder / f"{character_id}.webp"

        if original_size > 256:
            large_img.save(large_path, 'WEBP', quality=90, optimize=True)  # Downscaling
        else:
            large_img.save(large_path, 'WEBP', quality=100, optimize=True)  # Upscaling

        # Same logic for avatar
        avatar_img = img_square.resize((64, 64), Image.Resampling.LANCZOS)
        avatar_path = avatar_folder / f"{character_id}.webp"

        if original_size > 64:
            avatar_img.save(avatar_path, 'WEBP', quality=90, optimize=True)  # Downscaling
        else:
            avatar_img.save(avatar_path, 'WEBP', quality=100, optimize=True)  # Upscaling

        return True

    except Exception as e:
        print(f"Error processing image for {character_id}: {e}")
        return False


def download_character_avatars(skip_existing=True):
    csv_file = Path(__file__).parent.parent / "data" / "character_data.csv"
    large_folder = Path(__file__).parent.parent / "data" / "img" / "lg_avatars"
    avatar_folder = Path(__file__).parent.parent / "data" / "img" / "sm_avatars"

    # Create output folders
    os.makedirs(large_folder, exist_ok=True)
    os.makedirs(avatar_folder, exist_ok=True)

    skipped_count = 0
    successful_downloads = 0
    failed_downloads = []

    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)

        for row in reader:
            character_id = row['ID']
            wiki_url = row['Wiki']

            if not wiki_url or not character_id:
                continue

            if skip_existing:
                large_path = large_folder / f"{character_id}.webp"
                avatar_path = avatar_folder / f"{character_id}.webp"

                if large_path.exists() and avatar_path.exists():
                    skipped_count += 1
                    continue

            print(f"Processing {character_id}: {wiki_url}")

            # Extract image URL from wiki page
            image_url = get_image_from_wiki(wiki_url)

            if not image_url:
                print(f"✗ No image found for {character_id}")
                failed_downloads.append(character_id)
                continue

            # Download and process directly
            if download_and_process_image(image_url, character_id, large_folder, avatar_folder):
                print(f"✓ Processed: {character_id}")
                successful_downloads += 1
            else:
                print(f"✗ Failed: {character_id}")
                failed_downloads.append(character_id)

            time.sleep(1)

    print(f"\nProcessing complete!")
    print(f"Successful: {successful_downloads}")
    print(f"Failed: {len(failed_downloads)} \n  {failed_downloads}")
    print(f"Skipped: {skipped_count}")


if __name__ == "__main__":
    download_character_avatars(skip_existing=True)