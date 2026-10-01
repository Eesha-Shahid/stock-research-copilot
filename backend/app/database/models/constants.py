from app.config import settings

# Must match `openai_embedding_dimensions` in config and the Alembic migration.
EMBEDDING_DIMENSIONS = settings.openai_embedding_dimensions