from server.bootstrap_tools.download_images import download_character_avatars
from server.bootstrap_tools.fetch_character_data import scrape_character_data
from server.bootstrap_tools.user_preferences import create_user_preferences


def bootstrap():
    scrape_character_data()
    download_character_avatars()
    create_user_preferences()


if __name__ == "__main__":
    bootstrap()