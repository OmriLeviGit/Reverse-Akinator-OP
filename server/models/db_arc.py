from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from server.models.base import Base
from server.schemas.arc_schemas import Arc


class DBArc(Base):
    __tablename__ = 'arcs'

    name: Mapped[str] = mapped_column(String(100), primary_key=True)
    last_chapter: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_episode: Mapped[int | None] = mapped_column(Integer, nullable=True)

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