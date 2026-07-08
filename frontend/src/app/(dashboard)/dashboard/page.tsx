'use client';

import React, { useEffect, useState } from 'react';
import { mockDashboardMetrics } from '@/lib/mock-data';
import { getActivityFeed, getComplianceGaps, getDashboardMetrics, getEquipmentList } from '@/lib/api';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  MessageSquare, 
  Server,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type DashboardMetricsView = {
  knowledgeHealthScore: number;
  totalDocuments: number;
  complianceGaps: number;
  totalAIQueries: number;
};

type EquipmentRow = {
  id: string;
  tagId: string;
  name: string;
  area: string;
  riskScore: number;
  status: string;
};

type ActivityRow = {
  id: string;
  type: 'maintenance' | 'alert' | 'query' | 'document' | 'compliance';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

function deriveRiskScore(equipment: any): number {
  const criticalityMap: Record<string, number> = {
    Critical: 38,
    High: 28,
    Medium: 18,
    Low: 8,
  };
  const criticalityWeight = criticalityMap[String(equipment?.criticality)] ?? 12;

  const statusMap: Record<string, number> = {
    Running: 6,
    Idle: 12,
    'Under Maintenance': 18,
    Shutdown: 25,
    Alert: 35,
  };
  const statusWeight = statusMap[String(equipment?.status)] ?? 10;

  const mtbfWeight = typeof equipment?.mtbf_hours === 'number'
    ? Math.min(20, Math.max(0, Math.round((7000 - equipment.mtbf_hours) / 300)))
    : 0;

  return Math.max(0, Math.min(100, criticalityWeight + statusWeight + mtbfWeight));
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetricsView>({
    knowledgeHealthScore: mockDashboardMetrics.knowledge_health_score,
    totalDocuments: mockDashboardMetrics.documents_indexed,
    complianceGaps: mockDashboardMetrics.compliance_gaps,
    totalAIQueries: mockDashboardMetrics.recent_queries,
  });
  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([]);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
  const [criticalGapCount, setCriticalGapCount] = useState(0);
  const [majorGapCount, setMajorGapCount] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([
      getDashboardMetrics(),
      getEquipmentList(),
      getActivityFeed(),
      getComplianceGaps(),
    ])
      .then(([dashboardMetrics, equipment, activity, gaps]) => {
        if (!active) return;

        setMetrics({
          knowledgeHealthScore: dashboardMetrics.knowledge_health_score,
          totalDocuments: dashboardMetrics.documents_indexed,
          complianceGaps: dashboardMetrics.compliance_gaps,
          totalAIQueries: dashboardMetrics.recent_queries,
        });

        setEquipmentRows(
          equipment
            .map((item: any, index: number) => ({
              id: item.id || item.tag_id || `eq-${index}`,
              tagId: item.tag_id,
              name: item.name,
              area: item.location_area || 'Unknown',
              riskScore: deriveRiskScore(item),
              status: item.status || 'Unknown',
            }))
            .sort((left: EquipmentRow, right: EquipmentRow) => right.riskScore - left.riskScore)
            .slice(0, 5)
        );

        setActivityRows((activity as ActivityRow[]).slice(0, 5));
        setCriticalGapCount(gaps.filter((gap: any) => (gap.severity || '').toLowerCase() === 'critical').length);
        setMajorGapCount(gaps.filter((gap: any) => (gap.severity || '').toLowerCase() === 'major').length);
      })
      .catch(() => {
        if (!active) return;
        setMetrics({
          knowledgeHealthScore: mockDashboardMetrics.knowledge_health_score,
          totalDocuments: mockDashboardMetrics.documents_indexed,
          complianceGaps: mockDashboardMetrics.compliance_gaps,
          totalAIQueries: mockDashboardMetrics.recent_queries,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 text-slate-100 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1">Plant overview and intelligence summary.</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/chat">
            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all font-medium flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI Copilot</span>
            </button>
          </Link>
        </div>
      </div>

      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Knowledge Health */}
        <motion.div variants={item} className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-16 h-16 text-emerald-500" />
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-emerald-400" />
              Knowledge Health
            </p>
            <div className="flex items-end space-x-2 mt-2">
              <h3 className="text-4xl font-bold text-slate-100">{metrics.knowledgeHealthScore}</h3>
              <span className="text-emerald-400 text-sm font-medium mb-1">/ 100</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b]">
            <p className="text-xs text-slate-400">+2 from last week</p>
          </div>
        </motion.div>

        {/* Documents */}
        <motion.div variants={item} className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText className="w-16 h-16 text-blue-500" />
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-400" />
              Documents Indexed
            </p>
            <div className="flex items-end space-x-2 mt-2">
              <h3 className="text-4xl font-bold text-slate-100">{metrics.totalDocuments}</h3>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b]">
            <p className="text-xs text-slate-400">across {equipmentRows.length || 0} equipment items</p>
          </div>
        </motion.div>

        {/* Compliance Gaps */}
        <motion.div variants={item} className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />
              Compliance Gaps
            </p>
            <div className="flex items-end space-x-2 mt-2">
              <h3 className="text-4xl font-bold text-amber-500">{metrics.complianceGaps}</h3>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b] flex space-x-3">
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
              {criticalGapCount} Critical
            </span>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
              {majorGapCount} Major
            </span>
          </div>
        </motion.div>

        {/* AI Queries */}
        <motion.div variants={item} className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <MessageSquare className="w-16 h-16 text-cyan-500" />
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-cyan-400" />
              AI Queries (30d)
            </p>
            <div className="flex items-end space-x-2 mt-2">
              <h3 className="text-4xl font-bold text-slate-100">{metrics.totalAIQueries}</h3>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1e293b]">
            <p className="text-xs text-slate-400 flex items-center text-emerald-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              92% resolution rate
            </p>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At-Risk Equipment */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-[#1a2332] rounded-xl border border-[#1e293b] overflow-hidden"
        >
          <div className="p-6 border-b border-[#1e293b] flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Top At-Risk Equipment
            </h3>
            <Link href="/equipment">
              <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#151c28] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Tag ID</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Area</th>
                  <th className="px-6 py-4 font-medium">Risk Score</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {equipmentRows.map((eq) => (
                  <tr key={eq.id} className="hover:bg-[#1f2b3d] transition-colors group">
                    <td className="px-6 py-4 font-medium text-blue-400 group-hover:text-blue-300">
                      <Link href={`/equipment/${eq.tagId}`}>{eq.tagId}</Link>
                    </td>
                    <td className="px-6 py-4">{eq.name}</td>
                    <td className="px-6 py-4 text-slate-400">{eq.area}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-[#0a0e17] rounded-full h-2 max-w-[100px]">
                          <div 
                            className={`h-2 rounded-full ${eq.riskScore > 80 ? 'bg-red-500' : 'bg-amber-500'}`} 
                            style={{ width: `${eq.riskScore}%` }}
                          ></div>
                        </div>
                        <span className={eq.riskScore > 80 ? 'text-red-400 font-medium' : 'text-amber-400 font-medium'}>
                          {eq.riskScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full text-xs border border-amber-500/30">
                        {eq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1a2332] rounded-xl border border-[#1e293b] p-6"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-500" />
            Recent Activity
          </h3>
          <div className="space-y-6">
            {activityRows.map((activity) => {
              const icon = activity.type === 'maintenance'
                ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                : activity.type === 'alert'
                  ? <AlertTriangle className="w-4 h-4 text-red-500" />
                  : activity.type === 'document'
                    ? <FileText className="w-4 h-4 text-blue-500" />
                    : activity.type === 'compliance'
                      ? <Server className="w-4 h-4 text-amber-400" />
                      : <MessageSquare className="w-4 h-4 text-purple-500" />;

              return (
                <div key={activity.id} className="flex space-x-4">
                  <div className="mt-1">{icon}</div>
                  <div>
                    <p className="text-sm text-slate-200">{activity.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
