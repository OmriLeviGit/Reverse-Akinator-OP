from pydantic import BaseModel


class Arc(BaseModel):
   name: str
   chapter: int | None = None
   episode: int | None = None
