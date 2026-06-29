# Domain-Driven Architecture - Developer Guide

## Quick Reference

### Project Structure
```
backend/
├── core/                    # Shared infrastructure
│   ├── database.py         # SQLAlchemy Base, SessionLocal, engine
│   ├── schemas.py          # Pydantic base classes
│   ├── models.py           # Central model registry
│   └── __init__.py
├── domains/                 # Independent domains
│   ├── config/             # System configuration
│   ├── users/              # User accounts
│   ├── categories/         # Categories
│   ├── tasks/              # Task management
│   ├── events/             # Calendar events
│   ├── auth/               # Authentication
│   ├── shopping/           # Shopping lists
│   ├── audit/              # Activity logging
│   ├── notifications/      # Notifications
│   ├── planning/           # Daily planning
│   ├── countdowns/         # Countdowns
│   └── habits/             # Habits
├── api/                    # FastAPI routers (still compatible)
├── models.py               # Backward compatibility (re-exports)
├── schemas.py              # Backward compatibility (re-exports)
└── main.py                 # Application entry point
```

## For Developers

### Adding a New Model

1. **Create in domain directory:**
```python
# backend/domains/mytopic/models.py
from backend.core.database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship

class MyModel(Base):
    __tablename__ = "my_table"
    
    # Use string references for relationships
    owner: Mapped["User"] = relationship("User")
```

2. **Export from domain __init__.py:**
```python
# backend/domains/mytopic/__init__.py
from backend.domains.mytopic.models import MyModel

__all__ = ["MyModel"]
```

3. **Register in core models:**
```python
# backend/core/models.py
from backend.domains.mytopic.models import MyModel  # noqa
```

### Adding a New Schema

1. **Create in domain directory:**
```python
# backend/domains/mytopic/schemas.py
from backend.core.schemas import ORMBaseModel, StrictBaseModel

class MyModelResponse(ORMBaseModel):
    id: int
    name: str

class MyModelCreate(StrictBaseModel):
    name: str
```

2. **Export from domain __init__.py:**
```python
__all__ = ["MyModelCreate", "MyModelResponse"]
```

3. **Add to backward compatibility:**
```python
# backend/schemas.py
from backend.domains.mytopic.schemas import MyModelCreate, MyModelResponse
```

## Imports

### New Code (Recommended)
```python
# Import from specific domains
from backend.domains.users import User, UserResponse
from backend.domains.tasks import Task, TaskCreate
```

### Backward Compatible (Still Works)
```python
# Import from central modules
import models
import schemas

user = models.User(...)
response = schemas.UserResponse(...)
```

## Key Rules

### ✓ DO
- Use string references in relationships: `relationship("User")`
- Use TYPE_CHECKING for type hints only
- Keep each domain focused and independent
- Import Base from `backend.core.database`
- Import schema bases from `backend.core.schemas`

### ✗ DON'T
- Import models directly: `from backend.domains.users.models import User` (in relationships)
- Create circular imports between domains
- Mix concerns in a single file
- Duplicate Base or schema base classes

## Examples

### Task with User Relationship
```python
from typing import TYPE_CHECKING, List
from sqlalchemy.orm import Mapped, relationship

if TYPE_CHECKING:
    from backend.domains.users.models import User

class Task(Base):
    __tablename__ = "tasks"
    
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
    )
    
    # String reference - works without circular import
    user: Mapped["User"] = relationship("User", back_populates="tasks")
```

### Schema with Pydantic
```python
from backend.core.schemas import ORMBaseModel, StrictBaseModel

class UserCreate(StrictBaseModel):
    username: str
    email: str

class UserResponse(ORMBaseModel):
    id: int
    username: str
    email: str
```

## Testing

All domain modules can be tested independently:
```python
# test_users.py
from backend.domains.users import User, UserResponse

def test_user_creation():
    user = User(username="test", email="test@example.com", password_hash="...")
    assert user.username == "test"
```

## Troubleshooting

### Import Error
**Problem:** `ModuleNotFoundError: No module named 'backend.domains.x'`
**Solution:** Make sure domain directory exists with __init__.py

### Circular Import Error
**Problem:** `ImportError: cannot import name 'X'`
**Solution:** Use string references in relationships instead of direct imports

### Model Not Found
**Problem:** SQLAlchemy can't resolve string reference
**Solution:** Make sure model is imported in `backend/core/models.py`

## Documentation

See `REFACTORING_SUMMARY.md` for complete architecture details.
