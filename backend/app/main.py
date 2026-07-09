"""
NEXUS IQ™ — FastAPI Application Entry Point
Run with:  uvicorn app.main:app --reload --port 8000
"""

import logging
import os

# Prevent transformers from loading TensorFlow / Keras 3 (avoids Keras 3 incompatibility error)
os.environ["USE_TF"] = "NO"
os.environ["USE_TORCH"] = "YES"
os.environ["USE_FLAX"] = "NO"
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-28s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables and build knowledge graph."""
    logger.info("🚀 Starting NEXUS IQ™ Industrial Knowledge Intelligence")
    logger.info(f"   Version : {settings.APP_VERSION}")
    logger.info(f"   Database: {settings.DATABASE_URL}")

    # Create all tables
    init_db()
    logger.info("✅ Database tables created")

    # Build knowledge graph (non-blocking, from existing data)
    try:
        from app.database import SessionLocal
        from app.services.knowledge_graph import build_knowledge_graph
        db = SessionLocal()
        build_knowledge_graph(db)
        db.close()
        logger.info("✅ Knowledge graph initialised")
    except Exception as e:
        logger.warning(f"Knowledge graph init skipped: {e}")

    yield

    logger.info("🛑 NEXUS IQ™ shutting down")


# ── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "NEXUS IQ™ — Industrial Knowledge Intelligence Platform. "
        "AI-powered document analysis, maintenance intelligence, "
        "compliance monitoring, and knowledge graph for industrial plants."
    ),
    lifespan=lifespan,
)


# ── CORS Middleware ──────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Register API Routers ────────────────────────────────────────────────────

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.equipment import router as equipment_router
from app.api.knowledge_graph import router as knowledge_graph_router
from app.api.compliance import router as compliance_router
from app.api.analytics import router as analytics_router
from app.api.maintenance import router as maintenance_router
from app.api.tribal_knowledge import router as tribal_knowledge_router

API_PREFIX = "/api"

app.include_router(chat_router, prefix=API_PREFIX)
app.include_router(documents_router, prefix=API_PREFIX)
app.include_router(equipment_router, prefix=API_PREFIX)
app.include_router(knowledge_graph_router, prefix=API_PREFIX)
app.include_router(compliance_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)
app.include_router(maintenance_router, prefix=API_PREFIX)
app.include_router(tribal_knowledge_router, prefix=API_PREFIX)


# ── Static Files (Uploads) ──────────────────────────────────────────────────

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# ── Health Check ─────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint — basic health check."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    from fastapi.responses import Response
    return Response(status_code=204)


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check with component status."""
    from app.database import engine
    import sqlalchemy

    # Check database
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False

    # Check ChromaDB
    chroma_ok = False
    try:
        from app.services.document_processor import get_chroma_collection
        collection = get_chroma_collection()
        chroma_count = collection.count()
        chroma_ok = True
    except Exception:
        chroma_count = 0

    # Check knowledge graph
    kg_ok = False
    kg_nodes = 0
    try:
        from app.services.knowledge_graph import get_graph
        G = get_graph()
        kg_nodes = G.number_of_nodes()
        kg_ok = kg_nodes > 0
    except Exception:
        pass

    return {
        "status": "healthy" if db_ok else "degraded",
        "version": settings.APP_VERSION,
        "components": {
            "database": {"status": "ok" if db_ok else "error"},
            "chromadb": {"status": "ok" if chroma_ok else "error", "documents": chroma_count},
            "knowledge_graph": {"status": "ok" if kg_ok else "empty", "nodes": kg_nodes},
        },
    }
