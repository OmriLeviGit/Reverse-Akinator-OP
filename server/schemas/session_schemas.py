from pydantic import BaseModel, Field

from server.schemas.arc_schemas import Arc


class UpdateArcLimitRequest(BaseModel):
    arc_limit: str = Field(alias="arcLimit")

    class Config:
        populate_by_name = True


class SessionDataResponse(BaseModel):
    global_arc_limit: str = Field(alias="globalArcLimit")
    session_created: str = Field(alias="sessionCreated")
    last_activity: str = Field(alias="lastActivity")

    class Config:
        populate_by_name = True

class SessionResponse(BaseModel):
    message: str
    session_data: SessionDataResponse = Field(alias="sessionData")  # ← Changed from dict[str, Any]
    available_arcs: list[Arc] = Field(alias="availableArcs")

    class Config:
        populate_by_name = True


class UpdateArcLimitResponse(BaseModel):
    success: bool
    session_data: SessionDataResponse = Field(alias="sessionData")  # ← Changed from dict[str, Any]
    available_arcs: list[Arc] = Field(alias="availableArcs")

    class Config:
        populate_by_name = True