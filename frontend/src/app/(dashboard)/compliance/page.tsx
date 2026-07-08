'use client';

import React from 'react';
import { mockComplianceGaps } from '@/lib/mock-data';
import { ShieldAlert, CheckCircle, AlertTriangle, FileText, Download, Activity, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompliancePage() {
  const criticalGaps = mockComplianceGaps.filter(g => g.severity === 'Critical');
  const majorGaps = mockComplianceGaps.filter(g => g.severity === 'Major');
  const minorGaps = mockComplianceGaps.filter(g => g.severity === 'Minor');

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical': return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-medium">Critical</span>;
      case 'Major': return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium">Major</span>;
      case 'Minor': return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium">Minor</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 text-slate-100 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Intelligence</h1>
          <p className="text-slate-400 mt-1">Automated regulatory gap detection against OISD, Factory Act, and BIS standards.</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all font-medium flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Generate Evidence Package</span>
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6 text-center flex flex-col justify-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldAlert className="w-32 h-32 text-emerald-500" />
          </div>
          <h3 className="text-slate-400 font-medium mb-2 relative z-10">Plant Compliance Score</h3>
          <div className="flex justify-center items-end space-x-2 relative z-10">
            <span className="text-5xl font-bold text-amber-400">82</span>
            <span className="text-amber-400 font-medium pb-1">%</span>
          </div>
          <p className="text-sm text-slate-500 mt-2 relative z-10">Target: 95%</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6 flex flex-col justify-center md:col-span-3"
        >
          <h3 className="text-lg font-semibold mb-4 border-b border-[#1e293b] pb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" /> Active Gaps Summary
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0a0e17] rounded-lg p-4 border border-red-500/20 text-center">
              <span className="block text-3xl font-bold text-red-400 mb-1">{criticalGaps.length}</span>
              <span className="text-sm text-slate-400">Critical Gaps</span>
            </div>
            <div className="bg-[#0a0e17] rounded-lg p-4 border border-amber-500/20 text-center">
              <span className="block text-3xl font-bold text-amber-400 mb-1">{majorGaps.length}</span>
              <span className="text-sm text-slate-400">Major Gaps</span>
            </div>
            <div className="bg-[#0a0e17] rounded-lg p-4 border border-blue-500/20 text-center">
              <span className="block text-3xl font-bold text-blue-400 mb-1">{minorGaps.length}</span>
              <span className="text-sm text-slate-400">Minor Gaps</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Regulation Matrix (Mocked visual representation) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-[#1a2332] rounded-xl border border-[#1e293b] overflow-hidden"
      >
        <div className="p-6 border-b border-[#1e293b]">
          <h3 className="text-lg font-semibold flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-500" /> Compliance Matrix Map
          </h3>
        </div>
        <div className="p-6 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-5 gap-2 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
              <div className="text-left">Regulation</div>
              <div>Blast Furnace</div>
              <div>Power Plant</div>
              <div>Water Treatment</div>
              <div>Material Handling</div>
            </div>
            
            {/* OISD */}
            <div className="grid grid-cols-5 gap-2 mb-2">
              <div className="bg-[#111827] border border-[#1e293b] p-3 rounded flex items-center text-sm font-medium">OISD-116 (Fire Protection)</div>
              <div className="bg-red-500/20 border border-red-500/30 rounded flex items-center justify-center text-red-400 group relative">
                <AlertTriangle className="w-5 h-5" />
                <div className="absolute hidden group-hover:block bg-[#0a0e17] border border-[#2a374a] p-2 rounded shadow-xl z-10 w-48 text-xs top-full mt-1">1 Critical Gap (BL-03)</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center text-amber-400"><AlertTriangle className="w-5 h-5" /></div>
            </div>

            {/* Factory Act */}
            <div className="grid grid-cols-5 gap-2 mb-2">
              <div className="bg-[#111827] border border-[#1e293b] p-3 rounded flex items-center text-sm font-medium">Factory Act 1948 (Sec 31)</div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center text-amber-400"><AlertTriangle className="w-5 h-5" /></div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
            </div>

             {/* BIS */}
             <div className="grid grid-cols-5 gap-2">
              <div className="bg-[#111827] border border-[#1e293b] p-3 rounded flex items-center text-sm font-medium">IS 2825 (Pressure Vessels)</div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
              <div className="bg-red-500/20 border border-red-500/30 rounded flex items-center justify-center text-red-400"><AlertTriangle className="w-5 h-5" /></div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
              <div className="bg-[#111827] border border-[#1e293b] rounded flex items-center justify-center text-slate-500 text-xs">N/A</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gaps List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-[#1a2332] rounded-xl border border-[#1e293b] overflow-hidden"
      >
        <div className="p-6 border-b border-[#1e293b]">
          <h3 className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-500" /> Detected Compliance Gaps
          </h3>
        </div>
        <div className="divide-y divide-[#1e293b]">
          {mockComplianceGaps.map(gap => (
            <div key={gap.id} className="p-6 hover:bg-[#1f2b3d] transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    {getSeverityBadge(gap.severity)}
                    <h4 className="font-semibold text-lg">{gap.regulation}</h4>
                    <span className="text-slate-400 text-sm">Area/Eq: {gap.equipment_area || gap.equipmentTag || 'General'}</span>
                  </div>
                  <p className="text-slate-300 bg-[#0a0e17] p-3 rounded-lg border border-[#2a374a]">{gap.description || gap.requirement}</p>
                </div>
                
                <div className="w-full md:w-1/3 bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">AI Recommendation</h5>
                  <p className="text-sm text-blue-300">{gap.recommendation}</p>
                  <button className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 flex items-center transition-colors">
                    Create Action Item <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
