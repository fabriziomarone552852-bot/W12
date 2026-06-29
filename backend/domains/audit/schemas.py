"""
Audit domain schemas.
Pydantic models for audit log serialization.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from backend.core.schemas import ORMBaseModel, StrictBaseModel


class SharedActivityLogResponse(ORMBaseModel):
    """Response model for shared activity logs."""

    id: int
    module_code_id: int
    entity_type_id: int
    action_type_id: int
    entity_id: str
    performed_by_user_id: int
    created_at: datetime
    payload_before: Optional[str] = None
    payload_after: Optional[str] = None
