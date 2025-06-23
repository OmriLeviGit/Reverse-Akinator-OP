from sqlalchemy import Column, String, Integer, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, mapped_column


from server.schemas.character_schemas import Character

Base = declarative_base()



class DBCharacter(Base):
    __tablename__ = 'characters'

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    fillerStatus: Mapped[str] = mapped_column(String(20))
    wiki_link: Mapped[str] = mapped_column(String(200))
    chapter: Mapped[int | None] = mapped_column(Integer)
    episode: Mapped[int | None] = mapped_column(Integer)
    number: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text)
    year: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(String(200))
    appears_in: Mapped[str | None] = mapped_column(String(50))

    difficulty: Mapped[str | None] = mapped_column(String)
    is_ignored: Mapped[bool] = mapped_column(Boolean, default=False)

    def __repr__(self):
        return f"<Character(id='{self.id}', name='{self.name}', type='{self.fillerStatus}')>"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.fillerStatus,
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
            episode=self.get_character_episode(),
            fillerStatus=self.fillerStatus,
            difficulty=self.difficulty,
            isIgnored=self.is_ignored,
            wikiLink=self.wiki_link
        )

    def get_character_episode(self) -> int | None:
        """Get the effective episode number (higher of episode or number)"""
        if self.episode is None and self.number is None:
            return None
        if self.episode is None:
            return self.number
        if self.number is None:
            return self.episode

        return max(self.episode, self.number)


class Arc(Base):
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

    @staticmethod
    def get_earlier_arc(arc1: 'Arc', arc2: 'Arc') -> 'Arc':
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