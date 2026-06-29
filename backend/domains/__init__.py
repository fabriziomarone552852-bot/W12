"""
Domains package - Domain-driven architecture with independent modules.

Each domain is an independent module with its own models and schemas:
- config: System configuration and code values
- users: User accounts and authentication
- categories: Task and event categories
- tasks: Task management with priorities
- events: Calendar events
- auth: Authentication schemas
- shopping: Collaborative shopping
- audit: Activity logging
- notifications: User notifications
- planning: Daily planning and entries
- countdowns: Countdown timers
- habits: Habit tracking

Domain imports:
    from backend.domains.users import User, UserResponse
    from backend.domains.tasks import Task, TaskCreate
    from backend.domains.config import Config, ConfigCode
    
For backward compatibility, all models and schemas are also available at:
    from backend import models
    from backend import schemas
"""
