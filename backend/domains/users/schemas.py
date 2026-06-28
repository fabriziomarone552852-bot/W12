from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class ORMBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class StrictBaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ORMStrictBaseModel(ORMBaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class UserResponse(ORMBaseModel):
    id: int
    username: str
    email: EmailStr
    max_subtask_depth_user: Optional[int] = 3
    is_superuser: bool = False
    must_change_password: bool = False


class UserPublicResponse(ORMBaseModel):
    id: int
    username: str


class UserSettingsResponse(ORMBaseModel):
    id: int
    username: str
    email: EmailStr
    max_subtask_depth_user: Optional[int] = 3
    is_superuser: bool = False
    must_change_password: bool = False


class UserSettingsUpdate(StrictBaseModel):
    email: Optional[EmailStr] = None
    current_password: Optional[str] = Field(None, min_length=6, max_length=255)
    new_password: Optional[str] = Field(None, min_length=6, max_length=255)
    confirm_new_password: Optional[str] = Field(None, min_length=6, max_length=255)
    max_subtask_depth_user: Optional[int] = Field(None, ge=1, le=15)

    @model_validator(mode="after")
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


__all__ = [
    "ORMBaseModel",
    "StrictBaseModel",
    "ORMStrictBaseModel",
    "UserResponse",
    "UserPublicResponse",
    "UserSettingsResponse",
    "UserSettingsUpdate",
]
