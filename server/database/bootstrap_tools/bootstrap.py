from server.database.bootstrap_tools.create_small_avatars import create_all_small_avatars
from server.database.bootstrap_tools.download_large_avatars import download_character_avatars
from server.database.bootstrap_tools.fetch_character_data import scrape_character_data


def bootstrap():
    scrape_character_data()
    download_character_avatars(skip_existing=True)
    create_all_small_avatars(small_size=128, skip_existing=True)

if __name__ == "__main__":
    bootstrap()