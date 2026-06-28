# backend/services/audit_log.py
from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Optional

from sqlalchemy.orm import Session

import models


class AuditModule(str, Enum):
    SHOPPING = "shopping"
    TASKS = "tasks"
    EVENTS = "events"
    COUNTDOWNS = "countdowns"
    HABITS = "habits"
    DAILY = "daily"
    SHARING = "sharing"
    SYSTEM = "system"


class AuditEntityType(str, Enum):
    SHOPPING_GROUP = "shopping_group"
    SHOPPING_GROUP_MEMBER = "shopping_group_member"
    SHOPPING_LIST = "shopping_list"
    SHOPPING_LIST_ITEM = "shopping_list_item"
    SHOPPING_PRICE = "shopping_price"
    SHOPPING_SUPPLIER = "shopping_supplier"
    TASK = "task"
    EVENT = "event"
    COUNTDOWN = "countdown"
    HABIT = "habit"
    HABIT_PERIOD = "habit_period"
    HABIT_LOG = "habit_log"
    DAILY_ENTRY = "daily_entry"
    CATEGORY = "category"
    USER = "user"
    CONFIG = "config"


class AuditActionType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    RESTORE = "restore"
    ARCHIVE = "archive"
    CLOSE = "close"
    REOPEN = "reopen"
    COMPLETE = "complete"
    UNCOMPLETE = "uncomplete"
    ADD_MEMBER = "add_member"
    REMOVE_MEMBER = "remove_member"
    UPDATE_ROLE = "update_role"
    SHARE = "share"
    UNSHARE = "unshare"
    LOGIN = "login"
    LOGOUT = "logout"


SENSITIVE_FIELD_NAMES = {
    "password",
    "hashed_password",
    "access_token",
    "refresh_token",
    "token",
    "secret",
    "otp",
    "email_verification_token",
    "reset_password_token",
}


def _json_safe(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, set):
        return sorted(_json_safe(item) for item in value)
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        output = {}
        for key, item in value.items():
            key_str = str(key)
            if key_str.lower() in SENSITIVE_FIELD_NAMES:
                continue
            output[key_str] = _json_safe(item)
        return output
    return value


def sanitize_payload(payload: Optional[dict[str, Any]]) -> Optional[str]:
    if not payload:
        return None
    safe_payload = _json_safe(payload)
    return json.dumps(safe_payload, ensure_ascii=False, separators=(",", ":"))


def model_to_audit_dict(
    obj: Any,
    *,
    include: Optional[set[str]] = None,
    exclude: Optional[set[str]] = None,
) -> dict[str, Any]:
    if obj is None:
        return {}

    include = include or set()
    exclude = (exclude or set()) | SENSITIVE_FIELD_NAMES

    data: dict[str, Any] = {}

    table = getattr(obj, "__table__", None)
    if table is not None:
        for column in table.columns:
            field_name = column.name
            if include and field_name not in include:
                continue
            if field_name in exclude:
                continue
            data[field_name] = getattr(obj, field_name)
        return data

    if isinstance(obj, dict):
        for key, value in obj.items():
            key_str = str(key)
            if include and key_str not in include:
                continue
            if key_str in exclude:
                continue
            data[key_str] = value
        return data

    for attr_name, value in vars(obj).items():
        if attr_name.startswith("_"):
            continue
        if include and attr_name not in include:
            continue
        if attr_name in exclude:
            continue
        data[attr_name] = value

    return data


def resolve_config_code_id(
    db: Session,
    *,
    code_type: str,
    code_value: str,
) -> int:
    code_id = (
        db.query(models.ConfigCode.id)
        .filter(
            models.ConfigCode.code_type == code_type,
            models.ConfigCode.code_value == code_value,
            models.ConfigCode.active.is_(True),
        )
        .scalar()
    )
    if code_id is None:
        raise ValueError(f"ConfigCode non trovato per {code_type}:{code_value}")
    return code_id


def create_shared_activity_log(
    db: Session,
    *,
    module_code_id: int,
    entity_type_id: int,
    action_type_id: int,
    entity_id: str,
    performed_by_user_id: int,
    payload_before: Optional[dict[str, Any]] = None,
    payload_after: Optional[dict[str, Any]] = None,
) -> models.SharedActivityLog:
    log_entry = models.SharedActivityLog(
        module_code_id=module_code_id,
        entity_type_id=entity_type_id,
        action_type_id=action_type_id,
        entity_id=entity_id,
        performed_by_user_id=performed_by_user_id,
        payload_before=sanitize_payload(payload_before),
        payload_after=sanitize_payload(payload_after),
    )
    db.add(log_entry)
    return log_entry


def log_shared_activity(
    db: Session,
    *,
    module: AuditModule,
    entity_type: AuditEntityType,
    action_type: AuditActionType,
    entity_id: int | str,
    performed_by_user_id: int,
    payload_before: Optional[dict[str, Any]] = None,
    payload_after: Optional[dict[str, Any]] = None,
) -> models.SharedActivityLog:
    module_code_id = resolve_config_code_id(
        db,
        code_type="shared_activity_module",
        code_value=module.value,
    )
    entity_type_id = resolve_config_code_id(
        db,
        code_type="shared_activity_entity_type",
        code_value=entity_type.value,
    )
    action_type_id = resolve_config_code_id(
        db,
        code_type="shared_activity_action_type",
        code_value=action_type.value,
    )

    return create_shared_activity_log(
        db,
        module_code_id=module_code_id,
        entity_type_id=entity_type_id,
        action_type_id=action_type_id,
        entity_id=str(entity_id),
        performed_by_user_id=performed_by_user_id,
        payload_before=payload_before,
        payload_after=payload_after,
    )


def log_model_create(
    db: Session,
    *,
    module: AuditModule,
    entity_type: AuditEntityType,
    entity: Any,
    performed_by_user_id: int,
    include_fields: Optional[set[str]] = None,
    exclude_fields: Optional[set[str]] = None,
) -> models.SharedActivityLog:
    entity_data = model_to_audit_dict(
        entity,
        include=include_fields,
        exclude=exclude_fields,
    )
    entity_id = entity_data.get("id", getattr(entity, "id", None))
    return log_shared_activity(
        db,
        module=module,
        entity_type=entity_type,
        action_type=AuditActionType.CREATE,
        entity_id=entity_id,
        performed_by_user_id=performed_by_user_id,
        payload_after=entity_data,
    )


def log_model_update(
    db: Session,
    *,
    module: AuditModule,
    entity_type: AuditEntityType,
    entity_before: Any,
    entity_after: Any,
    performed_by_user_id: int,
    include_fields: Optional[set[str]] = None,
    exclude_fields: Optional[set[str]] = None,
) -> models.SharedActivityLog:
    before_data = model_to_audit_dict(
        entity_before,
        include=include_fields,
        exclude=exclude_fields,
    )
    after_data = model_to_audit_dict(
        entity_after,
        include=include_fields,
        exclude=exclude_fields,
    )
    entity_id = after_data.get("id", getattr(entity_after, "id", None))
    return log_shared_activity(
        db,
        module=module,
        entity_type=entity_type,
        action_type=AuditActionType.UPDATE,
        entity_id=entity_id,
        performed_by_user_id=performed_by_user_id,
        payload_before=before_data,
        payload_after=after_data,
    )


def log_model_delete(
    db: Session,
    *,
    module: AuditModule,
    entity_type: AuditEntityType,
    entity_before: Any,
    performed_by_user_id: int,
    include_fields: Optional[set[str]] = None,
    exclude_fields: Optional[set[str]] = None,
) -> models.SharedActivityLog:
    before_data = model_to_audit_dict(
        entity_before,
        include=include_fields,
        exclude=exclude_fields,
    )
    entity_id = before_data.get("id", getattr(entity_before, "id", None))
    return log_shared_activity(
        db,
        module=module,
        entity_type=entity_type,
        action_type=AuditActionType.DELETE,
        entity_id=entity_id,
        performed_by_user_id=performed_by_user_id,
        payload_before=before_data,
    )


def log_model_action(
    db: Session,
    *,
    module: AuditModule,
    entity_type: AuditEntityType,
    action_type: AuditActionType,
    entity: Any,
    performed_by_user_id: int,
    payload_before: Optional[dict[str, Any]] = None,
    payload_after: Optional[dict[str, Any]] = None,
    include_fields: Optional[set[str]] = None,
    exclude_fields: Optional[set[str]] = None,
) -> models.SharedActivityLog:
    entity_data = model_to_audit_dict(
        entity,
        include=include_fields,
        exclude=exclude_fields,
    )
    entity_id = entity_data.get("id", getattr(entity, "id", None))

    merged_before = payload_before or None
    merged_after = payload_after or entity_data or None

    return log_shared_activity(
        db,
        module=module,
        entity_type=entity_type,
        action_type=action_type,
        entity_id=entity_id,
        performed_by_user_id=performed_by_user_id,
        payload_before=merged_before,
        payload_after=merged_after,
    )