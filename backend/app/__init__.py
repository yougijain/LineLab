"""LineLab Solver backend package."""

__version__ = "0.1.0"

# Load backend/.env (SUPABASE_DB_URL, CORS, etc.) if python-dotenv is present.
try:
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except Exception:  # pragma: no cover - dotenv is optional
    pass
