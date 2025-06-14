from ReverseAkinator import ReverseAkinator
from server.env import API_KEY

WANO_LAST_CH = 1057
WANO_LAST_EP = 1085

config = {
    "scheme": {
        "type": "object",
        "properties": {
            "response": {
                "type": "string",
                "enum": ["yes", "no", "I don't know", "hint", "correct", "incorrect", "forfeit"]
            },
            "hint": {
                "type": "string"
            }
        },
        "required": ["response"]
    },

    "arc_to_chapter": [
        ["East Blue", 7],
        ["Orange Town", 21],
        ["Syrup Village", 41],
        ["Baratie", 68],
        ["Arlong Park", 95],
        ["Loguetown", 100],
        ["Arabasta", 105],
        ["Whisky Peak", 114],
        ["Little Garden", 129],
        ["Drum Island", 154],
        ["Arabasta", 217],
        ["Jaya", 236],
        ["Skypiea", 302],
        ["Water 7", 321],
        ["Enies Lobby", 430],
        ["Post-Enies Lobby", 441],
        ["Thriller Bark", 489],
        ["Sabaody Archipelago", 513],
        ["Amazon Lily", 524],
        ["Impel Down", 549],
        ["Marineford", 580],
        ["Post-War", 597],
        ["Return to Sabaody", 602],
        ["Fish-Man Island", 653],
        ["Punk Hazard", 699],
        ["Dressrosa", 801],
        ["Zou", 824],
        ["Whole Cake Island", 902],
        ["Levely", 908],
        ["Wano Country", 1057],
        ["Egghead", 1125]
    ],
    "instruction_prompt": f"""
<game_instructions>
# ONE PIECE REVERSE AKINATOR GAME

## CORE RULES
You are playing a reverse Akinator game in the world of the anime One Piece. You have a secret character in mind, and the user will try to guess who it is by asking yes/no questions.

## CRITICAL: HANDLING GUESSES
- ANY question that names a specific character (like "Is it Luffy?" or "Is the character Zoro?") is a GUESS
- ALL guesses MUST be answered ONLY with "correct" or "incorrect" - never "yes" or "no"
- Guesses may not end with a question mark
- Examples of guesses:
  * "Is it Nami?" → Answer "correct" or "incorrect"
  * "Is the character Robin?" → Answer "correct" or "incorrect"
  * "Are you thinking of Lola?" → Answer "correct" or "incorrect"

## RESPONSE FORMAT - USE ONLY THESE EXACT RESPONSES:
- "yes" - for affirmative answers to yes/no questions about the character
- "no" - for negative answers to yes/no questions about the character
- "I don't know" - when uncertain or for non-One Piece related questions
- "hint" - ONLY when the user explicitly requests a hint by using the word "hint"
- "correct" - when the user correctly identifies your character
- "incorrect" - when the user incorrectly guesses your character
- "forfeit" - when the user gives up or directly asks for the character's identity

## TECHNICAL GUIDELINES
- Treat most messages as questions, even without question marks
- For character guesses, respond ONLY with "correct" or "incorrect"
- Accept sufficiently accurate descriptions of the character as correct
- The "hint" response is ONLY triggered when the user explicitly uses the word "hint"
- Keep hints subtle and vague
- Respond with "forfeit" when the user directly asks for the character's identity (such as "who is it") or gives up

## STORY RULES
- NEVER include information about events from "Egghead" arc and beyond
- Pre-timeskip characters first appeared in chapter 597 or earlier, or episode 516 or earlier
- Without context, "the crew" refers to the Straw Hat Pirates
- Without context, "good/bad" questions refer to alignment relative to the Straw Hats

## FAMILY RELATIONSHIP RULES
- "Family" refers ONLY to confirmed biological relatives (blood relations)
- A character has family if any known blood relatives exist in the series
- Being in the same crew does NOT count as family
- The "D." lineage does NOT count as family
- When determining family names, ignore the "D." component:
  * "Monkey" is the family name for Monkey D. Luffy, Monkey D. Dragon, and Monkey D. Garp
  * "Trafalgar" is the family name for Trafalgar D. Water Law
  * "Marshall" is the family name for Marshall D. Teach (Blackbeard)

- Answer "no" for:
  * Figurative "families" (like Whitebeard calling his crew "sons")
  * Adoptive or sworn relationships (like sworn brothers)
  * Organizations using family terminology (like "Family" in criminal groups)
  * Rumored or unconfirmed family connections

EXAMPLE: Black beard (Marshal Teach) is from the "D" lineage, is part of the whitebeard crew, and considers "White beard" his father, but we have no knowledge of a direct blood relation → Answer "no"
EXAMPLE: Big Mom (Charlotte Linlin) has biological children including Charlotte Lola → Answer "yes"

</game_instructions>
"""
}


DEFAULT_SETTINGS = {
    "character_type": ReverseAkinator.CANNON,
    "chapter_episode_limit": [WANO_LAST_CH, WANO_LAST_EP],  # [wano last ch, wano last ep]
    "include_non_tv": False,
    "canon_filler_ratio": 0.1
}


def main():
    """
    Input to the run_game function:

    chapter_episode_limit - Sets how far in the story the characters can be from.
        Characters introduced after these chapter/episode numbers won't appear in the game.

    character_type - Chooses what kind of characters can appear:
      * 3 Options: ReverseAkinator.CANNON, ReverseAkinator.FILLER, ReverseAkinator.BOTH.

    These following settings have no effect when playing with only canon characters.

    When playing with non-main story characters (FILLER or BOTH):
      * include_non_tv:
        - True: Can include characters from movies, games, etc.
        - False: Only includes extra characters from the TV show

      * canon_filler_ratio - Controls how often you'll get a non-main story character
        - 0.1 means there is a 10% chance of characters being a filler
    """

    game = ReverseAkinator(API_KEY, config)

    game_settings = {
        "character_type": ReverseAkinator.CANNON,
        "chapter_episode_limit": [WANO_LAST_CH, WANO_LAST_EP],  # [wano last ch, wano last ep]
        "include_non_tv_fillers": False,
        "canon_filler_ratio": 0.1
    }

    # game_settings = DEFAULT_SETTINGS  # Uncomment to use the default settings

    game.run_game(**game_settings, debug=True)


if __name__ == '__main__':
    main()
