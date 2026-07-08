"""
NEXUS IQ™ — Document Processing Pipeline
Upload → Extract Text → Chunk → Embed → Store in ChromaDB
"""

import os

# Prevent transformers from loading TensorFlow / Keras 3
os.environ["USE_TF"] = "NO"
os.environ["USE_TORCH"] = "YES"
os.environ["USE_FLAX"] = "NO"
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"

import re
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF
import chromadb
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Document, Chunk
from app.services.gemini_client import classify_document, extract_entities

logger = logging.getLogger(__name__)

# ── Lazy-loaded singletons ────────────────────────────────────────────────────

_embedding_model = None
_chroma_client = None
_chroma_collection = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
    return _embedding_model


def get_chroma_collection():
    global _chroma_client, _chroma_collection
    if _chroma_collection is None:
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        _chroma_collection = _chroma_client.get_or_create_collection(
            name="nexus_documents",
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("ChromaDB collection ready")
    return _chroma_collection


# ── Text Extraction ───────────────────────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    """Extract text from a PDF file using PyMuPDF. Returns (full_text, page_count)."""
    doc = fitz.open(file_path)
    pages_text = []
    for page in doc:
        text = page.get_text("text")
        if text.strip():
            pages_text.append(text)
    doc.close()
    return "\n\n".join(pages_text), len(pages_text) if pages_text else doc.page_count


def extract_text_from_txt(file_path: str) -> tuple[str, int]:
    """Extract text from a plain text file."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    return text, 1


def extract_text(file_path: str) -> tuple[str, int]:
    """Route extraction based on file extension."""
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".txt", ".md", ".csv", ".log"):
        return extract_text_from_txt(file_path)
    else:
        return extract_text_from_txt(file_path)


# ── Semantic Chunking ─────────────────────────────────────────────────────────

SECTION_PATTERNS = [
    r"^#{1,4}\s+",                       # Markdown headers
    r"^\d+\.\d*\s+[A-Z]",               # Numbered sections like "1.2 Scope"
    r"^(?:SECTION|CHAPTER|PART)\s+\d+",  # SECTION 1, CHAPTER 2 …
    r"^[A-Z][A-Z\s]{4,}$",              # ALL-CAPS headings
]


def _estimate_tokens(text: str) -> int:
    """Rough token estimate: 1 token ≈ 4 characters."""
    return len(text) // 4


def _detect_section_title(line: str) -> Optional[str]:
    for pattern in SECTION_PATTERNS:
        if re.match(pattern, line.strip()):
            return line.strip()[:200]
    return None


def chunk_text(
    full_text: str,
    chunk_size: int = settings.CHUNK_SIZE_TOKENS,
    overlap: int = settings.CHUNK_OVERLAP_TOKENS,
) -> list[dict]:
    """Split text into semantic chunks respecting section boundaries."""
    lines = full_text.split("\n")
    chunks: list[dict] = []
    current_chunk_lines: list[str] = []
    current_tokens = 0
    current_section = "Introduction"
    page_number = 1

    for line in lines:
        # Track page breaks (form-feed or page markers)
        if "\f" in line or re.match(r"^-{3,}$|^={3,}$", line.strip()):
            page_number += 1

        # Detect section boundaries
        section = _detect_section_title(line)
        if section:
            # If we have accumulated content and hit a new section, flush
            if current_chunk_lines and current_tokens > overlap:
                chunk_text_content = "\n".join(current_chunk_lines)
                chunks.append({
                    "content": chunk_text_content.strip(),
                    "token_count": _estimate_tokens(chunk_text_content),
                    "page_number": page_number,
                    "section_title": current_section,
                })
                # Keep overlap
                overlap_chars = overlap * 4
                if len(chunk_text_content) > overlap_chars:
                    overlap_text = chunk_text_content[-overlap_chars:]
                    current_chunk_lines = [overlap_text]
                    current_tokens = overlap
                else:
                    current_chunk_lines = []
                    current_tokens = 0
            current_section = section

        current_chunk_lines.append(line)
        current_tokens += _estimate_tokens(line)

        # Flush when we hit chunk_size
        if current_tokens >= chunk_size:
            chunk_text_content = "\n".join(current_chunk_lines)
            chunks.append({
                "content": chunk_text_content.strip(),
                "token_count": _estimate_tokens(chunk_text_content),
                "page_number": page_number,
                "section_title": current_section,
            })
            overlap_chars = overlap * 4
            if len(chunk_text_content) > overlap_chars:
                overlap_text = chunk_text_content[-overlap_chars:]
                current_chunk_lines = [overlap_text]
                current_tokens = overlap
            else:
                current_chunk_lines = []
                current_tokens = 0

    # Final chunk
    if current_chunk_lines:
        chunk_text_content = "\n".join(current_chunk_lines)
        if chunk_text_content.strip():
            chunks.append({
                "content": chunk_text_content.strip(),
                "token_count": _estimate_tokens(chunk_text_content),
                "page_number": page_number,
                "section_title": current_section,
            })

    return chunks


# ── Embedding ─────────────────────────────────────────────────────────────────

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts using sentence-transformers."""
    model = get_embedding_model()
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return embeddings.tolist()


# ── Equipment Tag Extraction (regex-based) ────────────────────────────────────

EQUIPMENT_TAG_PATTERN = re.compile(
    r"\b([A-Z]{1,4}-[A-Z]{1,4}-\d{2,4}[A-Z]?)\b"
)


def extract_equipment_tags(text: str) -> list[str]:
    """Extract equipment tag IDs from text using regex."""
    return list(set(EQUIPMENT_TAG_PATTERN.findall(text)))


# ── Store chunks in ChromaDB ─────────────────────────────────────────────────

def store_chunks_in_chroma(
    chunks: list[dict],
    document_id: str,
    doc_type: str,
    doc_title: str,
):
    """Store chunk embeddings in ChromaDB with metadata."""
    if not chunks:
        return

    collection = get_chroma_collection()

    texts = [c["content"] for c in chunks]
    embeddings = generate_embeddings(texts)

    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "document_id": document_id,
            "doc_type": doc_type or "other",
            "doc_title": doc_title,
            "chunk_index": i,
            "page_number": c.get("page_number", 1),
            "section_title": c.get("section_title", ""),
            "token_count": c.get("token_count", 0),
        }
        for i, c in enumerate(chunks)
    ]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )
    logger.info(f"Stored {len(chunks)} chunks in ChromaDB for doc {document_id}")


# ── Full Processing Pipeline ─────────────────────────────────────────────────

async def process_document(
    db: Session,
    file_path: str,
    file_name: str,
    title: str,
    plant_id: str | None = None,
    uploaded_by: str = "system",
) -> Document:
    """Full pipeline: save record → extract text → classify → chunk → embed → store."""

    file_size = os.path.getsize(file_path)

    # 1. Create document record
    doc = Document(
        id=str(uuid.uuid4()),
        plant_id=plant_id,
        title=title,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        status="processing",
        uploaded_by=uploaded_by,
    )
    db.add(doc)
    db.commit()

    try:
        # 2. Extract text
        full_text, page_count = extract_text(file_path)
        doc.content_text = full_text
        doc.page_count = page_count

        # 3. Classify document
        sample = full_text[:2000]
        doc_type = await classify_document(sample)
        doc.doc_type = doc_type

        # 4. Extract entities
        entities = await extract_entities(full_text[:3000])
        equipment_tags = extract_equipment_tags(full_text)
        if isinstance(entities, dict):
            entities["equipment_tags_regex"] = equipment_tags
        doc.metadata_json = {"entities": entities, "equipment_tags": equipment_tags}

        # 5. Chunk text
        chunks_data = chunk_text(full_text)

        # 6. Store chunks in DB
        for i, c in enumerate(chunks_data):
            chunk = Chunk(
                id=str(uuid.uuid4()),
                document_id=doc.id,
                chunk_index=i,
                content=c["content"],
                token_count=c["token_count"],
                page_number=c.get("page_number", 1),
                section_title=c.get("section_title"),
                metadata_json={"equipment_tags": extract_equipment_tags(c["content"])},
            )
            db.add(chunk)

        # 7. Store in ChromaDB
        store_chunks_in_chroma(chunks_data, doc.id, doc_type, title)

        doc.status = "ready"
        doc.processed_at = datetime.utcnow()
        db.commit()
        db.refresh(doc)

        logger.info(f"Document processed: {title} — {len(chunks_data)} chunks, type={doc_type}")
        return doc

    except Exception as e:
        logger.error(f"Document processing failed: {e}")
        doc.status = "error"
        doc.metadata_json = {"error": str(e)}
        db.commit()
        raise


# ── Direct text ingestion (for seed data) ────────────────────────────────────

def ingest_text_directly(
    db: Session,
    text: str,
    title: str,
    doc_type: str = "other",
    plant_id: str | None = None,
    uploaded_by: str = "system",
) -> Document:
    """Ingest raw text without a file — used by seed_data and programmatic inserts."""

    doc_id = str(uuid.uuid4())
    page_count = max(1, text.count("\f") + 1)

    doc = Document(
        id=doc_id,
        plant_id=plant_id,
        title=title,
        file_name=f"{title.replace(' ', '_').lower()}.txt",
        file_path="",
        file_size=len(text.encode()),
        doc_type=doc_type,
        content_text=text,
        page_count=page_count,
        status="ready",
        uploaded_by=uploaded_by,
        processed_at=datetime.utcnow(),
        metadata_json={"equipment_tags": extract_equipment_tags(text)},
    )
    db.add(doc)

    # Chunk
    chunks_data = chunk_text(text)
    for i, c in enumerate(chunks_data):
        chunk = Chunk(
            id=str(uuid.uuid4()),
            document_id=doc_id,
            chunk_index=i,
            content=c["content"],
            token_count=c["token_count"],
            page_number=c.get("page_number", 1),
            section_title=c.get("section_title"),
            metadata_json={"equipment_tags": extract_equipment_tags(c["content"])},
        )
        db.add(chunk)

    # Embed & store in ChromaDB
    try:
        store_chunks_in_chroma(chunks_data, doc_id, doc_type, title)
    except Exception as e:
        logger.warning(f"ChromaDB storage skipped during ingest: {e}")

    db.commit()
    return doc
