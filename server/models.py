from sqlalchemy import Column, String, Integer, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Character(Base):
    __tablename__ = 'characters'

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)
    wiki_link = Column(String(200), nullable=False)
    chapter = Column(Integer, nullable=True)
    episode = Column(Integer, nullable=True)
    number = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    year = Column(Integer, nullable=False)
    note = Column(String(200), nullable=True)
    appears_in = Column(String(50), nullable=True)

    difficulty = Column(String, nullable=True)
    is_ignored = Column(Boolean, default=False, nullable=False)

    def __repr__(self):
        return f"<Character(id='{self.id}', name='{self.name}', type='{self.type}')>"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'wiki_link': self.wiki_link,
            'chapter': self.chapter,
            'episode': self.episode,
            'number': self.number,
            'description': self.description,
            'year': self.year,
            'note': self.note,
            'appears_in': self.appears_in,
            'difficulty': self.difficulty,
            'isIgnored': self.is_ignored
        }


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