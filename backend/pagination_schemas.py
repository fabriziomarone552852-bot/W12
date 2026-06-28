from typing import Generic, List, TypeVar

from pydantic import BaseModel

from schemas import TaskResponse, EventResponse

T = TypeVar("T")


class PaginatedBase(BaseModel, Generic[T]):
    items: List[T]
    total: int
    limit: int
    offset: int


class PaginatedTasks(PaginatedBase[TaskResponse]):
    """Pagina di TaskResponse."""
    pass


class PaginatedEvents(PaginatedBase[EventResponse]):
    """Pagina di EventResponse."""
    pass