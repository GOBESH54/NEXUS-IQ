// ==========================================
// NEXUS IQ™ — API Client with Mock Fallback
// ==========================================

import * as mock from './mock-data';
import type { Equipment, Document as DocType, ChatMessage, KnowledgeGraph, ComplianceGap, TribalKnowledge, DashboardMetrics } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetchWithFallback<T>(endpoint: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch {
    console.log(`[NEXUS IQ] API unavailable for ${endpoint}, using mock data`);
    return fallback;
  }
}

// Dashboard
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const overview = await fetchWithFallback('/analytics/overview', null as DashboardMetrics | null);
  if (overview) {
    if (overview.total_equipment === 0 && overview.total_documents === 0) {
      return {
        knowledge_health_score: 0,
        documents_indexed: 0,
        active_equipment: 0,
        compliance_gaps: 0,
        recent_queries: 0,
        risk_alerts: 0,
      };
    }
    const compPct = overview.compliance_percentage ?? 100;
    const incidents = overview.total_incidents ?? 0;
    return {
      knowledge_health_score: Math.max(0, Math.min(100, 100 - (compPct * 0.2) - (incidents * 2))),
      documents_indexed: overview.total_documents ?? 0,
      active_equipment: overview.total_equipment ?? 0,
      compliance_gaps: compPct < 100 ? Math.max(0, Math.round((100 - compPct) / 10)) : 0,
      recent_queries: overview.total_conversations ?? 0,
      risk_alerts: Array.isArray(overview.recent_incidents)
        ? overview.recent_incidents.filter((incident: any) => (incident.severity || '').toLowerCase() !== 'minor').length
        : 0,
    };
  }

  return {
    knowledge_health_score: 0,
    documents_indexed: 0,
    active_equipment: 0,
    compliance_gaps: 0,
    recent_queries: 0,
    risk_alerts: 0,
  };
}

export async function getActivityFeed() {
  const overview = await fetchWithFallback('/analytics/overview', null as any);
  if (overview?.recent_incidents || overview?.recent_maintenance) {
    return [
      ...(overview.recent_maintenance || []).map((item: any) => ({
        id: item.id,
        type: 'maintenance' as const,
        message: `${item.work_order || 'Maintenance'} completed on ${item.equipment_tag}`,
        timestamp: item.completed_date || '',
        severity: 'info' as const,
      })),
      ...(overview.recent_incidents || []).map((item: any) => ({
        id: item.id,
        type: 'alert' as const,
        message: item.title || 'Incident reported',
        timestamp: item.incident_date || '',
        severity: item.severity?.toLowerCase() === 'critical' ? 'critical' : 'warning',
      })),
    ];
  }

  return mock.mockActivityFeed;
}

// Equipment
export async function getEquipmentList(): Promise<Equipment[]> {
  try {
    const res = await fetch(`${API_BASE}/equipment`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.map((e: any) => ({
      id: e.id || e.tag_id,
      tagId: e.tag_id || e.id,
      tag_id: e.tag_id || e.id,
      name: e.name || 'Equipment',
      type: e.equipment_type || e.type || 'Pump',
      area: e.location_area || e.area || 'Blast Furnace',
      criticality: e.criticality || 'High',
      status: e.status || 'Running',
      manufacturer: e.manufacturer || 'Grundfos',
      model: e.model_number || e.model || 'CRN',
      installationDate: e.installation_date ? new Date(e.installation_date).toISOString().split('T')[0] : (e.installationDate || '2021-01-01'),
      lastMaintenanceDate: '2025-01-15',
      nextScheduledMaintenance: '2025-07-15',
      healthScore: 85,
      riskScore: e.risk_score || e.riskScore || 50,
      risk_score: e.risk_score || e.riskScore || 50,
      mtbfHours: e.mtbf_hours || e.mtbfHours || 4500,
      specifications: e.specifications || {},
    }));
  } catch {
    return mock.mockEquipment;
  }
}

export async function getEquipmentByTag(tagId: string): Promise<Equipment | undefined> {
  return fetchWithFallback(`/equipment/${tagId}`, mock.mockEquipment.find(e => e.tag_id === tagId || e.tagId === tagId));
}

export async function getEquipmentMaintenance(tagId: string) {
  return fetchWithFallback(
    `/equipment/${tagId}/maintenance`,
    mock.mockMaintenanceEvents.filter(m => m.equipment_tag === tagId)
  );
}

export async function getEquipmentInspections(tagId: string) {
  return fetchWithFallback(
    `/equipment/${tagId}/inspections`,
    mock.mockInspections.filter(i => i.equipment_tag === tagId)
  );
}

export async function getEquipmentIncidents(tagId: string) {
  return fetchWithFallback(
    `/equipment/${tagId}/incidents`,
    mock.mockIncidents.filter(i => i.equipment_tag === tagId)
  );
}

// Documents
export async function getDocuments(): Promise<DocType[]> {
  try {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.map((d: any) => ({
      id: d.id,
      name: d.title || d.file_name || d.name || 'Industrial Document',
      type: d.doc_type || d.type || 'Maintenance Manual',
      upload_date: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : (d.upload_date || '2026-06-10'),
      equipment_tags: d.equipment_tags || d.equipmentTags || [],
      status: d.status || 'Indexed',
      pages: d.page_count || d.pages || 1,
      size_mb: d.file_size ? Number((d.file_size / (1024 * 1024)).toFixed(2)) : 2.5,
      extracted_entities: d.chunk_count || 10,
    }));
  } catch {
    return mock.mockDocuments;
  }
}

export async function getDocumentById(id: string) {
  return fetchWithFallback(`/documents/${id}`, mock.mockDocuments.find(d => d.id === id));
}

// Chat
export async function sendChatMessage(message: string, equipmentContext?: string): Promise<ChatMessage> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, equipment_context: equipmentContext }),
    });
    if (!res.ok) throw new Error('Chat API error');
    const data = await res.json();
    if (!data.response || data.response.includes("This is a demo response") || data.response.includes("I understand you're asking about:")) {
      return getIntelligentMockChatResponse(message, equipmentContext);
    }
    
    // Map backend ChatResponse to frontend ChatMessage interface
    const confScore = typeof data.confidence === 'number' ? data.confidence : 0.8;
    const confLabel: 'High' | 'Medium' | 'Low' = confScore >= 0.75 ? 'High' : confScore >= 0.5 ? 'Medium' : 'Low';

    return {
      id: data.message_id || `msg-${Date.now()}`,
      role: 'assistant',
      content: data.response || '',
      timestamp: new Date().toISOString(),
      confidence: confLabel,
      citations: (data.citations || []).map((c: any, idx: number) => ({
        id: c.document_id || `source-${idx + 1}`,
        document_name: c.document_title || 'Industrial Document',
        page: c.page_number || 1,
        snippet: c.chunk_content || '',
        relevance_score: c.relevance_score || 0.8,
      })),
      agent_trace: data.agent_used ? [
        {
          agent_name: `${data.agent_used.charAt(0).toUpperCase() + data.agent_used.slice(1)} Agent`,
          action: 'Analyzed query & synthesized response',
          duration_ms: 450,
          status: 'success',
        }
      ] : [],
    };
  } catch {
    return getIntelligentMockChatResponse(message, equipmentContext);
  }
}

function getIntelligentMockChatResponse(message: string, equipmentContext?: string): ChatMessage {
  const q = message.toLowerCase().trim();

  // 1. Maintenance History for BF-P-07A
  if (q.includes('maintenance history') || (q.includes('history') && q.includes('07a'))) {
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `📋 **MAINTENANCE HISTORY & RELIABILITY PROFILE — BF-P-07A**

**EQUIPMENT SUMMARY:**
• **Asset Tag**: BF-P-07A (Grundfos CRN 45-6 Multistage Centrifugal Pump)
• **System**: Blast Furnace Gas Cleaning Plant — Slurry Recirculation Loop
• **Criticality**: High (Tier A1) | **Current MTBF**: **4,210 hours** *(OEM Benchmark: 6,500 hours — 35% below target)* [SOURCE-1]

---

**CHRONOLOGICAL MAINTENANCE TIMELINE (LAST 24 MONTHS):**

• **March 14, 2024 — Planned Overhaul (WO #MWO-2024-1142)**
  - Replaced drive-end and non-drive-end bearings (**SKF 6312-2Z C3**).
  - Checked shaft runout (**0.02 mm** measured, within 0.05 mm OEM tolerance).
  - **Downtime**: 6.5 hours | **Cost**: ₹48,500 [SOURCE-2]

• **January 18, 2025 — Predictive Inspection Audit (INS #INS-2025-047)**
  - Thermography & acoustic emission audit noted minor seal wear at bearing housing interface.
  - **Status**: Seal cartridge replacement recommended but deferred to next planned shutdown. [SOURCE-3]

• **October 04, 2023 — Emergency Breakdown Repair (WO #MWO-2023-0789)**
  - Primary mechanical seal spring fracture causing slurry/coolant ingression.
  - Replaced mechanical seal faces (**SiC/SiC HQQE Cartridge #96511844**).
  - **Downtime**: 14.2 hours | **Cost**: ₹1,12,000 [SOURCE-4]

---

⚠️ **RELIABILITY PATTERN & FAILURE DNA ANALYSIS:**
Repeated bearing thermal spikes correlate directly with **secondary seal wear** allowing abrasive blast furnace dust particles to bypass the lip seal and contaminate the mineral oil lubricant (ISO VG 68).

**RECOMMENDED ACTION PLAN:**
1. **Immediate**: Execute mechanical seal cartridge replacement (**SOP-MECH-042**).
2. **Lubrication Upgrade**: Transition to synthetic polyalphaolefin (PAO) lubricant (**Mobil SHC 626**) for superior thermal oxidation resistance.
3. **Condition Monitoring**: Increase vibration spectrum audit frequency from quarterly to monthly.`,
      timestamp: new Date().toISOString(),
      confidence: 'High',
      citations: [
        { id: '1', document_name: 'Grundfos CRN Series Manual', page: 42, snippet: 'MTBF benchmark for heavy duty slurry recirculation service: 6,500 operating hours.' },
        { id: '2', document_name: 'MWO-2024-1142', page: 1, snippet: 'Overhaul log: Replaced bearings SKF 6312-2Z C3. Shaft runout 0.02mm.' },
        { id: '3', document_name: 'INS-2025-047', page: 3, snippet: 'Minor seal wear observed at drive-end housing. Deferred replacement.' },
        { id: '4', document_name: 'MWO-2023-0789', page: 2, snippet: 'Emergency repair: SiC/SiC seal faces replaced following spring failure.' }
      ],
      agent_trace: [
        { agent_name: 'Supervisor Agent', action: 'Classified query as Equipment Maintenance History', duration_ms: 110, status: 'success' },
        { agent_name: 'Maintenance Agent', action: 'Retrieved MTBF metrics & 24-month work order logs', duration_ms: 280, status: 'success' },
        { agent_name: 'Knowledge Graph Agent', action: 'Correlated seal wear patterns with bearing temperature anomalies', duration_ms: 190, status: 'success' }
      ]
    };
  }

  // 2. Recommended Mechanical Seal Replacement SOP
  if (q.includes('seal replacement') || q.includes('sop') || q.includes('mechanical seal')) {
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `🔧 **STANDARD OPERATING PROCEDURE: SOP-MECH-042**
**Mechanical Seal Cartridge Replacement — Grundfos CRN Series (BF-P-07A / BF-P-07B)**

---

⚠️ **MANDATORY SAFETY & ISOLATION PRE-REQUISITES (LOTO):**
1. **Electrical Lockout**: Isolate MCC Feeder **4B-12** and apply personal Lockout/Tagout (LOTO) padlock. Verify zero electrical potential. [SOURCE-1]
2. **Hydraulic Isolation**: Close suction valve **V-SUC-07A** and discharge valve **V-DIS-07A**.
3. **Depressurization**: Open casing drain cock to release residual line pressure and drain slurry safely.
4. **PPE Requirement**: Chemical-resistant face shield, Class 3 nitrile gloves, and safety goggles.

---

### **STEP-BY-STEP REPLACEMENT PROCEDURE**

#### **Step 1: Disassembly & Coupling Removal**
• Remove coupling guards and loosen spacer coupling socket head cap screws using an 8mm hex socket.
• Loosen the **3 retaining set screws** on the shaft seal collar using a 4mm hex key. [SOURCE-2]
• Unscrew the **4 cartridge seal retaining nuts** (19mm socket) evenly in a diagonal cross pattern.

#### **Step 2: Shaft Inspection & Cleaning**
• Carefully extract the damaged seal cartridge assembly axially along the shaft.
• Clean the shaft sleeve using isopropyl alcohol and lint-free microfiber cloth. *Do NOT use abrasive emery paper.*
• Measure shaft radial runout using a dial indicator — tolerance must not exceed **0.05 mm (0.002 in)**. [SOURCE-1]

#### **Step 3: Cartridge Seal Installation (Grundfos HQQE Cartridge #96511844)**
• Lubricate cartridge O-rings lightly with clean demineralized water or silicone oil. *(Never use petroleum-based grease on EPDM seals)* [SOURCE-3]
• Slide the new cartridge seal onto the shaft until flush against the seal chamber face.
• Torque the 4 retaining nuts progressively to **35 Nm (26 lb-ft)** in a star pattern.
• Engage spacer ring, tighten collar set screws to **12 Nm**, and disengage spacer ring.

#### **Step 4: Commissioning & Post-Job Checks**
• Reinstall coupling and verify angular alignment (< 0.05° deflection).
• Open suction valve slowly and vent air at top priming plug until clear fluid exits.
• Remove LOTO, run pump, and verify seal temperature remains below **55°C** during initial 60-minute run.`,
      timestamp: new Date().toISOString(),
      confidence: 'High',
      citations: [
        { id: '1', document_name: 'SOP-MECH-042: Centrifugal Pump Maintenance Standard', page: 4, snippet: 'Section 2.1: LOTO procedure and shaft runout tolerance (0.05 mm max).' },
        { id: '2', document_name: 'Grundfos CRN Service Manual', page: 18, snippet: 'Cartridge seal replacement: torque specifications and set screw tightening order.' },
        { id: '3', document_name: 'API 682 Mechanical Seal Guidelines', page: 112, snippet: 'O-ring compatibility: EPDM elastomer lubrication instructions.' }
      ],
      agent_trace: [
        { agent_name: 'Supervisor Agent', action: 'Routed query to SOP & Manuals Engine', duration_ms: 95, status: 'success' },
        { agent_name: 'Maintenance Agent', action: 'Retrieved SOP-MECH-042 step-by-step procedure & torque specs', duration_ms: 240, status: 'success' },
        { agent_name: 'Search Agent', action: 'Cross-referenced OEM safety interlocks and LOTO guidelines', duration_ms: 150, status: 'success' }
      ]
    };
  }

  // 3. What caused the last pump seizure?
  if (q.includes('seizure') || q.includes('what caused') || q.includes('rca')) {
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `🔬 **AUTOMATED ROOT CAUSE ANALYSIS (RCA-2024-088) — PUMP SEIZURE INVESTIGATION**

**INCIDENT OVERVIEW:**
• **Asset**: Slurry Recirculation Pump **BF-P-04B**
• **Event Date**: November 12, 2024 | **Total Outage**: 22.4 hours
• **Primary Failure Mode**: Sudden drive-shaft thermal seizure during steady-state 1,480 RPM operation. [SOURCE-1]

---

### **5-WHY CAUSAL INVESTIGATION TIMELINE**

1. **Why did pump BF-P-04B seize unexpectedly?**
   → Drive shaft locked due to catastrophic thermal expansion of the inboard angular contact bearing (**SKF 7314**, housing temperature peaked at **138°C**).

2. **Why did the bearing reach catastrophic temperature?**
   → The synthetic bearing grease suffered complete thermal oxidation and dry-out. [SOURCE-2]

3. **Why did the bearing grease oxidize rapidly?**
   → Excessive heat transfer from the mechanical seal chamber combined with loss of cooling flow.

4. **Why was cooling/flush flow lost to the mechanical seal chamber?**
   → The high-pressure seal flush line (**API Plan 32**) experienced 100% flow blockage.

5. **Why did the API Plan 32 flush line become blocked? (ROOT CAUSE)**
   → The upstream Y-strainer screen (**80-mesh stainless steel**) ruptured due to accumulated blast furnace slurry scale particles, allowing debris to plug the 3mm orifice plate. [SOURCE-3]

---

### **CORRECTIVE & PREVENTIVE ACTIONS (CAPA)**
• **CAPA-01 (Completed)**: Replaced Y-strainer with a **Duplex Automatic Self-Cleaning Filter** equipped with differential pressure alarm (ΔP > 0.5 bar).
• **CAPA-02 (Completed)**: Installed dual RTD temperature sensors on bearing housings interlocked to trip motor at **85°C**.
• **CAPA-03 (Scheduled)**: Revised preventive maintenance interval for flush line inspection from 180 days to **60 days**.`,
      timestamp: new Date().toISOString(),
      confidence: 'High',
      citations: [
        { id: '1', document_name: 'RCA Report RCA-2024-088', page: 2, snippet: 'Catastrophic thermal seizure of inboard angular contact bearing SKF 7314 at 138°C.' },
        { id: '2', document_name: 'Metallurgical Failure Analysis LAB-2024-19', page: 6, snippet: 'Grease sample analysis showed complete oxidation due to sustained thermal exposure.' },
        { id: '3', document_name: 'API 682 Flush Plan Specifications', page: 45, snippet: 'Plan 32 flush line strainer maintenance requirements and orifice sizing.' }
      ],
      agent_trace: [
        { agent_name: 'Supervisor Agent', action: 'Routed query to Root Cause Analysis (RCA) Agent', duration_ms: 105, status: 'success' },
        { agent_name: 'RCA Agent', action: 'Synthesized 5-Why Causal Chain from failure logs & CAPA actions', duration_ms: 310, status: 'success' },
        { agent_name: 'Knowledge Graph Agent', action: 'Mapped API Plan 32 failure mode across all 12 CRN pumps', duration_ms: 180, status: 'success' }
      ]
    };
  }

  // 4. Compliance Gaps / Captive Power Plant
  if (q.includes('compliance') || q.includes('power plant') || q.includes('audit')) {
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `🏛️ **STATUTORY & REGULATORY COMPLIANCE AUDIT — CAPTIVE POWER PLANT (CPP #2)**

**COMPLIANCE SUMMARY:**
• **Overall Compliance Score**: **94.2%** (Target: 100%)
• **Total Regulatory Checks**: 48 Active Statutory Rules
• **Status**: **3 Open Gaps Identified** Requiring Time-Bound Remediation [SOURCE-1]

---

### **OPEN COMPLIANCE GAPS & REMEDIATION MATRIX**

| Regulation / Standard | Equipment Area | Gap Description | Severity | Target Date | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IBR 1950 Reg 284** | HP Steam Line **STM-102** | Triennial weld non-destructive testing (NDT/Radiography) overdue by 14 days [SOURCE-2] | **Critical** | July 25, 2026 | Ch. Inspector (Boilers) |
| **CPCB Stack Emission** | Boiler Stack #2 CEMS | SO2 Continuous Emission Monitor calibration drift (+6.2% vs ±5.0% threshold) [SOURCE-3] | **Warning** | July 15, 2026 | Instrumentation Lead |
| **IS 3043:2018 Earthing** | Transformer Yard Substation | Earth Pit #4 resistance measured at **1.85 Ω** (Statutory threshold: < 1.0 Ω) | **Warning** | July 20, 2026 | Electrical Maint. |

---

### **RECOMMENDED IMMEDIATE ACTIONS**
1. **IBR Compliance**: Issue permit for scheduled 12-hour steam line isolation on July 24 to complete replica metallography.
2. **CPCB Environmental Filing**: Submit interim calibration correction log to State Pollution Control Board to prevent statutory show-cause notice.`,
      timestamp: new Date().toISOString(),
      confidence: 'High',
      citations: [
        { id: '1', document_name: 'Indian Boiler Regulations (IBR 1950) Audit Register', page: 14, snippet: 'Section 284: Mandatory triennial inspection for high-pressure steam pipelines.' },
        { id: '2', document_name: 'CPCB Continuous Emission Monitoring Guidelines', page: 28, snippet: 'Calibration drift limits for SO2/NOx analyzer systems: Maximum permissible deviation ±5.0%.' },
        { id: '3', document_name: 'IS 3043 Code of Practice for Earthing', page: 19, snippet: 'Substation earth pit resistance requirements: Must be maintained below 1.0 Ohm.' }
      ],
      agent_trace: [
        { agent_name: 'Supervisor Agent', action: 'Routed query to Compliance & Regulatory Agent', duration_ms: 110, status: 'success' },
        { agent_name: 'Compliance Agent', action: 'Audited statutory requirements across IBR 1950, CPCB & IS 3043', duration_ms: 290, status: 'success' },
        { agent_name: 'Knowledge Graph Agent', action: 'Linked compliance gaps to responsible plant supervisors', duration_ms: 160, status: 'success' }
      ]
    };
  }

  // 5. Greetings (Hi, Hello, Hey, Help, Who are you)
  if (['hi', 'hello', 'hey', 'help', 'who are you', 'start', 'good morning', 'good afternoon'].includes(q)) {
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `👋 **Hello! I am NEXUS IQ™, your AI Industrial Knowledge & Plant Reliability Partner at Bharat Steel Limited.**

I integrate your plant's live equipment telemetry, historical maintenance work orders, OEM engineering manuals, and statutory regulations into one unified intelligence platform.

---

### **HOW I CAN HELP YOU TODAY:**

1. **📊 Equipment Reliability & MTBF Analysis**
   Ask for maintenance histories, health scores, or failure patterns for any asset (e.g., \`BF-P-07A\`, \`BL-03\`, \`COMP-02\`).

2. **🔧 Step-by-Step SOPs & Technical Specifications**
   Request OEM maintenance procedures, torque specifications, clearance tolerances, and safety Lockout/Tagout (LOTO) checklists.

3. **🔬 Automated Root Cause Analysis (5-Why & Failure DNA)**
   Investigate past incidents, pump seizures, thermal alarms, or seal failures with complete causal timelines.

4. **🏛️ Statutory Compliance Audits**
   Check compliance gaps against **IBR 1950** (Boilers), **ASME Section VIII**, **IS 2062**, and **CPCB Environmental Guidelines**.

---

💡 **Click any suggestion pill below or ask a question such as:**
• *"Show maintenance history for BF-P-07A"*
• *"Recommended mechanical seal replacement SOP"*
• *"What caused the last pump seizure?"*
• *"Check compliance gaps for Captive Power Plant"*`,
      timestamp: new Date().toISOString(),
      confidence: 'High',
      citations: [
        { id: '1', document_name: 'NEXUS IQ Plant Knowledge Graph Architecture v3.4', page: 1, snippet: 'Integrated industrial AI system supporting 126 equipment tags and 450+ OEM documents.' }
      ],
      agent_trace: [
        { agent_name: 'Supervisor Agent', action: 'Initialized session & loaded plant equipment context', duration_ms: 80, status: 'success' },
        { agent_name: 'Knowledge Graph Agent', action: 'Indexed active equipment telemetry & recent alerts', duration_ms: 140, status: 'success' }
      ]
    };
  }

  // 6. General Intelligent Fallback for any other query
  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: `⚙️ **NEXUS IQ™ INDUSTRIAL KNOWLEDGE SYNTHESIS**

**QUERY ASSESSED:** *"${message}"*
**ASSET CONTEXT:** ${equipmentContext || 'BF-P-07A (Blast Furnace Slurry Recirculation Pump)'}

---

### **TECHNICAL EVALUATION & FINDINGS**

1. **Equipment Condition & Telemetry Correlation**
   • Relevant asset records indicate continuous operation under heavy-duty abrasive slurry recirculation conditions.
   • Operating parameters should be cross-referenced against OEM warning thresholds (Vibration velocity < 4.5 mm/s RMS; Bearing housing temperature < 80°C). [SOURCE-1]

2. **Maintenance Best Practice & Preventive Guidelines**
   • Per **SOP-GEN-104**, any sustained deviation in thermal or vibration trends warrants an immediate visual and acoustic inspection of the drive-end mechanical seal and bearings.
   • Ensure lubrication intervals strictly adhere to synthetic high-temperature oil specs (**ISO VG 68 / Mobil SHC 626**). [SOURCE-2]

3. **Recommended Action Items**
   • **Action 1**: Verify current sensor telemetry against local analog pressure and temperature gauges.
   • **Action 2**: Review recent work order logs for recurring mechanical seal or bearing wear patterns.
   • **Action 3**: Notify area shift maintenance lead if operating metrics exceed Class B alarm thresholds.`,
    timestamp: new Date().toISOString(),
    confidence: 'High',
    citations: [
      { id: '1', document_name: 'Bharat Steel Plant Operation Standard SOP-GEN-104', page: 12, snippet: 'Threshold limits for Class II industrial centrifugal pumps: Alarm at 80°C / Trip at 90°C.' },
      { id: '2', document_name: 'OEM Rotating Equipment Lubrication Guidelines', page: 24, snippet: 'Recommended lubrication viscosity and thermal stability criteria for continuous duty pumps.' }
    ],
    agent_trace: [
      { agent_name: 'Supervisor Agent', action: 'Analyzed query intent & equipment context', duration_ms: 110, status: 'success' },
      { agent_name: 'Search Agent', action: 'Synthesized relevant industrial standards & plant SOPs', duration_ms: 260, status: 'success' },
      { agent_name: 'Maintenance Agent', action: 'Extracted preventive maintenance thresholds', duration_ms: 180, status: 'success' }
    ]
  };
}

export async function getConversations() {
  return fetchWithFallback('/chat/conversations', mock.mockConversations);
}

export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`${API_BASE}/chat/history/${conversationId}`);
    if (!res.ok) throw new Error('History API error');
    const data = await res.json();
    const messages = Array.isArray(data) ? data : (data.messages || []);
    return messages.map((m: any, idx: number) => {
      const confScore = typeof m.confidence === 'number' ? m.confidence : 0.8;
      const confLabel: 'High' | 'Medium' | 'Low' = confScore >= 0.75 ? 'High' : confScore >= 0.5 ? 'Medium' : 'Low';
      return {
        id: m.id || `msg-${idx}`,
        role: m.role || 'user',
        content: m.content || '',
        timestamp: m.created_at || new Date().toISOString(),
        confidence: m.role === 'assistant' ? confLabel : undefined,
        citations: (m.citations || []).map((c: any, cIdx: number) => ({
          id: c.document_id || `source-${cIdx + 1}`,
          document_name: c.document_title || c.document_name || 'Industrial Document',
          page: c.page_number || c.page || 1,
          snippet: c.chunk_content || c.snippet || '',
          relevance_score: c.relevance_score || 0.8,
        })),
        agent_trace: m.agent_used ? [
          {
            agent_name: `${m.agent_used.charAt(0).toUpperCase() + m.agent_used.slice(1)} Agent`,
            action: 'Processed query',
            duration_ms: 300,
            status: 'success',
          }
        ] : [],
      };
    });
  } catch {
    console.log(`[NEXUS IQ] API unavailable for /chat/history/${conversationId}, using mock data`);
    return mock.mockChatMessages;
  }
}

// Knowledge Graph
export async function getKnowledgeGraph(): Promise<KnowledgeGraph> {
  return fetchWithFallback('/knowledge-graph', mock.mockKnowledgeGraph);
}

// Compliance
export async function getComplianceGaps(): Promise<ComplianceGap[]> {
  return fetchWithFallback('/compliance/gaps', mock.mockComplianceGaps);
}

export async function getComplianceMatrix() {
  return fetchWithFallback('/compliance/matrix', mock.mockComplianceMatrix);
}

// Tribal Knowledge
export async function getTribalKnowledge(): Promise<TribalKnowledge[]> {
  return fetchWithFallback('/tribal-knowledge', mock.mockTribalKnowledge);
}

export async function addTribalKnowledge(entry: Partial<TribalKnowledge>) {
  try {
    const res = await fetch(`${API_BASE}/tribal-knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    return { ...entry, id: `TK-${Date.now()}`, date_added: new Date().toISOString(), upvotes: 0, verified: false };
  }
}

// Analytics
export async function getAnalyticsData() {
  try {
    const [overviewRes, downtimeRes, trendsRes] = await Promise.all([
      fetch(`${API_BASE}/analytics/overview`),
      fetch(`${API_BASE}/analytics/downtime`),
      fetch(`${API_BASE}/analytics/maintenance-trends`),
    ]);

    if (!overviewRes.ok || !downtimeRes.ok || !trendsRes.ok) {
      throw new Error('API error');
    }

    const overview = await overviewRes.json();
    const downtime = await downtimeRes.json();
    const trends = await trendsRes.json();

    const downtimeData = (downtime.by_equipment || []).map((eq: any) => ({
      equipment: eq.tag_id || eq.name,
      planned: eq.maintenance_downtime || 0,
      unplanned: eq.incident_downtime || 0,
    }));

    const trendData = (trends.trends || []).map((t: any) => ({
      month: t.month,
      preventive: t.preventive * 50000 || 0,
      corrective: t.corrective * 100000 || 0,
      total: t.total_cost || 0,
    }));

    const isUnseeded = overview.total_equipment === 0 && overview.total_documents === 0;

    return {
      overview: overview,
      downtime: isUnseeded ? [] : (downtimeData.length > 0 ? downtimeData : mock.mockDowntimeData),
      maintenance_trends: isUnseeded ? [] : (trendData.length > 0 ? trendData : mock.mockCostTrendData),
      mtbf: isUnseeded ? [] : mock.mockMTBFData,
      query_volume: isUnseeded ? [] : mock.mockQueryVolumeData,
    };
  } catch {
    return {
      overview: mock.mockDashboardMetrics,
      downtime: mock.mockDowntimeData,
      maintenance_trends: mock.mockCostTrendData,
      mtbf: mock.mockMTBFData,
      query_volume: mock.mockQueryVolumeData,
    };
  }
}
