from schemas.character_schemas import Character

mock_characters = [
    Character(
        id="char_001",
        name="Monkey D. Luffy",
        description="The main protagonist and captain of the Straw Hat Pirates",
        image=None,
        arc="East Blue",
        chapter=1,
        episode=1,
        fillerStatus="canon",
        source="manga",
        difficulty=2,
        isIgnored=False,
        wikiLink="https://onepiece.fandom.com/wiki/Monkey_D._Luffy"
    ),
    Character(
        id="char_004",
        name="Condoriano",
        description="A mysterious inspector from the G-8 arc",
        image=None,
        arc="G-8",
        chapter=None,
        episode=196,
        fillerStatus="filler",
        source="anime",
        difficulty=1,
        isIgnored=True,
        wikiLink="https://onepiece.fandom.com/wiki/Condoriano"
    ),
    Character(
        id="char_005",
        name="Shiki",
        description="The Golden Lion, captain of the Flying Pirates",
        image=None,
        arc="Strong World",
        chapter=None,
        episode=None,
        fillerStatus="canon",
        source="movie",
        difficulty=3,
        isIgnored=False,
        wikiLink="https://onepiece.fandom.com/wiki/Shiki"
    ),
]