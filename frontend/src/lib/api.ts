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
    // Return mock AI response
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `I understand you're asking about: **"${message}"**\n\nBased on my analysis of the industrial knowledge base at Bharat Steel Limited, I can provide the following insights:\n\n1. The equipment data shows relevant maintenance patterns\n2. Historical incidents provide context for preventive measures\n3. Applicable SOPs and maintenance manuals contain detailed procedures\n\n*Note: This is a demo response. Connect to the NEXUS IQ backend for AI-powered answers with real citations.*`,
      timestamp: new Date().toISOString(),
      confidence: 'Medium',
      citations: [
        { id: 'demo-1', document_name: 'Demo Document', page: 1, snippet: 'This is a demo citation...', relevance_score: 0.85 },
      ],
      agent_trace: [
        { agent_name: 'Document Retriever', action: 'Searched knowledge base', duration_ms: 150, status: 'success' },
        { agent_name: 'Response Synthesizer', action: 'Generated response', duration_ms: 500, status: 'success' },
      ],
    };
  }
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
