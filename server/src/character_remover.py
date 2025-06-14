import data_fetcher
from ReverseAkinator import ReverseAkinator
from main import WANO_LAST_EP, WANO_LAST_CH, API_KEY, config


def find_next_character_with_letter(char_list, current_index, target_letter):
    """Find next character starting with target letter."""
    for i in range(current_index + 1, len(char_list)):
        name = char_list[i][0]
        if name and name[0].upper() == target_letter:
            return i, i - current_index
    return None, 0


def character_remover(file_path, chapter_episode_limit):
    canon_list = data_fetcher.get_canon_characters(file_path, chapter_episode_limit)
    non_canon_list = data_fetcher.get_non_canon_characters(file_path, chapter_episode_limit)

    game = ReverseAkinator(API_KEY, config)

    print("\nCHARACTER REMOVER TOOL")
    print("-----------------------")
    print("(1) Canon character list")
    print("(2) Non-canon character list")

    while True:
        user_input = input("\nSelect list: ")

        if user_input == '1':
            list_to_filter = canon_list
            print("\nFiltering through Canon characters...")
            is_canon = True
            break
        elif user_input == '2':
            list_to_filter = non_canon_list
            print("\nFiltering through Non-canon characters...")
            is_canon = False
            break
        else:
            print("Invalid option. Please select 1 or 2.")

    print("\nCOMMANDS:")
    print("- Type 'r' or 'remove' [+ optional reason] to remove character")
    print("- Type 'y' or 'yes' to remove without reason")
    print("- Type 'q' or 'quit' to exit")
    print("- Type 's <letter>' to skip to the chosen letter")
    print("- Press any other key to skip to next character\n")

    count = 0
    character_index = 0
    total_characters = len(list_to_filter)

    while character_index < total_characters:
        character = list_to_filter[character_index]
        character_name = character[0]

        print(f"Character: {character_name} ({character_index + 1}/{total_characters})")
        print(f"Link: {data_fetcher.get_link(character_name)}")
        user_input = input("Remove? ")
        user_res = user_input.split(' ', 1)
        command = user_res[0].lower()

        if command in ['q', 'quit']:
            break

        if command in ['s', 'skip'] and len(user_res) > 1:
            target_letter = user_res[1].strip().upper()[0] if user_res[1].strip() else None

            if target_letter:
                next_index, skip_count = find_next_character_with_letter(list_to_filter, character_index, target_letter)

                if next_index:
                    print(
                        f"Skipping to next character starting with '{target_letter}' ({skip_count} characters skipped)")
                    character_index = next_index - 1  # Will be incremented at end of loop
                else:
                    print(f"No characters starting with '{target_letter}' found. Continuing with next character.")

        elif command in ['r', 'remove', 'y', 'yes']:
            count += 1
            reason = user_res[1] if len(user_res) > 1 else ""
            game.remove_character(character_name, "User", is_canon, reason)
            print(f"✓ Removed {character_name}\n")
        else:
            print(f"→ Skipped {character_name}\n")

        character_index += 1

    print(f"Operation complete. Removed {count} characters.")


if __name__ == '__main__':
    file_path = "table_remove.csv"
    chapter_episode_limit = [WANO_LAST_CH, WANO_LAST_EP]
    character_remover(file_path, chapter_episode_limit)
