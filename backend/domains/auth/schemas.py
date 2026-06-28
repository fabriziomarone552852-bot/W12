from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator

from ..users.schemas import StrictBaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
    must_change_password: bool = False
    is_superuser: bool = False


class UserCreate(StrictBaseModel):
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


__all__ = ["Token", "UserCreate"]
