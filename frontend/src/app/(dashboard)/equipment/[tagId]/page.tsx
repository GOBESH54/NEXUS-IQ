'use client';

import React, { useState } from 'react';
import { mockEquipment, mockMaintenance, mockInspections, mockIncidents, mockFailureDNA, mockTribalKnowledge } from '@/lib/mock-data';
import { 
  Settings, AlertTriangle, FileText, Activity, ShieldAlert, Users, Calendar, 
  CheckCircle, ArrowLeft, MessageSquare, Wrench, ChevronRight, Clock, MapPin,
  DollarSign, FileCheck, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function EquipmentDetailPage({ params }: { params?: { tagId?: string } }) {
  const [activeTab, setActiveTab] = useState('overview');
  const routeParams = useParams();
  const rawTagId = (routeParams?.tagId as string) || params?.tagId || 'BF-P-07A';
  const decodedTag = decodeURIComponent(rawTagId);

  // Find equipment safely handling both tag_id and tagId
  const foundEquipment = mockEquipment.find(eq => 
    eq.tag_id === decodedTag || (eq as any).tagId === decodedTag
  ) || mockEquipment[0];

  // Safe normalized properties
  const equipment = {
    ...foundEquipment,
    tagId: foundEquipment.tag_id || (foundEquipment as any).tagId || decodedTag,
    id: (foundEquipment as any).id || foundEquipment.tag_id || decodedTag,
    model: foundEquipment.model || (foundEquipment as any).modelNumber || 'N/A',
    installationDate: foundEquipment.installation_date || (foundEquipment as any).installationDate || 'N/A',
    lastMaintenance: foundEquipment.last_maintenance || (foundEquipment as any).lastMaintenanceDate || 'N/A',
    nextMaintenance: foundEquipment.next_maintenance || (foundEquipment as any).nextScheduledMaintenance || 'N/A',
    mtbfHours: foundEquipment.mtbf_hours || (foundEquipment as any).mtbfHours || 4200,
    riskScore: foundEquipment.risk_score || (foundEquipment as any).riskScore || 50
  };

  // Filter related data
  const maintenance = mockMaintenance.filter(m => 
    m.equipment_tag === equipment.tagId || (m as any).equipmentId === equipment.id
  );
  const inspections = mockInspections.filter(i => 
    i.equipment_tag === equipment.tagId || (i as any).equipmentId === equipment.id
  );
  const incidents = mockIncidents.filter(i => 
    i.equipment_tag === equipment.tagId || (i as any).equipmentId === equipment.id
  );
  const failureDNA = mockFailureDNA.filter(f => 
    f.equipmentType?.toLowerCase() === equipment.type?.toLowerCase() ||
    equipment.type?.toLowerCase().includes(f.equipmentType?.toLowerCase() || '')
  );
  const knowledge = mockTribalKnowledge.filter(k => 
    k.equipment_tag === equipment.tagId || (k as any).equipmentId === equipment.id
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Settings className="w-4 h-4 mr-2" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4 mr-2" /> },
    { id: 'inspections', label: 'Inspections', icon: <CheckCircle className="w-4 h-4 mr-2" /> },
    { id: 'incidents', label: 'Incidents', icon: <Activity className="w-4 h-4 mr-2" /> },
    { id: 'failure-dna', label: 'Failure DNA', icon: <AlertTriangle className="w-4 h-4 mr-2" /> },
    { id: 'tribal-knowledge', label: 'Tribal Knowledge', icon: <Users className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 text-slate-100 max-w-7xl mx-auto pb-24">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <div className="flex items-center text-sm text-slate-400">
          <Link href="/equipment" className="hover:text-blue-400 transition-colors flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Equipment
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-200">{equipment.tagId}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{equipment.tagId}</h1>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                equipment.criticality === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                equipment.criticality === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {equipment.criticality}
              </span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                equipment.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                equipment.status === 'Shutdown' || equipment.status === 'Alert' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {equipment.status}
              </span>
            </div>
            <p className="text-xl text-slate-300">{equipment.name}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-blue-400" /> {equipment.area}</span>
              <span className="flex items-center"><Settings className="w-4 h-4 mr-1 text-cyan-400" /> {equipment.type}</span>
            </div>
          </div>

          <Link href="/chat">
            <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all font-medium flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Ask AI About This</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1e293b] flex overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#1a2332]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'incidents' && incidents.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{incidents.length}</span>
            )}
            {tab.id === 'tribal-knowledge' && knowledge.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{knowledge.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Specifications Card */}
                  <div className="bg-[#1a2332] rounded-xl border border-[#1e293b] overflow-hidden">
                    <div className="p-4 border-b border-[#1e293b] bg-[#151c28]">
                      <h3 className="font-semibold flex items-center"><Settings className="w-4 h-4 mr-2 text-blue-500" /> Specifications</h3>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-[#1e293b]">
                          <tr className="hover:bg-[#1f2b3d] transition-colors">
                            <td className="py-3 px-4 text-slate-400 w-1/3">Manufacturer</td>
                            <td className="py-3 px-4 font-medium">{equipment.manufacturer}</td>
                          </tr>
                          <tr className="hover:bg-[#1f2b3d] transition-colors">
                            <td className="py-3 px-4 text-slate-400">Model</td>
                            <td className="py-3 px-4 font-medium">{equipment.model}</td>
                          </tr>
                          <tr className="hover:bg-[#1f2b3d] transition-colors">
                            <td className="py-3 px-4 text-slate-400">Installation Date</td>
                            <td className="py-3 px-4 font-medium">{equipment.installationDate}</td>
                          </tr>
                          {Object.entries(equipment.specifications || {}).map(([key, value]) => (
                            <tr key={key} className="hover:bg-[#1f2b3d] transition-colors">
                              <td className="py-3 px-4 text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                              <td className="py-3 px-4 font-medium">{String(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column Metrics */}
                <div className="space-y-6">
                  <div className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Risk Score</h3>
                    <div className="flex items-end space-x-2">
                      <span className="text-4xl font-bold text-amber-400">{equipment.riskScore}</span>
                      <span className="text-slate-500 text-sm mb-1">/ 100</span>
                    </div>
                    <div className="w-full bg-[#0a0e17] rounded-full h-2 mt-3">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${equipment.riskScore}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">MTBF (Mean Time Between Failures)</h3>
                    <div className="flex items-end space-x-2">
                      <span className="text-4xl font-bold text-blue-400">{equipment.mtbfHours.toLocaleString()}</span>
                      <span className="text-slate-500 text-sm mb-1">hours</span>
                    </div>
                  </div>

                  <div className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6 space-y-3">
                    <h3 className="text-sm font-medium text-slate-400">Maintenance Schedule</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Last Maintenance:</span>
                      <span className="text-slate-200 font-medium">{equipment.lastMaintenance}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Next Due:</span>
                      <span className="text-cyan-400 font-medium">{equipment.nextMaintenance}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MAINTENANCE TAB */}
            {activeTab === 'maintenance' && (
              <div className="bg-[#1a2332] rounded-xl border border-[#1e293b] overflow-hidden">
                <div className="p-4 border-b border-[#1e293b] bg-[#151c28]">
                  <h3 className="font-semibold flex items-center"><Wrench className="w-4 h-4 mr-2 text-blue-500" /> Maintenance History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#151c28] text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-medium">Work Order</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Description</th>
                        <th className="px-6 py-4 font-medium">Technician</th>
                        <th className="px-6 py-4 font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {maintenance.map(m => (
                        <tr key={m.id} className="hover:bg-[#1f2b3d] transition-colors">
                          <td className="px-6 py-4 font-medium text-blue-400">{(m as any).work_order || m.id}</td>
                          <td className="px-6 py-4 text-slate-300">{m.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs border ${
                              m.type === 'Emergency' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              m.type === 'Preventive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{m.description}</td>
                          <td className="px-6 py-4 text-slate-400">{m.technician}</td>
                          <td className="px-6 py-4 font-mono text-slate-300">₹{m.cost?.toLocaleString('en-IN') || 0}</td>
                        </tr>
                      ))}
                      {maintenance.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No maintenance records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INSPECTIONS TAB */}
            {activeTab === 'inspections' && (
              <div className="bg-[#1a2332] rounded-xl border border-[#1e293b] overflow-hidden">
                <div className="p-4 border-b border-[#1e293b] bg-[#151c28]">
                  <h3 className="font-semibold flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Inspection Reports</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#151c28] text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-medium">Inspection ID</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Inspector</th>
                        <th className="px-6 py-4 font-medium">Findings</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {inspections.map(ins => (
                        <tr key={ins.id} className="hover:bg-[#1f2b3d] transition-colors">
                          <td className="px-6 py-4 font-medium text-blue-400">{ins.id}</td>
                          <td className="px-6 py-4 text-slate-300">{ins.date}</td>
                          <td className="px-6 py-4 text-slate-300">{ins.type}</td>
                          <td className="px-6 py-4 text-slate-400">{ins.inspector}</td>
                          <td className="px-6 py-4 text-slate-300 max-w-xs">{ins.findings}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              ins.status === 'Pass' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              ins.status === 'Fail' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {ins.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {inspections.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No inspection records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INCIDENTS TAB */}
            {activeTab === 'incidents' && (
              <div className="bg-[#1a2332] rounded-xl border border-[#1e293b] overflow-hidden">
                <div className="p-4 border-b border-[#1e293b] bg-[#151c28]">
                  <h3 className="font-semibold flex items-center"><Activity className="w-4 h-4 mr-2 text-red-500" /> Recorded Incidents & Root Causes</h3>
                </div>
                <div className="divide-y divide-[#1e293b]">
                  {incidents.map(inc => (
                    <div key={inc.id} className="p-6 hover:bg-[#1f2b3d] transition-colors space-y-3">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            inc.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            inc.severity === 'Major' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {inc.severity}
                          </span>
                          <h4 className="font-semibold text-lg text-white">{inc.description}</h4>
                        </div>
                        <span className="text-xs text-slate-400">{inc.date}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a0e17] p-4 rounded-lg border border-[#2a374a]">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Root Cause</p>
                          <p className="text-sm text-slate-300">{inc.root_cause}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Corrective Action</p>
                          <p className="text-sm text-emerald-400">{inc.corrective_action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {incidents.length === 0 && (
                    <div className="p-8 text-center text-slate-500">No recorded incidents for this equipment.</div>
                  )}
                </div>
              </div>
            )}

            {/* FAILURE DNA TAB */}
            {activeTab === 'failure-dna' && (
              <div className="space-y-6">
                <div className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6">
                  <h3 className="font-semibold text-lg flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                    Failure DNA Pattern Analysis
                  </h3>
                  <p className="text-sm text-slate-400">
                    Aggregated statistical failure modes across all <strong className="text-white">{equipment.type}</strong> units in the plant.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {failureDNA.map(dna => (
                    <div key={dna.id} className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6 space-y-4 hover:border-amber-500/40 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-amber-400 font-medium tracking-wide uppercase">Failure Mode</span>
                          <h4 className="text-xl font-bold text-white mt-1">{dna.failureMode}</h4>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold text-sm">
                          {dna.frequency} Frequency
                        </span>
                      </div>
                      <div className="bg-[#0a0e17] p-3 rounded-lg border border-[#2a374a]">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Primary Root Cause</p>
                        <p className="text-sm text-slate-300">{dna.rootCause}</p>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Avg Repair Time: <strong className="text-slate-200">{dna.avgRepairTime}</strong></span>
                        <span>Avg Impact: <strong className="text-slate-200">₹{dna.avgCost.toLocaleString('en-IN')}</strong></span>
                      </div>
                      <div className="border-t border-[#1e293b] pt-3">
                        <p className="text-xs text-emerald-400 font-medium">Prevention Strategy: {dna.preventionStrategy}</p>
                      </div>
                    </div>
                  ))}
                  {failureDNA.length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-[#1a2332] rounded-xl border border-[#1e293b] text-slate-400">
                      No Failure DNA patterns indexed for this equipment type yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TRIBAL KNOWLEDGE TAB */}
            {activeTab === 'tribal-knowledge' && (
              <div className="space-y-4">
                {knowledge.map(k => {
                  const expertName = k.expert_name || (k as any).author || 'Expert Engineer';
                  const dateAdded = k.date_added || (k as any).date || 'Recently';
                  return (
                    <div key={k.id} className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6 hover:border-blue-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                            {expertName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-white">{expertName}</p>
                            <p className="text-xs text-slate-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" /> {dateAdded}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                          k.type === 'Warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          k.type === 'Quirk' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {k.type}
                        </span>
                      </div>
                      <p className="text-slate-200 bg-[#0a0e17] p-4 rounded-lg border border-[#2a374a] leading-relaxed">
                        "{k.content}"
                      </p>
                    </div>
                  );
                })}
                {knowledge.length === 0 && (
                  <div className="text-center py-12 bg-[#1a2332] rounded-xl border border-[#1e293b]">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No tribal knowledge recorded for this equipment yet.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
