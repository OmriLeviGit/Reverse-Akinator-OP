from pydantic import BaseModel


class Arc(BaseModel):
   name: str
   chapter: int
   episode: int

class DataResponse(BaseModel):
   arcList: list[Arc]