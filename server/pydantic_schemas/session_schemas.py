from pydantic import BaseModel, Field
from typing import Any

from server.pydantic_schemas.arc_schemas import Arc


class UpdateArcLimitRequest(BaseModel):
    arc_limit: str = Field(alias="arcLimit")

    class Config:
        populate_by_name = True


class SessionResponse(BaseModel):
    message: str
    session_status: str = Field(alias="sessionStatus")
    session_data: dict[str, Any] = Field(alias="sessionData")
    available_arcs: list[Arc] = Field(alias="availableArcs")

    class Config:
        populate_by_name = True


class UpdateArcLimitResponse(BaseModel):
    success: bool
    session_data: dict[str, Any] = Field(alias="sessionData")
    available_arcs: list[Arc] = Field(alias="availableArcs")

    class Config:
        populate_by_name = True