'use client';

import React, { useState, useEffect } from 'react';
import { getEquipmentList } from '@/lib/api';
import { Search, Filter, Settings, ArrowRight, ShieldAlert, Activity } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EquipmentPage() {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('All');

  useEffect(() => {
    getEquipmentList().then(data => setEquipmentList(data || []));
  }, []);

  const areas = ['All', ...Array.from(new Set(equipmentList.map(e => e.area)))];

  const filteredEquipment = equipmentList.filter(eq => {
    const tagId = eq.tagId ?? eq.tag_id ?? '';
    const name = eq.name ?? '';
    const matchesSearch = tagId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea === 'All' || eq.area === filterArea;
    return matchesSearch && matchesArea;
  });

  const getCriticalityBadge = (criticality: string) => {
    switch (criticality) {
      case 'Critical': return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs">Critical</span>;
      case 'Important': return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs">Important</span>;
      case 'General': return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs">General</span>;
      default: return <span className="px-2 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full text-xs">{criticality}</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running': return 'text-emerald-400';
      case 'Standby': return 'text-blue-400';
      case 'Maintenance': return 'text-amber-400';
      case 'Down': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 text-slate-100 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment</h1>
          <p className="text-slate-400 mt-1">Manage and analyze all plant assets.</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#1a2332] p-4 rounded-xl border border-[#1e293b] flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Tag ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0e17] border border-[#2a374a] text-slate-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select 
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="bg-[#0a0e17] border border-[#2a374a] text-slate-100 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          >
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a2332] rounded-xl border border-[#1e293b] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#151c28] text-slate-400 text-sm border-b border-[#1e293b]">
              <tr>
                <th className="px-6 py-4 font-medium">Tag ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Area</th>
                <th className="px-6 py-4 font-medium">Criticality</th>
                <th className="px-6 py-4 font-medium">Risk Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-sm">
              {filteredEquipment.map((eq) => (
                <tr key={eq.id} className="hover:bg-[#1f2b3d] transition-colors group">
                  <td className="px-6 py-4 font-medium text-blue-400">
                    <Link href={`/equipment/${eq.tagId ?? eq.tag_id}`} className="hover:underline">{eq.tagId ?? eq.tag_id}</Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-200">{eq.name}</td>
                  <td className="px-6 py-4 text-slate-400">{eq.type}</td>
                  <td className="px-6 py-4 text-slate-400">{eq.area}</td>
                  <td className="px-6 py-4">{getCriticalityBadge(eq.criticality)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-[#0a0e17] rounded-full h-1.5 max-w-[80px]">
                        <div 
                          className={`h-1.5 rounded-full ${eq.riskScore > 80 ? 'bg-red-500' : eq.riskScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${eq.riskScore}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${eq.riskScore > 80 ? 'text-red-400' : eq.riskScore > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {eq.riskScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium flex items-center space-x-1.5 ${getStatusColor(eq.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>{eq.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/equipment/${eq.tagId ?? eq.tag_id}`}>
                      <button className="text-slate-400 hover:text-white p-2 hover:bg-[#2a374a] rounded-lg transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEquipment.length === 0 && (
          <div className="text-center py-20">
            <Settings className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300">No equipment found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search criteria.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
