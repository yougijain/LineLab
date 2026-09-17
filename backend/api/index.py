"""
Vercel serverless entrypoint.

Vercel's Python runtime serves the ASGI callable exported as ``app``. Every
request is rewritten here by ``vercel.json``, so FastAPI still sees the original
path (``/api/health``, ``/api/compare``, …) and routing is unchanged from the
local ``uvicorn app.main:app`` setup.
"""

from app.main import app

__all__ = ["app"]
