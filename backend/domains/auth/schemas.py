"""
Auth domain schemas.
Pydantic models for authentication request and response payloads.
"""
from __future__ import annotations

from backend.core.schemas import ORMBaseModel, StrictBaseModel


class Token(StrictBaseModel):
    """Access token response."""

    access_token: str
    token_type: str
    must_change_password: bool = False
    is_superuser: bool = False


class TokenPairResponse(StrictBaseModel):
    """Access and refresh token response."""

    access_token: str
    refresh_token: str
    token_type: str
    must_change_password: bool = False
    is_superuser: bool = False


class RefreshTokenRequest(StrictBaseModel):
    """Refresh token request payload."""

    refresh_token: str
