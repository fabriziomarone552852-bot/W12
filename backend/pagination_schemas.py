from typing import Generic, List, TypeVar

from pydantic import BaseModel, ConfigDict, Field

from backend.domains.events.schemas import EventResponse
from backend.domains.tasks.schemas import TaskResponse

T = TypeVar("T")


class PaginatedBase(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    items: List[T] = Field(default_factory=list)
    total: int = Field(..., ge=0)
    limit: int = Field(..., ge=1)
    offset: int = Field(..., ge=0)


class PaginatedTasks(PaginatedBase[TaskResponse]):
    """Pagina di TaskResponse."""


class PaginatedEvents(PaginatedBase[EventResponse]):
    """Pagina di EventResponse."""
