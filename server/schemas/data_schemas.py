from pydantic import BaseModel

class DataResponse(BaseModel):
   arc_names: list[str]
   last_arc_chapter: list[int]
