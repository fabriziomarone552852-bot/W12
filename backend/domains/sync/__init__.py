"""
Sync domain - Cross-domain daily sync endpoint.

Aggregates data from all domains (tasks, events, habits, categories,
shopping, countdowns, planning) into a single response for the frontend.
"""
from backend.domains.sync.router import router

__all__ = ["router"]
