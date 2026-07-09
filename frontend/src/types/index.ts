// ==========================================
// NEXUS IQ™ — TypeScript Type Definitions
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plant: string;
  avatar?: string;
}

export type UserRole = 'Plant Engineer' | 'Maintenance Manager' | 'Safety Officer' | 'Plant Head';

export interface Plant {
  id: string;
  name: string;
  location: string;
  type: string;
}

// Equipment
export interface Equipment {
  id?: string;
  tagId?: string;
  tag_id: string;
  name: string;
  type: string;
  area: string;
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Running' | 'Idle' | 'Under Maintenance' | 'Shutdown' | 'Alert';
  manufacturer: string;
  model: string;
  installation_date: string;
  last_maintenance: string;
  next_maintenance: string;
  risk_score: number;
  mtbf_hours: number;
  specifications: Record<string, string>;
}

export interface MaintenanceEvent {
  id: string;
  equipment_tag: string;
  type: 'Preventive' | 'Corrective' | 'Predictive' | 'Emergency';
  date: string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Overdue';
  cost: number;
  downtime_hours: number;
  technician: string;
}

export interface Inspection {
  id: string;
  equipment_tag: string;
  type: string;
  date: string;
  inspector: string;
  status: 'Pass' | 'Conditional Pass' | 'Fail' | 'Pending';
  findings: string;
  next_due: string;
}

export interface Incident {
  id: string;
  equipment_tag: string;
  date: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Near Miss';
  type: string;
  description: string;
  root_cause: string;
  corrective_action: string;
  cost_impact: number;
  downtime_hours: number;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
}

// Documents
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  upload_date: string;
  equipment_tags: string[];
  status: 'Processing' | 'Indexed' | 'Failed' | 'Pending';
  pages: number;
  size_mb: number;
  extracted_entities: number;
  summary?: string;
}

export type DocumentType = 'P&ID' | 'SOP' | 'Maintenance Manual' | 'Inspection Report' | 'Safety Datasheet' | 'Design Specification' | 'Regulatory' | 'Work Order' | 'Technical Drawing';

// Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: 'High' | 'Medium' | 'Low';
  citations?: Citation[];
  agent_trace?: AgentTrace[];
  equipment_context?: string;
}

export interface Citation {
  id: string;
  document_name: string;
  page: number;
  snippet: string;
  relevance_score: number;
}

export interface AgentTrace {
  agent_name: string;
  action: string;
  duration_ms: number;
  status: 'success' | 'partial' | 'skipped';
}

export interface Conversation {
  id: string;
  title: string;
  last_message: string;
  timestamp: string;
  message_count: number;
}

// Knowledge Graph
export interface GraphNode {
  id: string;
  label: string;
  type: 'Equipment' | 'Document' | 'Incident' | 'Technician' | 'Regulation' | 'FailureMode';
  properties?: Record<string, string>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  relationship?: string;
  weight?: number;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Compliance
export interface ComplianceGap {
  id: string;
  regulation: string;
  requirement: string;
  equipment_area: string;
  equipmentTag?: string;
  description?: string;
  severity: 'Critical' | 'Major' | 'Minor';
  status: 'Open' | 'In Progress' | 'Resolved';
  evidence?: string;
  recommendation: string;
  due_date: string;
}

export interface ComplianceMatrix {
  regulation: string;
  areas: Record<string, 'Compliant' | 'Pending' | 'Non-Compliant' | 'N/A'>;
}

// Tribal Knowledge
export interface TribalKnowledge {
  id: string;
  equipment_tag: string;
  equipment_name: string;
  equipment?: string;
  type: 'Quirk' | 'Tip' | 'Warning' | 'Procedure';
  content: string;
  expert_name: string;
  expert?: string;
  date_added: string;
  date?: string;
  createdAt?: string;
  upvotes: number;
  verified: boolean;
}

// Analytics
export interface DowntimeData {
  month: string;
  planned: number;
  unplanned: number;
}

export interface CostTrendData {
  month: string;
  preventive: number;
  corrective: number;
  total: number;
}

export interface MTBFData {
  equipment_type: string;
  current: number;
  target: number;
  industry_avg: number;
}

export interface QueryVolumeData {
  date: string;
  queries: number;
  resolved: number;
}

// Dashboard
export interface DashboardMetrics {
  knowledge_health_score: number;
  documents_indexed: number;
  active_equipment: number;
  compliance_gaps: number;
  recent_queries: number;
  risk_alerts: number;
  total_equipment?: number;
  total_documents?: number;
  compliance_percentage?: number;
  total_incidents?: number;
  total_conversations?: number;
  recent_incidents?: any[];
}

export interface ActivityItem {
  id: string;
  type: 'document' | 'query' | 'maintenance' | 'alert' | 'compliance';
  message: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'critical';
}
