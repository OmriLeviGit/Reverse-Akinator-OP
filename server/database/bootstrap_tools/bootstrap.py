from server.database.bootstrap_tools.download_images import download_character_avatars
from server.database.bootstrap_tools.fetch_character_data import scrape_character_data


def bootstrap():
    scrape_character_data()
    download_character_avatars()


if __name__ == "__main__":
    bootstrap()