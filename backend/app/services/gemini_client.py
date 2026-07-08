"""
NEXUS IQ™ — Gemini API Client
Wraps Google Generative AI with retry logic and structured prompting.
"""

import os
import json
import logging
from typing import Optional

import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)

# ── Configure Gemini ──────────────────────────────────────────────────────────

_configured = False


def _ensure_configured():
    global _configured
    if not _configured:
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        if api_key:
            genai.configure(api_key=api_key)
            _configured = True
        else:
            logger.warning("GEMINI_API_KEY not set — LLM features will return fallback responses.")


def get_model() -> genai.GenerativeModel:
    _ensure_configured()
    return genai.GenerativeModel(settings.GEMINI_MODEL)


# ── Generation helpers ────────────────────────────────────────────────────────

async def generate_text(prompt: str, system_instruction: str | None = None, temperature: float = 0.3) -> str:
    """Generate text from Gemini. Returns fallback on error."""
    _ensure_configured()
    try:
        if not _configured:
            return _fallback_response(prompt)

        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=system_instruction,
        )
        generation_config = genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=4096,
        )
        response = model.generate_content(prompt, generation_config=generation_config)
        return response.text
    except Exception as e:
        error_text = str(e)
        if "429" in error_text or "quota" in error_text.lower() or "billing" in error_text.lower():
            logger.error(f"Gemini quota/billing error: {e}")
            return (
                "The Gemini API key is configured, but the project has no available free-tier quota or billing access for the selected model. "
                "Please enable billing or use a project/model with available quota."
            )
        logger.error(f"Gemini generation error: {e}")
        return _fallback_response(prompt)


async def generate_json(prompt: str, system_instruction: str | None = None) -> dict | list:
    """Generate structured JSON from Gemini."""
    full_prompt = prompt + "\n\nRespond ONLY with valid JSON. No markdown, no explanation."
    raw = await generate_text(full_prompt, system_instruction=system_instruction, temperature=0.1)
    # Strip markdown code fences if present
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Remove first and last line (```json and ```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw = "\n".join(lines)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse Gemini JSON response: {raw[:200]}")
        return {}


async def classify_document(text_sample: str) -> str:
    """Classify a document into a type category."""
    prompt = f"""Classify the following industrial document excerpt into ONE of these categories:
- manual (equipment manuals, OEM documentation)
- sop (standard operating procedures)
- report (inspection reports, audit reports, incident reports)
- regulation (safety regulations, compliance standards)
- p&id (piping & instrumentation diagrams)
- datasheet (equipment datasheets, specifications)
- maintenance_log (maintenance work orders, logs)
- other

Document excerpt:
\"\"\"
{text_sample[:2000]}
\"\"\"

Respond with ONLY the category name, nothing else."""

    result = await generate_text(prompt, temperature=0.1)
    result = result.strip().lower().replace('"', '').replace("'", "")
    valid = {"manual", "sop", "report", "regulation", "p&id", "datasheet", "maintenance_log", "other"}
    return result if result in valid else "other"


async def extract_entities(text: str) -> dict:
    """Extract industrial entities from text using Gemini."""
    prompt = f"""Extract industrial entities from the following text. Return a JSON object with these keys:
- equipment_tags: list of equipment tag IDs (e.g., "BF-P-07A", "CW-HX-03")
- personnel: list of person names
- failure_modes: list of failure modes mentioned
- chemicals: list of chemicals or materials
- regulations: list of regulation codes or standards
- dates: list of dates mentioned
- measurements: list of measurements with units

Text:
\"\"\"
{text[:3000]}
\"\"\"

Respond ONLY with valid JSON."""

    return await generate_json(prompt)


async def generate_rag_response(query: str, context: str, system_prompt: str) -> str:
    """Generate a RAG response using context chunks."""
    prompt = f"""Context information from industrial knowledge base:
---
{context}
---

User question: {query}

Instructions: Answer the question using ONLY the context provided. If the context doesn't contain enough information, say so. Include specific citations by referencing document names and page numbers when available. Be precise and technical."""

    return await generate_text(prompt, system_instruction=system_prompt)


async def run_rca_analysis(incident_description: str, equipment_context: str) -> str:
    """Run structured root cause analysis."""
    prompt = f"""Perform a structured Root Cause Analysis (RCA) using the 5-Why method for the following incident.

Equipment Context:
{equipment_context}

Incident Description:
{incident_description}

Provide your analysis in this format:
1. **Problem Statement**: Clear statement of the problem
2. **5-Why Analysis**:
   - Why 1: [first why with answer]
   - Why 2: [second why with answer]
   - Why 3: [third why with answer]
   - Why 4: [fourth why with answer]
   - Why 5: [root cause]
3. **Root Cause**: The fundamental root cause
4. **Contributing Factors**: List of contributing factors
5. **Corrective Actions**: Immediate actions needed
6. **Preventive Actions**: Long-term prevention measures
7. **Recommended Monitoring**: How to detect early signs"""

    return await generate_text(prompt, temperature=0.2)


def _fallback_response(prompt: str) -> str:
    """Generate a fallback response when Gemini is unavailable."""
    if "classify" in prompt.lower():
        return "other"
    if "extract" in prompt.lower():
        return '{"equipment_tags":[],"personnel":[],"failure_modes":[]}'
    return (
        "I'm currently unable to generate a Gemini response. The API key may be configured, but the request could not be completed. "
        "Please check Gemini quota, billing, or model availability and try again."
    )
