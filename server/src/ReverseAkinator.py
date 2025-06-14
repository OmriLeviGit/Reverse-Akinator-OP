import csv
import os
import random
import json
import google.generativeai as genai

import data_fetcher


class ReverseAkinator:
    CANNON = "canon"
    FILLER = "filler"
    BOTH = "both"

    def __init__(self, api_key, config, seed=41):
        self.remove_file_path = "table_remove.csv"

        genai.configure(api_key=api_key)
        self.arc_chapter_mapping = config['arc_to_chapter']
        self.schema = config['scheme']
        self.instructions = config['instruction_prompt']

        if seed:
            random.seed(seed)

    def generate_response(self, user_input, conversation, summary=False):
        conversation.append({"role": "user", "content": user_input})
        full_prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation])
        model = genai.GenerativeModel("gemini-2.0-flash-exp")

        if summary:
            response = model.generate_content(full_prompt)
            return response.candidates[0].content.parts[0].text

        generation_config = {
            "response_mime_type": "application/json",
            "response_schema": self.schema
        }

        response = model.generate_content(
            full_prompt,
            generation_config=generation_config
        )

        response_dict = json.loads(response.candidates[0].content.parts[0].text)
        response = response_dict["response"]

        if response == "hint" and "hint" in response_dict:
            response = response_dict['hint']

        conversation.append({"role": "system", "content": response})

        return response_dict

    def play_round(self, prompt, character_name, additional_data):
        print("\nAsk yes/no questions to guess the character")
        conversation = [{"role": "system", "content": prompt}]
        summary = self.get_character_summary(character_name, additional_data)

        while True:
            user_input = input("\nYou: ").strip().lower()

            response_dict = self.generate_response(user_input, conversation)
            response = response_dict["response"]

            match response:
                case "correct":
                    print(f"\nCongratulations! The character was {character_name}")
                    break

                case "incorrect":
                    print("Bzzt. Wrong guess loser .i. keep trying")
                    continue

                case "hint":
                    print(f"HINT: {response_dict['hint']}")

                case "forfeit":
                    forfeit = input("Do you wish to forfeit?\n").strip().lower()
                    to_forfeit = forfeit in ["y", "yes"]

                    if not to_forfeit:
                        print("You can continue asking questions")
                        continue

                    print(f"\nThe character was {character_name}")
                    break

                case _:
                    print(f"Response: {response}")

        print(f"\nHere is some information about the character: \n{summary}")
        print(f"Link to the wiki: {data_fetcher.get_link(character_name)}")

    def select_random_character(self, character_type, canon_list, non_canon_list, include_non_tv_fillers,
                                canon_filler_ratio):
        if character_type == self.CANNON or \
                (character_type == self.BOTH and canon_filler_ratio < random.random()):
            chosen = random.choice(canon_list)
            canon_list.remove(chosen)

            char_name, first_ch, first_ep = chosen

            first_appearance = None
            for arc_name, ending_ch in self.arc_chapter_mapping:
                if first_ch <= ending_ch:
                    first_appearance = arc_name
                    break

            return char_name, True, [first_ch, first_ep, first_appearance]

        chosen = random.choice(non_canon_list)
        if not include_non_tv_fillers:
            while chosen[1].lower() != "filler" or chosen[2] == -1:
                non_canon_list.remove(chosen)
                chosen = random.choice(non_canon_list)

        non_canon_list.remove(chosen)

        char_name, source, first_ep, first_appearance = chosen

        return char_name, False, [source, first_ep, first_appearance]

    def run_game(self, character_type=None, chapter_episode_limit=None,
                 include_non_tv_fillers=False, canon_filler_ratio=0.5, debug=False):

        if character_type is None:
            character_type = self.CANNON

        canon_list = data_fetcher.get_canon_characters(self.remove_file_path, chapter_episode_limit)
        non_canon_list = data_fetcher.get_non_canon_characters(self.remove_file_path, chapter_episode_limit)

        self.print_game_mode(character_type, include_non_tv_fillers, canon_filler_ratio)

        while True:
            selected_char = self.select_random_character(
                character_type, canon_list, non_canon_list, include_non_tv_fillers, canon_filler_ratio)

            character_name, is_canon, first_appearance = selected_char

            additional_data = data_fetcher.extract_data_from_wiki(character_name)

            if additional_data == -1:
                self.remove_character(character_name, "System", is_canon, "Wiki page was not found")
                continue

            prompt = self.get_prompt(character_name, is_canon, first_appearance, additional_data)

            if debug:
                print(f"The character is: {character_name}")

            self.play_round(prompt, character_name, additional_data)

            play_again = input("\nPlay again? (yes / remove <optional reason> / quit): \n").strip().lower()

            if play_again in ["y", "yes"]:
                continue

            user_res = play_again.split(' ', 1)

            if user_res[0] == 'r' or user_res[0] == 'remove':
                reason = user_res[1] if len(user_res) > 1 else ""
                self.remove_character(character_name, "User", is_canon, reason)
                print(f"Removed {character_name} successfully")
                continue
            else:
                break

        print("Thanks for playing!")

    def format_appearance_info(self, is_canon, first_appearance):
        first_source, first_ep, appeared_in = first_appearance

        if is_canon:
            return f"First appeared in: {appeared_in}; Chapter: {first_source}; Episode: {first_ep}"

        appearance_parts = [
            f"Source: {first_source};",
            f"First appeared in: {appeared_in};"
        ]

        if first_source.lower() == "filler" and first_ep != -1:
            appearance_parts.append(f"Episode: {first_ep}")

        return " ".join(appearance_parts)

    def remove_character(self, character_name, role, is_canon, reason, debug=False):
        # File doesn't exist, create it
        if not os.path.exists(self.remove_file_path):
            with open(self.remove_file_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)

                # Role = system \ user; Type = canon \ filler;
                writer.writerow(['Character name', 'Role', 'Type', 'Reason', 'Wiki link'])

            if debug:
                print(f"Created new CSV file at {self.remove_file_path}")
        else:
            if debug:
                print(f"CSV file already exists at {self.remove_file_path}")

        char_type = "Canon" if is_canon else "Filler"

        new_row = [character_name, role, char_type, reason, data_fetcher.get_link(character_name)]

        with open(self.remove_file_path, 'a', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(new_row)

    def get_prompt(self, character_name, is_canon, first_appearance, additional_data, debug=False):

        appearance_info = self.format_appearance_info(is_canon, first_appearance)
        fruit_data = data_fetcher.get_devil_fruit(character_name, debug=debug) or "No devil fruit"
        statistics = data_fetcher.get_main_info(character_name)

        character_prompt = f"""
<character_profile>
## SECRET CHARACTER: {character_name}

### CORE INFORMATION
- APPEARANCE INFO: {appearance_info}
- DEVIL FRUIT: {fruit_data}
- KEY ATTRIBUTES: {statistics}

### DETAILED BACKGROUND
------------------------
{additional_data}
------------------------
</character_profile>

Remember to follow the game instructions exactly. Wait for the user's first question before responding.
"""
        return self.instructions + character_prompt

    def get_character_summary(self, character_name, additional_data):
        summary_prompt = f"""
<summary_request>
Create a concise summary for the One Piece character: {character_name}.

REQUIREMENTS:
- Maximum 4 sentences total
- Place each sentence on its own line (add newline character after each)
- Include only factual information from the wiki (no speculation or fluff)
- EXCLUDE any events from "Egghead" arc and beyond
- Focus on key character traits, role, and significant background

REFERENCE INFORMATION:
------------------------
{additional_data}
------------------------
</summary_request>
"""
        return self.generate_response(summary_prompt, [], True)

    def print_game_mode(self, character_type, include_non_tv_fillers, canon_filler_ratio):
        if character_type == self.CANNON:
            base_mode = "'Canon-only' mode"
        elif character_type == self.FILLER:
            base_mode = "'Filler-only' mode"
        elif character_type == self.BOTH:
            base_mode = f"'Canon & Filler' mode with {canon_filler_ratio} filler ratio"
        else:
            base_mode = "Unknown mode"

        print(f"\n *** Playing in {base_mode} *** ")

        if character_type == self.FILLER or character_type == self.BOTH:
            if include_non_tv_fillers:
                filler_source = "All filler characters (TV series, movies, games, etc.)"
            else:
                filler_source = "TV series filler characters only"

            print(f" *** Filler source: {filler_source} *** ")
