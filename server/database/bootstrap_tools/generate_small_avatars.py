import os
from PIL import Image

from server.config import LARGE_AVATARS_DIR, SMALL_AVATARS_DIR


def crop_top_square(img):
    """Crop image to a square from the top-center"""
    width, height = img.size
    square_size = min(width, height)
    left = (width - square_size) // 2
    top = 0
    right = left + square_size
    bottom = square_size
    return img.crop((left, top, right, bottom))


def create_small_avatar(character_id, large_folder, small_folder, small_size=128):
    """Create small cropped avatar from large image"""
    large_path = large_folder / f"{character_id}.webp"

    if not large_path.exists():
        print(f"Large avatar not found for {character_id}")
        return False

    try:
        # Load the large avatar
        large_img = Image.open(large_path)

        # Crop to square first
        square_img = crop_top_square(large_img)

        # Resize to small size
        small_img = square_img.resize((small_size, small_size), Image.Resampling.LANCZOS)
        small_path = small_folder / f"{character_id}.webp"

        # Save small avatar
        small_img.save(small_path, 'WEBP', quality=90, optimize=True)

        return True

    except Exception as e:
        print(f"Error creating small avatar for {character_id}: {e}")
        return False


def create_all_small_avatars(large_folder=LARGE_AVATARS_DIR, small_folder=SMALL_AVATARS_DIR, small_size=128, skip_existing=True):
    """Create all small avatars from existing large ones"""
    os.makedirs(small_folder, exist_ok=True)

    successful_creations = 0
    failed_creations = []
    skipped_count = 0

    # Get all large avatar files
    large_files = list(large_folder.glob("*.webp"))

    if not large_files:
        print("No large avatars found!")
        return

    print(f"Creating {len(large_files)} small avatars with size {small_size}x{small_size}...")

    for large_file in large_files:
        character_id = large_file.stem  # filename without extension

        if skip_existing:
            small_path = small_folder / f"{character_id}.webp"
            if small_path.exists():
                skipped_count += 1
                continue

        if create_small_avatar(character_id, large_folder, small_folder, small_size):
            print(f"✓ Created: {character_id}")
            successful_creations += 1
        else:
            print(f"✗ Failed: {character_id}")
            failed_creations.append(character_id)

    print(f"\nCreation complete!")
    print(f"Successful: {successful_creations}")
    print(f"Failed: {len(failed_creations)} - {failed_creations}")
    print(f"Skipped: {skipped_count}")


if __name__ == "__main__":
    create_all_small_avatars(small_size=128, skip_existing=True)