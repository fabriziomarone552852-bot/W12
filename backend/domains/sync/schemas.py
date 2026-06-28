from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field

from ..categories.schemas import CategoryResponse
from ..countdowns.schemas import CountdownResponse
from ..events.schemas import EventResponse
from ..habits.schemas import HabitResponse
from ..planning.schemas import DailyEntryResponse
from ..shopping.schemas import ShoppingListResponse
from ..tasks.schemas import TaskResponse


class DaySyncResponse(BaseModel):
    data_riferimento: date
    obiettivo: Optional[DailyEntryResponse] = None
    priorita: List[DailyEntryResponse] = Field(default_factory=list)
    note: List[DailyEntryResponse] = Field(default_factory=list)
    tasks: List[TaskResponse] = Field(default_factory=list)
    events: List[EventResponse] = Field(default_factory=list)
    habits: List[HabitResponse] = Field(default_factory=list)
    categories: List[CategoryResponse] = Field(default_factory=list)
    shopping_lists: List[ShoppingListResponse] = Field(default_factory=list)
    countdowns: List[CountdownResponse] = Field(default_factory=list)


__all__ = ["DaySyncResponse"]
