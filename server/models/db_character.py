from sqlalchemy import String, Integer, Boolean, Text, Enum, func, case
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.hybrid import hybrid_property
import enum

from server.models.base import Base
from server.schemas.character_schemas import Character


# Define the difficulty enum
class DifficultyEnum(enum.Enum):
    UNRATED = "unrated"
    VERY_EASY = "very easy"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    REALLY_HARD = "really hard"

class DBCharacter(Base):
    __tablename__ = 'characters'

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    filler_status: Mapped[str] = mapped_column(String(20))
    wiki_link: Mapped[str] = mapped_column(String(200))
    chapter: Mapped[int | None] = mapped_column(Integer)
    episode: Mapped[int | None] = mapped_column(Integer)
    number: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text)
    fun_fact: Mapped[str | None] = mapped_column(Text)
    year: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(String(200))
    appears_in: Mapped[str | None] = mapped_column(String(50))

    # Updated difficulty field with enum constraint and proper default
    difficulty: Mapped[str] = mapped_column(
        Enum(DifficultyEnum, values_callable=lambda obj: [e.value for e in obj]),
        default=DifficultyEnum.UNRATED.value,
        nullable=False
    )
    is_ignored: Mapped[bool] = mapped_column(Boolean, default=False)

    @hybrid_property
    def effective_episode(self):
        """Get the effective episode number (higher of episode or number) - Python version"""
        if self.episode is None and self.number is None:
            return None
        if self.episode is None:
            return self.number
        if self.number is None:
            return self.episode
        return max(self.episode, self.number)

    @effective_episode.expression
    def effective_episode(cls):
        """SQL expression for effective episode - Using func.max"""
        return case(
            # Both null
            ((cls.episode.is_(None)) & (cls.number.is_(None)), None),
            # Episode is null, use number
            (cls.episode.is_(None), cls.number),
            # Number is null, use episode
            (cls.number.is_(None), cls.episode),
            # Both exist - use MAX function
            else_=func.max(cls.episode, cls.number)
        )

    def __repr__(self):
        return f"<Character(id='{self.id}', name='{self.name}', type='{self.filler_status}')>"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.filler_status,
            'wiki_link': self.wiki_link,
            'chapter': self.chapter,
            'episode': self.episode,
            'number': self.number,
            'description': self.description,
            'year': self.year,
            'note': self.note,
            'appears_in': self.appears_in,
            'difficulty': self.difficulty,
            'is_ignored': self.is_ignored
        }

    def to_pydantic(self) -> Character:  # Character is your Pydantic model
        """Convert SQLAlchemy model to Pydantic model"""
        return Character(
            id=self.id,
            name=self.name,
            description=self.description,
            chapter=self.chapter,
            episode=self.effective_episode,  # Changed from get_character_episode() to effective_episode
            fillerStatus=self.filler_status,
            difficulty=self.difficulty,  # No need for `or ""` since it has a proper default now
            isIgnored=self.is_ignored,
            wikiLink=self.wiki_link
        )

    def get_character_episode(self) -> int | None:
        """Get the effective episode number - now just delegates to effective_episode property"""
        return self.effective_episode
