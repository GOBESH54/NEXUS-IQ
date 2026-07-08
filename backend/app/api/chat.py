"""
NEXUS IQ™ — Chat API Endpoints + WebSocket streaming
"""

import uuid
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Conversation, Message
from app.schemas import ChatRequest, ChatResponse, Citation
from app.services.agent_system import process_query

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


# ── POST /chat — Send a message and get a response ──────────────────────────

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Send a chat message and receive an AI-generated response with citations."""

    # 1. Get or create conversation
    conversation_id = request.conversation_id
    if conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            conversation = Conversation(id=conversation_id, title=request.message[:100])
            db.add(conversation)
    else:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            title=request.message[:100],
        )
        db.add(conversation)

    conversation_id = conversation.id

    # 2. Store user message
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    db.commit()

    # 3. Process query through agent system
    result = await process_query(
        query=request.message,
        db=db,
        equipment_tag=request.equipment_context,
    )

    # 4. Build citations
    citations = [
        Citation(
            document_id=c.get("document_id", ""),
            document_title=c.get("document_title", ""),
            chunk_content=c.get("chunk_content", ""),
            page_number=c.get("page_number"),
            relevance_score=c.get("relevance_score", 0.0),
        )
        for c in result.get("citations", [])
    ]

    # 5. Store assistant message
    assistant_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=result.get("response", ""),
        citations=[c.model_dump() for c in citations],
        agent_used=result.get("agent_used", "search"),
        confidence=result.get("confidence", 0.0),
        metadata_json={
            "follow_up_questions": result.get("follow_up_questions", []),
        },
    )
    db.add(assistant_msg)

    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    db.commit()

    return ChatResponse(
        conversation_id=conversation_id,
        message_id=assistant_msg.id,
        response=result.get("response", ""),
        citations=citations,
        agent_used=result.get("agent_used", "search"),
        confidence=result.get("confidence", 0.0),
        follow_up_questions=result.get("follow_up_questions", []),
    )


# ── GET /chat/history/{conversation_id} — Conversation history ───────────────

@router.get("/history/{conversation_id}")
async def get_chat_history(conversation_id: str, db: Session = Depends(get_db)):
    """Get the full message history for a conversation."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        return {"conversation_id": conversation_id, "messages": [], "title": ""}

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return {
        "conversation_id": conversation_id,
        "title": conversation.title,
        "created_at": conversation.created_at,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "citations": m.citations or [],
                "agent_used": m.agent_used,
                "confidence": m.confidence,
                "metadata": m.metadata_json or {},
                "created_at": m.created_at,
            }
            for m in messages
        ],
    }


# ── GET /chat/conversations — List all conversations ────────────────────────

@router.get("/conversations")
async def list_conversations(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List recent conversations."""
    conversations = (
        db.query(Conversation)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "message_count": db.query(Message).filter(Message.conversation_id == c.id).count(),
        }
        for c in conversations
    ]


# ── WebSocket /chat/ws — Streaming chat ─────────────────────────────────────

@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket, db: Session = Depends(get_db)):
    """WebSocket endpoint for streaming chat responses."""
    await websocket.accept()
    logger.info("WebSocket connection established")

    try:
        while True:
            data = await websocket.receive_json()
            query = data.get("message", "")
            equipment_tag = data.get("equipment_context")
            conversation_id = data.get("conversation_id")

            if not query:
                await websocket.send_json({"error": "Empty message"})
                continue

            # Send processing status
            await websocket.send_json({
                "type": "status",
                "message": "Processing your query…",
            })

            # Process query
            result = await process_query(query=query, db=db, equipment_tag=equipment_tag)

            # Send response
            await websocket.send_json({
                "type": "response",
                "conversation_id": conversation_id or str(uuid.uuid4()),
                "response": result.get("response", ""),
                "citations": result.get("citations", []),
                "agent_used": result.get("agent_used", "search"),
                "confidence": result.get("confidence", 0.0),
                "follow_up_questions": result.get("follow_up_questions", []),
            })

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
