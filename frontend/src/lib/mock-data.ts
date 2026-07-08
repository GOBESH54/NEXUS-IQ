// ==========================================
// NEXUS IQ™ — Comprehensive Mock Data
// Realistic industrial data for demo
// ==========================================

import {
  Equipment, Document, ChatMessage, Conversation,
  GraphNode, GraphEdge, KnowledgeGraph,
  ComplianceGap, ComplianceMatrix,
  TribalKnowledge, MaintenanceEvent, Inspection, Incident,
  DashboardMetrics, ActivityItem,
  DowntimeData, CostTrendData, MTBFData, QueryVolumeData,
  Plant, User
} from '@/types';

// ==================== PLANTS ====================
export const mockPlants: Plant[] = [
  { id: 'BSL-01', name: 'Bharat Steel Limited — Unit 1', location: 'Visakhapatnam, AP', type: 'Integrated Steel Plant' },
  { id: 'BSL-02', name: 'Bharat Steel Limited — Unit 2', location: 'Jamshedpur, JH', type: 'Blast Furnace Unit' },
  { id: 'RPL-01', name: 'Reliance Petrochemicals — Jamnagar', location: 'Jamnagar, GJ', type: 'Petrochemical Complex' },
];

// ==================== USER ====================
export const mockUser: User = {
  id: 'USR-001',
  name: 'Rajesh Krishnamurthy',
  email: 'rajesh.k@bharatsteel.co.in',
  role: 'Plant Engineer',
  plant: 'Bharat Steel Limited — Unit 1',
};

// ==================== EQUIPMENT ====================
export const mockEquipment: Equipment[] = [
  {
    tag_id: 'BF-P-07A',
    name: 'Blast Furnace Cooling Water Pump',
    type: 'Centrifugal Pump',
    area: 'Blast Furnace — Zone A',
    criticality: 'Critical',
    status: 'Running',
    manufacturer: 'Kirloskar Brothers Ltd',
    model: 'KBL-500/26',
    installation_date: '2018-03-15',
    last_maintenance: '2026-05-20',
    next_maintenance: '2026-07-20',
    risk_score: 78,
    mtbf_hours: 4200,
    specifications: {
      'Flow Rate': '500 m³/hr',
      'Head': '26 meters',
      'Power': '160 kW',
      'RPM': '1480',
      'Impeller Material': 'SS 316L',
      'Seal Type': 'Mechanical Double Seal',
      'Bearing Type': 'SKF 6316-2RS',
      'Suction Size': '350 mm',
      'Discharge Size': '300 mm',
      'Weight': '2,800 kg',
    },
  },
  {
    tag_id: 'BF-C-03',
    name: 'Blast Furnace Gas Compressor',
    type: 'Centrifugal Compressor',
    area: 'Blast Furnace — Zone A',
    criticality: 'Critical',
    status: 'Alert',
    manufacturer: 'Siemens Energy',
    model: 'STC-GV 80/3',
    installation_date: '2016-11-10',
    last_maintenance: '2026-04-15',
    next_maintenance: '2026-06-28',
    risk_score: 92,
    mtbf_hours: 3100,
    specifications: {
      'Capacity': '80,000 Nm³/hr',
      'Discharge Pressure': '3.5 bar',
      'Power': '4,500 kW',
      'RPM': '5,800',
      'Gas Temperature': '45°C inlet',
      'Seal Type': 'Dry Gas Seal',
    },
  },
  {
    tag_id: 'SMS-L-01',
    name: 'Steel Melting Shop Ladle Crane',
    type: 'EOT Crane',
    area: 'Steel Melting Shop',
    criticality: 'Critical',
    status: 'Running',
    manufacturer: 'Elecon Engineering',
    model: 'EOT-250T-DG',
    installation_date: '2015-08-22',
    last_maintenance: '2026-06-01',
    next_maintenance: '2026-08-01',
    risk_score: 45,
    mtbf_hours: 6800,
    specifications: {
      'Capacity': '250 Tonnes',
      'Span': '28 meters',
      'Lift Height': '22 meters',
      'Hoist Speed': '5 m/min',
      'Cross Travel Speed': '20 m/min',
    },
  },
  {
    tag_id: 'CK-HE-04',
    name: 'Coke Oven Heat Exchanger',
    type: 'Shell & Tube Heat Exchanger',
    area: 'Coke Oven Battery',
    criticality: 'High',
    status: 'Under Maintenance',
    manufacturer: 'Thermax Ltd',
    model: 'TMX-HE-1200',
    installation_date: '2019-01-18',
    last_maintenance: '2026-06-20',
    next_maintenance: '2026-09-20',
    risk_score: 65,
    mtbf_hours: 5400,
    specifications: {
      'Duty': '12 MW',
      'Shell Side Fluid': 'COG (Coke Oven Gas)',
      'Tube Side Fluid': 'Cooling Water',
      'Design Pressure': '15 bar',
      'Material': 'CS/SS 304',
    },
  },
  {
    tag_id: 'RM-CV-12',
    name: 'Raw Material Conveyor Belt',
    type: 'Belt Conveyor',
    area: 'Raw Material Handling',
    criticality: 'High',
    status: 'Running',
    manufacturer: 'Fenner India',
    model: 'FI-CV-2000',
    installation_date: '2020-06-10',
    last_maintenance: '2026-06-10',
    next_maintenance: '2026-07-10',
    risk_score: 38,
    mtbf_hours: 7200,
    specifications: {
      'Belt Width': '2000 mm',
      'Length': '850 meters',
      'Capacity': '3000 TPH',
      'Speed': '3.5 m/s',
      'Motor Power': '500 kW × 2',
    },
  },
  {
    tag_id: 'SP-AG-02',
    name: 'Sinter Plant Agglomerator',
    type: 'Rotary Drum',
    area: 'Sinter Plant',
    criticality: 'Medium',
    status: 'Running',
    manufacturer: 'Metso Outotec',
    model: 'MO-AG-4500',
    installation_date: '2017-04-20',
    last_maintenance: '2026-05-05',
    next_maintenance: '2026-08-05',
    risk_score: 42,
    mtbf_hours: 5800,
    specifications: {
      'Diameter': '4.5 meters',
      'Length': '14 meters',
      'Capacity': '400 TPH',
      'RPM': '8-12',
    },
  },
  {
    tag_id: 'BF-V-11',
    name: 'Blast Furnace Hot Blast Valve',
    type: 'Butterfly Valve',
    area: 'Blast Furnace — Zone B',
    criticality: 'Critical',
    status: 'Running',
    manufacturer: 'Paul Wurth',
    model: 'PW-HBV-1400',
    installation_date: '2016-11-10',
    last_maintenance: '2026-03-28',
    next_maintenance: '2026-06-28',
    risk_score: 71,
    mtbf_hours: 3800,
    specifications: {
      'Size': '1400 mm',
      'Pressure Rating': 'Class 150',
      'Temperature': '1200°C',
      'Material': 'Heat Resistant Cast Steel',
      'Actuator': 'Hydraulic',
    },
  },
  {
    tag_id: 'WTP-F-06',
    name: 'Water Treatment Plant Filter Press',
    type: 'Filter Press',
    area: 'Water Treatment',
    criticality: 'Medium',
    status: 'Idle',
    manufacturer: 'Andritz',
    model: 'AND-FP-2000',
    installation_date: '2021-02-14',
    last_maintenance: '2026-04-22',
    next_maintenance: '2026-07-22',
    risk_score: 25,
    mtbf_hours: 8200,
    specifications: {
      'Plate Size': '2000 × 2000 mm',
      'Number of Plates': '120',
      'Filtration Area': '960 m²',
      'Max Pressure': '16 bar',
    },
  },
  {
    tag_id: 'PP-GT-01',
    name: 'Power Plant Gas Turbine',
    type: 'Gas Turbine',
    area: 'Captive Power Plant',
    criticality: 'Critical',
    status: 'Running',
    manufacturer: 'BHEL',
    model: 'BHEL-GT-120',
    installation_date: '2014-09-30',
    last_maintenance: '2026-05-15',
    next_maintenance: '2026-08-15',
    risk_score: 58,
    mtbf_hours: 5100,
    specifications: {
      'Output': '120 MW',
      'Fuel': 'BF Gas + Mixed Gas',
      'Efficiency': '34.2%',
      'Inlet Temperature': '1100°C',
      'Exhaust Temperature': '540°C',
    },
  },
  {
    tag_id: 'BF-TH-08',
    name: 'Blast Furnace Tuyere Holder',
    type: 'Tuyere Assembly',
    area: 'Blast Furnace — Zone A',
    criticality: 'High',
    status: 'Running',
    manufacturer: 'Danieli',
    model: 'DAN-TH-32',
    installation_date: '2016-11-10',
    last_maintenance: '2026-06-18',
    next_maintenance: '2026-07-18',
    risk_score: 55,
    mtbf_hours: 4600,
    specifications: {
      'Number of Tuyeres': '32',
      'Blast Temperature': '1200°C',
      'Blast Pressure': '4.5 bar',
      'Cooling Water Flow': '500 L/min per tuyere',
    },
  },
];

// ==================== DOCUMENTS ====================
export const mockDocuments: Document[] = [
  {
    id: 'DOC-001',
    name: 'BF-P-07A Operation & Maintenance Manual',
    type: 'Maintenance Manual',
    upload_date: '2026-06-10',
    equipment_tags: ['BF-P-07A'],
    status: 'Indexed',
    pages: 284,
    size_mb: 45.2,
    extracted_entities: 156,
    summary: 'Comprehensive O&M manual for Kirloskar KBL-500/26 centrifugal pump covering installation, commissioning, operation procedures, preventive maintenance schedules, troubleshooting guides, and spare parts catalogue.',
  },
  {
    id: 'DOC-002',
    name: 'Blast Furnace Cooling System P&ID — Rev 12',
    type: 'P&ID',
    upload_date: '2026-06-08',
    equipment_tags: ['BF-P-07A', 'BF-V-11'],
    status: 'Indexed',
    pages: 8,
    size_mb: 12.8,
    extracted_entities: 89,
    summary: 'Piping and Instrumentation Diagram for the blast furnace cooling water circuit including primary and standby pumps, control valves, flow instruments, and heat exchangers.',
  },
  {
    id: 'DOC-003',
    name: 'SOP-BF-042: Emergency Cooling Pump Switchover',
    type: 'SOP',
    upload_date: '2026-06-05',
    equipment_tags: ['BF-P-07A'],
    status: 'Indexed',
    pages: 12,
    size_mb: 2.1,
    extracted_entities: 34,
    summary: 'Standard Operating Procedure for emergency switchover from primary to standby cooling water pump during pump trip or planned maintenance activities.',
  },
  {
    id: 'DOC-004',
    name: 'BF Gas Compressor Vibration Analysis Report — May 2026',
    type: 'Inspection Report',
    upload_date: '2026-06-12',
    equipment_tags: ['BF-C-03'],
    status: 'Indexed',
    pages: 28,
    size_mb: 8.4,
    extracted_entities: 67,
    summary: 'Monthly vibration analysis report showing increasing axial vibration trend on drive-end bearing. Recommends bearing replacement within 30 days.',
  },
  {
    id: 'DOC-005',
    name: 'IS 2062:2011 — Structural Steel Specification',
    type: 'Regulatory',
    upload_date: '2026-05-20',
    equipment_tags: [],
    status: 'Indexed',
    pages: 42,
    size_mb: 5.6,
    extracted_entities: 28,
  },
  {
    id: 'DOC-006',
    name: 'Coke Oven Battery Heat Exchanger Inspection — Q1 2026',
    type: 'Inspection Report',
    upload_date: '2026-04-15',
    equipment_tags: ['CK-HE-04'],
    status: 'Indexed',
    pages: 18,
    size_mb: 4.2,
    extracted_entities: 45,
    summary: 'Quarterly inspection report for coke oven heat exchanger showing tube wall thinning in sections 4-7. Recommends partial re-tubing during next shutdown.',
  },
  {
    id: 'DOC-007',
    name: 'Power Plant Gas Turbine Operating Manual',
    type: 'Maintenance Manual',
    upload_date: '2026-03-10',
    equipment_tags: ['PP-GT-01'],
    status: 'Indexed',
    pages: 520,
    size_mb: 82.3,
    extracted_entities: 312,
  },
  {
    id: 'DOC-008',
    name: 'BF Tuyere Replacement Work Order — WO-2026-0456',
    type: 'Work Order',
    upload_date: '2026-06-18',
    equipment_tags: ['BF-TH-08'],
    status: 'Indexed',
    pages: 4,
    size_mb: 0.8,
    extracted_entities: 22,
  },
  {
    id: 'DOC-009',
    name: 'Ladle Crane Load Test Certificate — 2026',
    type: 'Inspection Report',
    upload_date: '2026-06-01',
    equipment_tags: ['SMS-L-01'],
    status: 'Indexed',
    pages: 6,
    size_mb: 1.5,
    extracted_entities: 18,
  },
  {
    id: 'DOC-010',
    name: 'Conveyor Belt Splice Manual — Fenner FI-CV Series',
    type: 'Maintenance Manual',
    upload_date: '2026-05-12',
    equipment_tags: ['RM-CV-12'],
    status: 'Indexed',
    pages: 96,
    size_mb: 15.7,
    extracted_entities: 78,
  },
  {
    id: 'DOC-011',
    name: 'PESO Pressure Vessel Compliance Report',
    type: 'Regulatory',
    upload_date: '2026-06-15',
    equipment_tags: ['CK-HE-04', 'BF-V-11'],
    status: 'Processing',
    pages: 34,
    size_mb: 6.2,
    extracted_entities: 0,
  },
  {
    id: 'DOC-012',
    name: 'BF Cooling Water Chemical Treatment SDS',
    type: 'Safety Datasheet',
    upload_date: '2026-04-28',
    equipment_tags: ['BF-P-07A'],
    status: 'Indexed',
    pages: 16,
    size_mb: 2.4,
    extracted_entities: 41,
  },
];

// ==================== MAINTENANCE EVENTS ====================
export const mockMaintenanceEvents: MaintenanceEvent[] = [
  {
    id: 'ME-001', equipment_tag: 'BF-P-07A', type: 'Preventive',
    date: '2026-05-20', description: 'Quarterly PM — Bearing inspection, seal check, vibration measurement, oil analysis',
    status: 'Completed', cost: 125000, downtime_hours: 8, technician: 'Suresh Patel',
  },
  {
    id: 'ME-002', equipment_tag: 'BF-P-07A', type: 'Corrective',
    date: '2026-03-08', description: 'Mechanical seal replacement — leakage detected during routine rounds',
    status: 'Completed', cost: 285000, downtime_hours: 16, technician: 'Arun Sharma',
  },
  {
    id: 'ME-003', equipment_tag: 'BF-P-07A', type: 'Preventive',
    date: '2026-07-20', description: 'Scheduled PM — Complete bearing replacement + alignment check',
    status: 'Scheduled', cost: 180000, downtime_hours: 12, technician: 'Suresh Patel',
  },
  {
    id: 'ME-004', equipment_tag: 'BF-C-03', type: 'Predictive',
    date: '2026-06-28', description: 'Drive-end bearing replacement based on vibration analysis trend',
    status: 'Overdue', cost: 450000, downtime_hours: 24, technician: 'Vikram Singh',
  },
  {
    id: 'ME-005', equipment_tag: 'CK-HE-04', type: 'Corrective',
    date: '2026-06-20', description: 'Partial re-tubing — sections 4-7, tube wall thinning beyond safe limits',
    status: 'In Progress', cost: 1200000, downtime_hours: 72, technician: 'Ramesh Gupta',
  },
  {
    id: 'ME-006', equipment_tag: 'SMS-L-01', type: 'Preventive',
    date: '2026-06-01', description: 'Annual load test + wire rope inspection + brake system check',
    status: 'Completed', cost: 350000, downtime_hours: 16, technician: 'Pradeep Kumar',
  },
  {
    id: 'ME-007', equipment_tag: 'RM-CV-12', type: 'Preventive',
    date: '2026-06-10', description: 'Belt splice inspection + idler replacement + tracking adjustment',
    status: 'Completed', cost: 95000, downtime_hours: 6, technician: 'Dinesh Yadav',
  },
  {
    id: 'ME-008', equipment_tag: 'BF-V-11', type: 'Emergency',
    date: '2026-02-14', description: 'Emergency valve actuator repair — hydraulic line failure during operation',
    status: 'Completed', cost: 680000, downtime_hours: 18, technician: 'Vikram Singh',
  },
];

// ==================== INSPECTIONS ====================
export const mockInspections: Inspection[] = [
  {
    id: 'INS-001', equipment_tag: 'BF-P-07A', type: 'Vibration Analysis',
    date: '2026-06-15', inspector: 'Dr. S. Ramanathan', status: 'Pass',
    findings: 'All vibration levels within acceptable limits. DE bearing: 2.1 mm/s, NDE: 1.8 mm/s',
    next_due: '2026-07-15',
  },
  {
    id: 'INS-002', equipment_tag: 'BF-C-03', type: 'Vibration Analysis',
    date: '2026-06-12', inspector: 'Dr. S. Ramanathan', status: 'Fail',
    findings: 'DE axial vibration at 8.4 mm/s — exceeds alarm limit of 7.1 mm/s. Bearing defect frequency detected.',
    next_due: '2026-06-26',
  },
  {
    id: 'INS-003', equipment_tag: 'CK-HE-04', type: 'Thickness Survey',
    date: '2026-04-10', inspector: 'RINA India Pvt Ltd', status: 'Conditional Pass',
    findings: 'Tube wall thickness in sections 4-7 reduced to 1.8mm (min. 2.0mm required). Remaining sections acceptable.',
    next_due: '2026-10-10',
  },
  {
    id: 'INS-004', equipment_tag: 'SMS-L-01', type: 'Statutory Load Test',
    date: '2026-06-01', inspector: 'Chief Inspector of Factories', status: 'Pass',
    findings: 'Load test successful at 275T (110% SWL). All safety interlocks functional. Wire ropes within limits.',
    next_due: '2027-06-01',
  },
  {
    id: 'INS-005', equipment_tag: 'PP-GT-01', type: 'Borescope Inspection',
    date: '2026-05-15', inspector: 'BHEL Service Team', status: 'Conditional Pass',
    findings: 'Minor blade tip erosion on Stage 1. Coating degradation noted on 3 blades. Monitor at next interval.',
    next_due: '2026-08-15',
  },
];

// ==================== INCIDENTS ====================
export const mockIncidents: Incident[] = [
  {
    id: 'INC-001', equipment_tag: 'BF-P-07A', date: '2025-12-18',
    severity: 'Major', type: 'Equipment Failure',
    description: 'Complete pump seizure due to bearing failure. Emergency switchover to standby pump executed.',
    root_cause: 'Lubricant contamination with water ingress through damaged seal',
    corrective_action: 'Replaced bearing assembly, installed improved seal design, added moisture sensor to oil system',
    cost_impact: 3500000, downtime_hours: 36, status: 'Closed',
  },
  {
    id: 'INC-002', equipment_tag: 'BF-C-03', date: '2026-01-22',
    severity: 'Critical', type: 'Process Trip',
    description: 'Compressor surge event caused by rapid load change. Auto-shutdown activated. BF gas flaring for 4 hours.',
    root_cause: 'Anti-surge valve response time degraded — actuator sticking',
    corrective_action: 'Overhauled anti-surge valve actuator, recalibrated surge control logic, updated emergency procedures',
    cost_impact: 8500000, downtime_hours: 8, status: 'Closed',
  },
  {
    id: 'INC-003', equipment_tag: 'BF-V-11', date: '2026-02-14',
    severity: 'Major', type: 'Equipment Failure',
    description: 'Hot blast valve hydraulic actuator failure during normal operation. Manual isolation required.',
    root_cause: 'High-pressure hydraulic hose burst due to age and heat degradation',
    corrective_action: 'Replaced all hydraulic hoses, implemented quarterly hose inspection program',
    cost_impact: 2200000, downtime_hours: 18, status: 'Closed',
  },
  {
    id: 'INC-004', equipment_tag: 'CK-HE-04', date: '2026-04-02',
    severity: 'Minor', type: 'Leak',
    description: 'Small tube leak detected on heat exchanger. Tube plugged during online operation.',
    root_cause: 'Tube erosion from particulate carryover in COG stream',
    corrective_action: 'Plugged affected tube, added upstream strainer, scheduled partial re-tubing',
    cost_impact: 450000, downtime_hours: 0, status: 'Resolved',
  },
  {
    id: 'INC-005', equipment_tag: 'RM-CV-12', date: '2026-03-10',
    severity: 'Near Miss', type: 'Safety',
    description: 'Belt misalignment triggered emergency stop. Material spillage near walkway.',
    root_cause: 'Seized return idler caused belt tracking deviation',
    corrective_action: 'Replaced seized idlers, enhanced idler inspection checklist, added belt tracking sensors',
    cost_impact: 180000, downtime_hours: 4, status: 'Closed',
  },
];

// ==================== CHAT MESSAGES ====================
export const mockConversations: Conversation[] = [
  { id: 'conv-1', title: 'BF-P-07A Seal Failure Analysis', last_message: 'Based on the maintenance history...', timestamp: '2026-06-25T08:45:00', message_count: 8 },
  { id: 'conv-2', title: 'Compressor Vibration Troubleshooting', last_message: 'The vibration analysis report indicates...', timestamp: '2026-06-24T16:30:00', message_count: 12 },
  { id: 'conv-3', title: 'Compliance Gap — PESO Regulations', last_message: 'Three equipment items require...', timestamp: '2026-06-24T11:00:00', message_count: 5 },
  { id: 'conv-4', title: 'Heat Exchanger Re-tubing Procedure', last_message: 'The maintenance manual recommends...', timestamp: '2026-06-23T14:20:00', message_count: 6 },
  { id: 'conv-5', title: 'Gas Turbine Blade Inspection', last_message: 'Stage 1 blade tip erosion...', timestamp: '2026-06-22T09:15:00', message_count: 4 },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'What is the recommended maintenance procedure for BF-P-07A mechanical seal replacement?',
    timestamp: '2026-06-25T08:30:00',
    equipment_context: 'BF-P-07A',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `Based on the **BF-P-07A Operation & Maintenance Manual** [SOURCE-1] and historical maintenance records, here is the recommended procedure for mechanical seal replacement:

## Mechanical Seal Replacement Procedure

### Pre-Requisites
1. Ensure **standby pump BF-P-07B** is running and stable [SOURCE-2]
2. Obtain work permit (Hot Work + Confined Space if applicable)
3. Verify LOTO (Lock Out Tag Out) procedures completed

### Step-by-Step Procedure

1. **Isolation & Draining**
   - Close suction valve BF-V-07A-S and discharge valve BF-V-07A-D
   - Open drain valve and vent valve
   - Confirm zero pressure on gauge PI-07A-01

2. **Disassembly**
   - Remove coupling guard and disconnect coupling
   - Remove bearing housing bolts (8 × M24)
   - Slide bearing housing assembly back
   - Remove old mechanical seal assembly

3. **Seal Installation**
   - Install new **John Crane Type 4620** double seal [SOURCE-1]
   - Set seal face gap to **3.0 ± 0.2 mm** (critical dimension)
   - Connect barrier fluid lines
   - Verify barrier fluid pressure: **1.0 bar above process pressure**

4. **Reassembly & Testing**
   - Reassemble in reverse order
   - Perform laser alignment (max offset: 0.05mm)
   - Run pump on minimum flow for 30 minutes
   - Check for leaks, vibration, and temperature

### ⚠️ Critical Notes
- **Seal face gap of 3.0mm is crucial** — deviation causes premature failure
- Previous incident (Dec 2025) was caused by water ingress through damaged seal [SOURCE-3]
- Always use OEM spare parts from Kirloskar

### Estimated Time: 12-16 hours
### Estimated Cost: ₹2.85 Lakhs (including parts)`,
    timestamp: '2026-06-25T08:30:15',
    confidence: 'High',
    citations: [
      { id: 'cit-1', document_name: 'BF-P-07A Operation & Maintenance Manual', page: 142, snippet: 'Section 8.3: Mechanical Seal Replacement — The KBL-500/26 uses a John Crane Type 4620 cartridge double mechanical seal with silicon carbide faces...', relevance_score: 0.96 },
      { id: 'cit-2', document_name: 'SOP-BF-042: Emergency Cooling Pump Switchover', page: 3, snippet: 'Before any maintenance activity on primary pump BF-P-07A, ensure standby pump BF-P-07B is started and discharge pressure stabilized at 2.8 ± 0.2 bar...', relevance_score: 0.89 },
      { id: 'cit-3', document_name: 'Incident Report INC-001 — Pump Seizure Dec 2025', page: 1, snippet: 'Root cause: Lubricant contamination with water ingress through damaged mechanical seal. Contributing factor: Seal face gap found at 4.2mm vs specified 3.0mm...', relevance_score: 0.85 },
    ],
    agent_trace: [
      { agent_name: 'Document Retriever', action: 'Retrieved 3 relevant documents from knowledge base', duration_ms: 245, status: 'success' },
      { agent_name: 'Equipment Specialist', action: 'Fetched BF-P-07A maintenance history and specs', duration_ms: 180, status: 'success' },
      { agent_name: 'Incident Analyzer', action: 'Found 1 related incident for context', duration_ms: 120, status: 'success' },
      { agent_name: 'Response Synthesizer', action: 'Generated comprehensive procedure with citations', duration_ms: 890, status: 'success' },
    ],
    equipment_context: 'BF-P-07A',
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'What caused the last failure of this pump? How can we prevent it from happening again?',
    timestamp: '2026-06-25T08:35:00',
    equipment_context: 'BF-P-07A',
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content: `## Last Failure Analysis — BF-P-07A (December 18, 2025)

### Incident Summary
The pump experienced **complete seizure** due to bearing failure on December 18, 2025. Emergency switchover to standby pump BF-P-07B was executed successfully. [SOURCE-1]

### Root Cause Chain
\`\`\`
Damaged Seal → Water Ingress → Lubricant Contamination → Bearing Degradation → Seizure
\`\`\`

1. **Primary Cause**: Mechanical seal deterioration allowed cooling water to leak past the seal faces
2. **Contributing Factor**: Seal face gap was found at **4.2mm** vs specified **3.0mm** — likely from incorrect setting during previous maintenance [SOURCE-2]
3. **Detection Gap**: Existing vibration monitoring did not detect the early-stage bearing degradation pattern

### Impact
- **Downtime**: 36 hours
- **Cost**: ₹35 Lakhs (parts: ₹18L, labor: ₹5L, production loss: ₹12L)
- **Safety**: No injuries. Process safely transferred to standby pump.

### Prevention Recommendations

| # | Action | Status | Priority |
|---|--------|--------|----------|
| 1 | Install moisture sensor on bearing oil system | ✅ Completed | Critical |
| 2 | Use upgraded seal design (John Crane 4620) | ✅ Completed | Critical |
| 3 | Add seal face gap verification to PM checklist | ✅ Completed | High |
| 4 | Implement continuous vibration monitoring | 🔄 In Progress | High |
| 5 | Train technicians on proper seal setting procedure | ⏳ Pending | Medium |

### Similar Failures in Knowledge Base
The **Failure DNA** analysis identified **2 similar patterns** across the fleet:
- **CK-P-03** (Coke Plant) — Similar seal failure in 2024, also due to gap misalignment
- **SP-P-08** (Sinter Plant) — Bearing failure from contamination in 2023

This suggests a **systemic training gap** in seal installation procedures. [SOURCE-3]`,
    timestamp: '2026-06-25T08:35:20',
    confidence: 'High',
    citations: [
      { id: 'cit-4', document_name: 'Incident Report INC-001 — Pump Seizure Dec 2025', page: 1, snippet: 'Complete pump seizure due to bearing failure. Root cause: lubricant contamination with water ingress through damaged mechanical seal...', relevance_score: 0.98 },
      { id: 'cit-5', document_name: 'BF-P-07A Operation & Maintenance Manual', page: 145, snippet: 'Critical: Seal face gap must be set to 3.0 ± 0.2 mm. Incorrect setting will result in premature seal failure and potential bearing damage...', relevance_score: 0.91 },
      { id: 'cit-6', document_name: 'Failure DNA Analysis Report — Centrifugal Pumps', page: 8, snippet: 'Pattern match: Water ingress through mechanical seal leading to bearing failure identified in 3 pumps across different units...', relevance_score: 0.87 },
    ],
    agent_trace: [
      { agent_name: 'Incident Analyzer', action: 'Retrieved incident INC-001 with full root cause analysis', duration_ms: 156, status: 'success' },
      { agent_name: 'Failure DNA Agent', action: 'Found 2 similar failure patterns across equipment fleet', duration_ms: 340, status: 'success' },
      { agent_name: 'Document Retriever', action: 'Retrieved O&M manual for specification verification', duration_ms: 198, status: 'success' },
      { agent_name: 'Compliance Checker', action: 'Checked corrective action implementation status', duration_ms: 210, status: 'success' },
      { agent_name: 'Response Synthesizer', action: 'Compiled analysis with recommendations', duration_ms: 920, status: 'success' },
    ],
    equipment_context: 'BF-P-07A',
  },
];

export const mockSuggestedQuestions: string[] = [
  'What are the vibration limits for BF-C-03?',
  'Show me the maintenance history of the ladle crane',
  'Which equipment has overdue inspections?',
  'What is the MTBF trend for blast furnace pumps?',
  'List all compliance gaps for PESO regulations',
  'What caused the last compressor surge event?',
];

// ==================== KNOWLEDGE GRAPH ====================
export const mockKnowledgeGraph: KnowledgeGraph = {
  nodes: [
    // Equipment
    { id: 'BF-P-07A', label: 'BF-P-07A\nCooling Water Pump', type: 'Equipment' },
    { id: 'BF-C-03', label: 'BF-C-03\nGas Compressor', type: 'Equipment' },
    { id: 'SMS-L-01', label: 'SMS-L-01\nLadle Crane', type: 'Equipment' },
    { id: 'CK-HE-04', label: 'CK-HE-04\nHeat Exchanger', type: 'Equipment' },
    { id: 'BF-V-11', label: 'BF-V-11\nHot Blast Valve', type: 'Equipment' },
    { id: 'PP-GT-01', label: 'PP-GT-01\nGas Turbine', type: 'Equipment' },
    { id: 'RM-CV-12', label: 'RM-CV-12\nConveyor Belt', type: 'Equipment' },
    // Documents
    { id: 'DOC-001', label: 'O&M Manual\nBF-P-07A', type: 'Document' },
    { id: 'DOC-002', label: 'P&ID\nCooling System', type: 'Document' },
    { id: 'DOC-003', label: 'SOP-BF-042\nEmergency Switchover', type: 'Document' },
    { id: 'DOC-004', label: 'Vibration Report\nBF-C-03', type: 'Document' },
    { id: 'DOC-005', label: 'IS 2062:2011\nSteel Spec', type: 'Document' },
    { id: 'DOC-006', label: 'Inspection Report\nCK-HE-04', type: 'Document' },
    // Incidents
    { id: 'INC-001', label: 'Pump Seizure\nDec 2025', type: 'Incident' },
    { id: 'INC-002', label: 'Compressor Surge\nJan 2026', type: 'Incident' },
    { id: 'INC-003', label: 'Valve Failure\nFeb 2026', type: 'Incident' },
    // Technicians
    { id: 'TECH-01', label: 'Suresh Patel\nSr. Technician', type: 'Technician' },
    { id: 'TECH-02', label: 'Vikram Singh\nMechanical Engineer', type: 'Technician' },
    { id: 'TECH-03', label: 'Arun Sharma\nSeal Specialist', type: 'Technician' },
    // Regulations
    { id: 'REG-01', label: 'PESO\nPressure Vessels', type: 'Regulation' },
    { id: 'REG-02', label: 'IS 14489\nRotating Equipment', type: 'Regulation' },
    { id: 'REG-03', label: 'IBR\nBoiler Regulations', type: 'Regulation' },
    // Failure Modes
    { id: 'FM-01', label: 'Bearing Failure\nContamination', type: 'FailureMode' },
    { id: 'FM-02', label: 'Seal Failure\nGap Misalignment', type: 'FailureMode' },
    { id: 'FM-03', label: 'Compressor Surge\nControl Valve', type: 'FailureMode' },
  ],
  edges: [
    // Equipment — Documents
    { source: 'BF-P-07A', target: 'DOC-001', label: 'documented_by' },
    { source: 'BF-P-07A', target: 'DOC-002', label: 'shown_in' },
    { source: 'BF-P-07A', target: 'DOC-003', label: 'procedure_for' },
    { source: 'BF-C-03', target: 'DOC-004', label: 'inspected_in' },
    { source: 'CK-HE-04', target: 'DOC-006', label: 'inspected_in' },
    { source: 'BF-V-11', target: 'DOC-002', label: 'shown_in' },
    // Equipment — Incidents
    { source: 'BF-P-07A', target: 'INC-001', label: 'experienced' },
    { source: 'BF-C-03', target: 'INC-002', label: 'experienced' },
    { source: 'BF-V-11', target: 'INC-003', label: 'experienced' },
    // Equipment — Technicians
    { source: 'BF-P-07A', target: 'TECH-01', label: 'maintained_by' },
    { source: 'BF-P-07A', target: 'TECH-03', label: 'repaired_by' },
    { source: 'BF-C-03', target: 'TECH-02', label: 'maintained_by' },
    { source: 'BF-V-11', target: 'TECH-02', label: 'repaired_by' },
    // Equipment — Regulations
    { source: 'CK-HE-04', target: 'REG-01', label: 'regulated_by' },
    { source: 'BF-V-11', target: 'REG-01', label: 'regulated_by' },
    { source: 'BF-P-07A', target: 'REG-02', label: 'regulated_by' },
    { source: 'BF-C-03', target: 'REG-02', label: 'regulated_by' },
    { source: 'PP-GT-01', target: 'REG-03', label: 'regulated_by' },
    // Incidents — Failure Modes
    { source: 'INC-001', target: 'FM-01', label: 'caused_by' },
    { source: 'INC-001', target: 'FM-02', label: 'caused_by' },
    { source: 'INC-002', target: 'FM-03', label: 'caused_by' },
    // Equipment — Equipment
    { source: 'BF-P-07A', target: 'BF-V-11', label: 'connected_to' },
    { source: 'BF-C-03', target: 'PP-GT-01', label: 'feeds_gas_to' },
    { source: 'BF-P-07A', target: 'CK-HE-04', label: 'cools_via' },
  ],
};

// ==================== COMPLIANCE ====================
export const mockComplianceGaps: ComplianceGap[] = [
  {
    id: 'CG-001', regulation: 'PESO — Pressure Vessel Regulations', requirement: 'Annual hydrostatic test for all pressure vessels above 1 kg/cm²',
    equipment_area: 'Coke Oven Battery', severity: 'Critical', status: 'Open',
    recommendation: 'Schedule hydrostatic test for CK-HE-04 during next planned shutdown (July 2026)', due_date: '2026-07-15',
  },
  {
    id: 'CG-002', regulation: 'IS 14489 — Mechanical Vibration Standards', requirement: 'Continuous vibration monitoring for critical rotating equipment',
    equipment_area: 'Blast Furnace — Zone A', severity: 'Major', status: 'In Progress',
    recommendation: 'Install online vibration monitoring on BF-P-07A and BF-C-03. Budget approved, procurement in progress.', due_date: '2026-08-30',
  },
  {
    id: 'CG-003', regulation: 'IBR — Indian Boiler Regulations', requirement: 'Certified inspector examination of all IBR-registered equipment annually',
    equipment_area: 'Captive Power Plant', severity: 'Major', status: 'Open',
    recommendation: 'Contact authorized IBR inspector for PP-GT-01 exhaust ducting inspection', due_date: '2026-07-31',
  },
  {
    id: 'CG-004', regulation: 'Factories Act — Crane Regulations', requirement: 'Load test certificate renewal for EOT cranes',
    equipment_area: 'Steel Melting Shop', severity: 'Minor', status: 'Resolved',
    evidence: 'Load test completed on 01-Jun-2026. Certificate valid until 01-Jun-2027.',
    recommendation: 'No action needed. Next test due June 2027.', due_date: '2027-06-01',
  },
  {
    id: 'CG-005', regulation: 'PESO — Pressure Vessel Regulations', requirement: 'Safety valve calibration for all pressure vessels',
    equipment_area: 'Blast Furnace — Zone B', severity: 'Critical', status: 'Open',
    recommendation: 'Calibrate safety valve on BF-V-11 — last calibration was 18 months ago (exceeds 12-month interval)', due_date: '2026-06-30',
  },
  {
    id: 'CG-006', regulation: 'IS 3156 — Conveyor Safety', requirement: 'Emergency stop device testing every 3 months',
    equipment_area: 'Raw Material Handling', severity: 'Minor', status: 'In Progress',
    recommendation: 'Test all E-stop switches on RM-CV-12. Last test: March 2026.', due_date: '2026-07-10',
  },
];

export const mockComplianceMatrix: ComplianceMatrix[] = [
  {
    regulation: 'PESO — Pressure Vessels',
    areas: { 'Blast Furnace': 'Pending', 'Coke Oven': 'Non-Compliant', 'SMS': 'Compliant', 'Power Plant': 'Compliant', 'Water Treatment': 'N/A', 'Raw Material': 'N/A' },
  },
  {
    regulation: 'IS 14489 — Vibration',
    areas: { 'Blast Furnace': 'Non-Compliant', 'Coke Oven': 'Compliant', 'SMS': 'Compliant', 'Power Plant': 'Pending', 'Water Treatment': 'Compliant', 'Raw Material': 'N/A' },
  },
  {
    regulation: 'IBR — Boiler Regs',
    areas: { 'Blast Furnace': 'Compliant', 'Coke Oven': 'Compliant', 'SMS': 'N/A', 'Power Plant': 'Non-Compliant', 'Water Treatment': 'N/A', 'Raw Material': 'N/A' },
  },
  {
    regulation: 'Factories Act — Cranes',
    areas: { 'Blast Furnace': 'N/A', 'Coke Oven': 'N/A', 'SMS': 'Compliant', 'Power Plant': 'N/A', 'Water Treatment': 'N/A', 'Raw Material': 'Compliant' },
  },
  {
    regulation: 'IS 3156 — Conveyors',
    areas: { 'Blast Furnace': 'N/A', 'Coke Oven': 'N/A', 'SMS': 'N/A', 'Power Plant': 'N/A', 'Water Treatment': 'N/A', 'Raw Material': 'Pending' },
  },
  {
    regulation: 'OISD — Fire Safety',
    areas: { 'Blast Furnace': 'Compliant', 'Coke Oven': 'Pending', 'SMS': 'Compliant', 'Power Plant': 'Compliant', 'Water Treatment': 'Compliant', 'Raw Material': 'Compliant' },
  },
];

// ==================== TRIBAL KNOWLEDGE ====================
export const mockTribalKnowledge: TribalKnowledge[] = [
  {
    id: 'TK-001', equipment_tag: 'BF-P-07A', equipment_name: 'Blast Furnace Cooling Water Pump',
    type: 'Warning', content: 'When setting the mechanical seal gap, ALWAYS use the Kirloskar-specific setting tool (Part #KBL-ST-003). The generic setting tool gives inconsistent results and was the root cause of the December 2025 failure. The gap MUST be 3.0mm ± 0.2mm.',
    expert_name: 'Arun Sharma', date_added: '2026-01-15', upvotes: 24, verified: true,
  },
  {
    id: 'TK-002', equipment_tag: 'BF-P-07A', equipment_name: 'Blast Furnace Cooling Water Pump',
    type: 'Tip', content: 'During monsoon season (June-September), increase the bearing oil sampling frequency from monthly to weekly. Humidity causes condensation in the oil reservoir, and early detection of water ingress prevents bearing damage.',
    expert_name: 'Suresh Patel', date_added: '2026-06-01', upvotes: 18, verified: true,
  },
  {
    id: 'TK-003', equipment_tag: 'BF-C-03', equipment_name: 'Blast Furnace Gas Compressor',
    type: 'Quirk', content: 'The anti-surge valve (BF-ASV-03) has a known dead band of ~2% at the lower end of travel. When tuning the surge controller, account for this by setting the surge control line 3% above the actual surge line instead of the standard 2%.',
    expert_name: 'Vikram Singh', date_added: '2026-02-10', upvotes: 31, verified: true,
  },
  {
    id: 'TK-004', equipment_tag: 'SMS-L-01', equipment_name: 'Steel Melting Shop Ladle Crane',
    type: 'Procedure', content: 'Before the annual load test, always check the wire rope termination sockets first. In 2022, we found a cracked socket that would have failed during the test. Now it is part of our pre-test checklist: inspect all 4 rope sockets with dye penetrant testing.',
    expert_name: 'Pradeep Kumar', date_added: '2025-05-20', upvotes: 15, verified: true,
  },
  {
    id: 'TK-005', equipment_tag: 'CK-HE-04', equipment_name: 'Coke Oven Heat Exchanger',
    type: 'Warning', content: 'Never exceed 85% load on the heat exchanger when the COG scrubber is in bypass mode. The unfiltered gas carries particulates that accelerate tube erosion. We learned this the hard way — the April 2026 tube leak was directly caused by running at 92% during a scrubber bypass event.',
    expert_name: 'Ramesh Gupta', date_added: '2026-04-20', upvotes: 22, verified: true,
  },
  {
    id: 'TK-006', equipment_tag: 'RM-CV-12', equipment_name: 'Raw Material Conveyor Belt',
    type: 'Tip', content: 'The return idlers in the wet zone (stations 34-42) need to be the sealed bearing type (Fenner Part #FI-RI-SEAL). Standard idlers last only 3-4 months in this area due to iron ore slurry splash. Sealed type lasts 12+ months.',
    expert_name: 'Dinesh Yadav', date_added: '2026-03-15', upvotes: 12, verified: true,
  },
  {
    id: 'TK-007', equipment_tag: 'PP-GT-01', equipment_name: 'Power Plant Gas Turbine',
    type: 'Quirk', content: 'The GT fuel gas moisture analyzer (AT-GT-01-M) gives false high readings when the ambient temperature drops below 15°C. Do not take corrective action based solely on this reading during winter nights — always cross-check with the lab sample.',
    expert_name: 'Dr. Meena Iyer', date_added: '2025-12-10', upvotes: 19, verified: true,
  },
];

// ==================== DASHBOARD ====================
export const mockDashboardMetrics: DashboardMetrics = {
  knowledge_health_score: 87,
  documents_indexed: 1247,
  active_equipment: 342,
  compliance_gaps: 5,
  recent_queries: 156,
  risk_alerts: 3,
};

export const mockActivityFeed: ActivityItem[] = [
  { id: 'act-1', type: 'alert', message: 'BF-C-03 vibration level exceeds alarm threshold — immediate attention required', timestamp: '2026-06-25T08:15:00', severity: 'critical' },
  { id: 'act-2', type: 'document', message: 'PESO Pressure Vessel Compliance Report uploaded and processing', timestamp: '2026-06-25T07:45:00', severity: 'info' },
  { id: 'act-3', type: 'maintenance', message: 'CK-HE-04 partial re-tubing — 60% complete, on schedule', timestamp: '2026-06-25T07:30:00', severity: 'info' },
  { id: 'act-4', type: 'query', message: 'AI answered: "BF-P-07A seal replacement procedure" with High confidence', timestamp: '2026-06-25T07:15:00', severity: 'info' },
  { id: 'act-5', type: 'compliance', message: 'Compliance gap CG-005: Safety valve calibration overdue for BF-V-11', timestamp: '2026-06-25T06:00:00', severity: 'warning' },
  { id: 'act-6', type: 'alert', message: 'BF-C-03 bearing replacement overdue — scheduled for June 28', timestamp: '2026-06-24T18:00:00', severity: 'warning' },
  { id: 'act-7', type: 'document', message: 'BF Tuyere Replacement Work Order indexed — 22 entities extracted', timestamp: '2026-06-24T16:30:00', severity: 'info' },
  { id: 'act-8', type: 'maintenance', message: 'RM-CV-12 belt splice inspection completed successfully', timestamp: '2026-06-24T14:00:00', severity: 'info' },
];

export const mockTopRiskEquipment = mockEquipment
  .sort((a, b) => b.risk_score - a.risk_score)
  .slice(0, 5);

// ==================== ANALYTICS ====================
export const mockDowntimeData: DowntimeData[] = [
  { month: 'Jan', planned: 48, unplanned: 22 },
  { month: 'Feb', planned: 36, unplanned: 38 },
  { month: 'Mar', planned: 52, unplanned: 15 },
  { month: 'Apr', planned: 44, unplanned: 28 },
  { month: 'May', planned: 40, unplanned: 12 },
  { month: 'Jun', planned: 56, unplanned: 18 },
];

export const mockCostTrendData: CostTrendData[] = [
  { month: 'Jan', preventive: 1200000, corrective: 3500000, total: 4700000 },
  { month: 'Feb', preventive: 1100000, corrective: 1800000, total: 2900000 },
  { month: 'Mar', preventive: 1350000, corrective: 2200000, total: 3550000 },
  { month: 'Apr', preventive: 1250000, corrective: 1500000, total: 2750000 },
  { month: 'May', preventive: 1400000, corrective: 950000, total: 2350000 },
  { month: 'Jun', preventive: 1300000, corrective: 1200000, total: 2500000 },
];

export const mockMTBFData: MTBFData[] = [
  { equipment_type: 'Centrifugal Pumps', current: 4200, target: 6000, industry_avg: 5200 },
  { equipment_type: 'Compressors', current: 3100, target: 5000, industry_avg: 4500 },
  { equipment_type: 'Heat Exchangers', current: 5400, target: 7000, industry_avg: 6200 },
  { equipment_type: 'Conveyors', current: 7200, target: 8000, industry_avg: 6800 },
  { equipment_type: 'Cranes', current: 6800, target: 8500, industry_avg: 7200 },
  { equipment_type: 'Gas Turbines', current: 5100, target: 7500, industry_avg: 6000 },
];

export const mockQueryVolumeData: QueryVolumeData[] = [
  { date: 'Jun 19', queries: 18, resolved: 16 },
  { date: 'Jun 20', queries: 24, resolved: 22 },
  { date: 'Jun 21', queries: 15, resolved: 14 },
  { date: 'Jun 22', queries: 28, resolved: 25 },
  { date: 'Jun 23', queries: 32, resolved: 30 },
  { date: 'Jun 24', queries: 22, resolved: 20 },
  { date: 'Jun 25', queries: 16, resolved: 14 },
];

export const mockMaintenance = mockMaintenanceEvents;

export interface FailureDNAItem {
  id: string;
  equipmentType: string;
  failureMode: string;
  rootCause: string;
  frequency: string;
  avgRepairTime: string;
  avgCost: number;
  preventionStrategy: string;
}

export const mockFailureDNA: FailureDNAItem[] = [
  {
    id: 'fdna-1',
    equipmentType: 'Centrifugal Pump',
    failureMode: 'Mechanical Seal Failure',
    rootCause: 'Lubricant contamination via shaft seal wear and improper face gap',
    frequency: '38%',
    avgRepairTime: '14 hours',
    avgCost: 285000,
    preventionStrategy: 'Set face gap with OEM gauge (3.0mm ±0.2mm); monitor seal flush differential pressure.'
  },
  {
    id: 'fdna-2',
    equipmentType: 'Centrifugal Pump',
    failureMode: 'Bearing Seizure',
    rootCause: 'Inadequate lubrication interval under continuous duty cycle',
    frequency: '24%',
    avgRepairTime: '18 hours',
    avgCost: 350000,
    preventionStrategy: 'Upgrade vibration monitoring sensor; shorten lubrication interval to 3 months.'
  },
  {
    id: 'fdna-3',
    equipmentType: 'Compressor',
    failureMode: 'Impeller Erosion',
    rootCause: 'Particulate carryover in process gas stream',
    frequency: '31%',
    avgRepairTime: '36 hours',
    avgCost: 1200000,
    preventionStrategy: 'Inspect inlet strainer weekly; monitor differential pressure drop.'
  },
  {
    id: 'fdna-4',
    equipmentType: 'Gas Turbine',
    failureMode: 'Blade Tip Corrosion',
    rootCause: 'High exhaust temperature combined with sulfur trace in fuel',
    frequency: '19%',
    avgRepairTime: '48 hours',
    avgCost: 3200000,
    preventionStrategy: 'Implement continuous exhaust thermocouple tracking and periodic boroscope checks.'
  }
];

