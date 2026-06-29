"""
Users domain schemas.
Pydantic models for API request/response validation.
"""
from __future__ import annotations

from typing import Optional

from pydantic import EmailStr, Field, field_validator

from backend.core.schemas import ORMBaseModel, StrictBaseModel


class UserCreate(StrictBaseModel):
    """Request model for user registration."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=255)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        value = value.strip()
        return value.lower()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class UserResponse(ORMBaseModel):
    """Response model for user data."""
    id: int
    username: str
    email: EmailStr
    max_subtask_depth_user: Optional[int] = 3
    is_superuser: bool = False
    must_change_password: bool = False


class UserPublicResponse(ORMBaseModel):
    """Public response model with limited user info."""
    id: int
    username: str


class UserSettingsResponse(ORMBaseModel):
    """Response model for user settings."""
    id: int
    username: str
    email: EmailStr
    max_subtask_depth_user: Optional[int] = 3
    is_superuser: bool = False
    must_change_password: bool = False


class UserSettingsUpdate(StrictBaseModel):
    """Request model for updating user settings."""
    email: Optional[EmailStr] = None
    current_password: Optional[str] = Field(None, min_length=6, max_length=255)
    new_password: Optional[str] = Field(None, min_length=6, max_length=255)
    confirm_new_password: Optional[str] = Field(None, min_length=6, max_length=255)
    max_subtask_depth_user: Optional[int] = Field(None, ge=1, le=15)

    def validate_password_change(self) -> "UserSettingsUpdate":
        provided = [self.current_password, self.new_password, self.confirm_new_password]
        if any(value is not None for value in provided):
            if not all(value is not None for value in provided):
                raise ValueError(
                    "Per cambiare password devi fornire current_password, new_password e confirm_new_password."
                )
            if self.new_password != self.confirm_new_password:
                raise ValueError("new_password e confirm_new_password non coincidono.")
        return self

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[EmailStr]) -> Optional[str]:
        if value is None:
            return value
        return str(value).strip().lower()
