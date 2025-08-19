from sqlalchemy import Column, String, Integer, Boolean, Text, func, case
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.hybrid import hybrid_property

from server.pydantic_schemas.character_schemas import Character
from server.pydantic_schemas.arc_schemas import Arc

Base = declarative_base()

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
    year: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(String(200))
    appears_in: Mapped[str | None] = mapped_column(String(50))

    difficulty: Mapped[str] = mapped_column(String, default="")
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
            filler_status=self.filler_status,
            difficulty=self.difficulty or "",
            isIgnored=self.is_ignored,
            wikiLink=self.wiki_link
        )

    def get_character_episode(self) -> int | None:
        """Get the effective episode number - now just delegates to effective_episode property"""
        return self.effective_episode

class DBArc(Base):
    __tablename__ = 'arcs'

    name = Column(String(100), primary_key=True)
    last_chapter = Column(Integer, nullable=True)
    last_episode = Column(Integer, nullable=True)

    def __repr__(self):
        return f"<Arc(name='{self.name}', last_chapter={self.last_chapter}, last_episode={self.last_episode})>"

    def to_dict(self):
        return {
            'name': self.name,
            'last_chapter': self.last_chapter,
            'last_episode': self.last_episode
        }

    def to_pydantic(self) -> Arc:
        """Convert SQLAlchemy model to Pydantic model"""
        return Arc(
            name=self.name,
            chapter=self.last_chapter,
            episode=self.last_episode
        )

    @staticmethod
    def get_earlier_arc(arc1: 'DBArc', arc2: 'DBArc') -> 'DBArc':
        """
        Compare two arcs and return the earlier one
        """
        # If either arc is "All", return the other one
        if arc1.name == "All":
            return arc2
        elif arc2.name == "All":
            return arc1

        # If arc1 has no chapter, return arc2
        if arc1.last_chapter is None:
            return arc2

        # If arc2 has no chapter, return arc1
        if arc2.last_chapter is None:
            return arc1

        # Compare chapters and return the earlier one
        if arc1.last_chapter < arc2.last_chapter:
            return arc1

        return arc2