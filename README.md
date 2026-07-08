# NEXUS IQ™ — The Industrial Knowledge Brain

> **Connect every document. Answer every question. Prevent every failure.**

![NEXUS IQ](https://img.shields.io/badge/NEXUS_IQ-Industrial_AI-blue?style=for-the-badge)
![Hackathon](https://img.shields.io/badge/ET_AI-Hackathon_2026-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)

## 🧠 What is NEXUS IQ?

NEXUS IQ is an **AI-powered Industrial Knowledge Intelligence** platform that transforms scattered industrial documents into a living, reasoning intelligence. It connects maintenance records, OEM manuals, inspection reports, incident logs, SOPs, and regulatory documents into a unified knowledge brain — delivering instant, cited, confidence-scored answers to any operational question.

### The Problem
- **35% of engineer time** is wasted searching for information across 7-12 disconnected systems
- **25% of experienced engineers** will retire this decade, taking institutional knowledge with them
- **18-22% of unplanned downtime** is caused by knowledge fragmentation

### The Solution
NEXUS IQ connects every document, answers every question, and prevents failures before they happen.

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **RAG Chat with Citations** | Ask questions, get grounded answers with source citations and confidence scores |
| 🕸️ **3D Knowledge Graph** | Interactive visualization of equipment, document, and incident relationships |
| 📄 **Document Intelligence** | Upload PDFs → auto-extract entities, classify, chunk, and embed |
| ⚙️ **Equipment Intelligence** | Per-equipment view with maintenance history, failure patterns, tribal knowledge |
| 📋 **Compliance Detection** | Auto-detect regulatory gaps against OISD, Factory Act, BIS standards |
| 🔍 **Root Cause Analysis** | AI-guided RCA with 5-Why methodology and Failure DNA matching |
| 🧓 **Tribal Knowledge Capture** | Preserve retiring engineers' institutional knowledge permanently |
| 📱 **Mobile-Ready Field UI** | Works on phones for field workers with large touch targets |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    NEXUS IQ™                         │
├──────────────┬──────────────────────────────────────┤
│   Frontend   │  Next.js 14 + TailwindCSS + shadcn   │
│   Backend    │  FastAPI + Python 3.11                │
│   LLM        │  Google Gemini API (Free Tier)        │
│   Embeddings │  all-MiniLM-L6-v2 (Local)            │
│   Vector DB  │  ChromaDB (Embedded)                  │
│   Database   │  SQLite + SQLAlchemy                  │
│   Graph      │  NetworkX (In-Memory)                 │
│   OCR        │  PyMuPDF                              │
└──────────────┴──────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Google Gemini API Key (free at https://aistudio.google.com)

### Setup

```bash
# Clone the repository
cd nexus-iq

# Backend Setup
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your GEMINI_API_KEY
python -m app.seed_data  # Load demo data
uvicorn app.main:app --reload --port 8000

# Frontend Setup (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 to see NEXUS IQ!

## 📊 Demo Scenario

**"The Pump That Almost Took Down the Blast Furnace"**

At 2:30 AM, a bearing temperature alarm fires on pump BF-P-07A — the primary cooling water pump for Blast Furnace 2 at Bharat Steel Limited. NEXUS IQ:

1. **Instantly retrieves** the OEM manual threshold (80°C warning, 90°C shutdown)
2. **Cross-references** 3 prior maintenance records showing a pattern
3. **Identifies** the root cause: shaft seal degradation → lubricant contamination
4. **Matches** the failure DNA to an identical incident on sister pump BF-P-07B
5. **Alerts** that BF-P-07A feeds the blast furnace cooling circuit (critical path)
6. **Recommends** immediate switchover to standby pump + work order creation

**Result**: ₹3.5 crore saved by preventing a 72-hour blast furnace shutdown.

## 🏆 Why NEXUS IQ Wins

1. **Not a chatbot** — a multi-agent industrial intelligence system
2. **Knowledge graph** — visual, interactive, memorable
3. **Quantified ROI** — ₹3.5Cr saved per incident
4. **Knowledge cliff** — solves the retiring engineer problem
5. **Trustworthy AI** — confidence scoring, citations, "I don't know"
6. **Field-ready** — mobile, voice, QR code support

## 👥 Team

Built for the ET AI Hackathon 2026 — Problem Statement 8: AI for Industrial Knowledge Intelligence

---

*NEXUS IQ™ — Networked Expert Understanding System for Industrial Operations*
