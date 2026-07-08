"""
NEXUS IQ™ — Document API Endpoints
Upload, list, detail, search.
"""

import os
import uuid
import shutil
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Document, Chunk
from app.schemas import DocumentOut, DocumentDetail, DocumentUploadResponse
from app.services.document_processor import process_document

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])


# ── POST /documents/upload ──────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    plant_id: Optional[str] = Form(None),
    uploaded_by: str = Form("user"),
    db: Session = Depends(get_db),
):
    """Upload a document and process it through the full pipeline."""

    # Validate file type
    allowed = {".pdf", ".txt", ".md", ".csv", ".log"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"File type '{ext}' not supported. Allowed: {allowed}")

    # Validate file size
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large. Max: {settings.MAX_FILE_SIZE_MB}MB")

    # Save to uploads directory
    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_content)

    doc_title = title or file.filename or "Untitled Document"

    try:
        doc = await process_document(
            db=db,
            file_path=file_path,
            file_name=file.filename,
            title=doc_title,
            plant_id=plant_id,
            uploaded_by=uploaded_by,
        )

        chunk_count = db.query(Chunk).filter(Chunk.document_id == doc.id).count()

        return DocumentUploadResponse(
            id=doc.id,
            title=doc.title,
            file_name=doc.file_name or "",
            doc_type=doc.doc_type or "other",
            status=doc.status or "ready",
            page_count=doc.page_count or 0,
            chunk_count=chunk_count,
            message=f"Document processed successfully: {chunk_count} chunks created",
        )

    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(500, f"Document processing failed: {str(e)}")


# ── GET /documents ──────────────────────────────────────────────────────────

@router.get("", response_model=list[DocumentOut])
async def list_documents(
    doc_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all documents with optional filtering."""
    query = db.query(Document)

    if doc_type:
        query = query.filter(Document.doc_type == doc_type)
    if status:
        query = query.filter(Document.status == status)

    docs = query.order_by(Document.created_at.desc()).offset(offset).limit(limit).all()
    return docs


# ── GET /documents/{id} ────────────────────────────────────────────────────

@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(document_id: str, db: Session = Depends(get_db)):
    """Get document details including chunk count and content preview."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    chunk_count = db.query(Chunk).filter(Chunk.document_id == document_id).count()

    return DocumentDetail(
        id=doc.id,
        title=doc.title,
        file_name=doc.file_name,
        doc_type=doc.doc_type,
        status=doc.status,
        page_count=doc.page_count or 0,
        file_size=doc.file_size,
        uploaded_by=doc.uploaded_by,
        created_at=doc.created_at,
        processed_at=doc.processed_at,
        metadata_json=doc.metadata_json,
        content_preview=(doc.content_text or "")[:500],
        chunk_count=chunk_count,
        plant_id=doc.plant_id,
    )


# ── GET /documents/{id}/chunks ──────────────────────────────────────────────

@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: str,
    db: Session = Depends(get_db),
):
    """Get all chunks for a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    chunks = (
        db.query(Chunk)
        .filter(Chunk.document_id == document_id)
        .order_by(Chunk.chunk_index)
        .all()
    )

    return [
        {
            "id": c.id,
            "chunk_index": c.chunk_index,
            "content": c.content,
            "token_count": c.token_count,
            "page_number": c.page_number,
            "section_title": c.section_title,
        }
        for c in chunks
    ]


# ── DELETE /documents/{id} ──────────────────────────────────────────────────

@router.delete("/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document and its chunks."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    # Delete file from disk
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    # Delete from ChromaDB
    try:
        from app.services.document_processor import get_chroma_collection
        collection = get_chroma_collection()
        chunk_count = db.query(Chunk).filter(Chunk.document_id == document_id).count()
        ids_to_delete = [f"{document_id}_chunk_{i}" for i in range(chunk_count)]
        if ids_to_delete:
            collection.delete(ids=ids_to_delete)
    except Exception as e:
        logger.warning(f"ChromaDB cleanup failed: {e}")

    db.delete(doc)
    db.commit()

    return {"status": "deleted", "message": f"Document {document_id} deleted"}
