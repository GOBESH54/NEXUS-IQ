'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';
import { getAnalyticsData } from '@/lib/api';
import { BarChart3, TrendingUp, Clock, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const chartTooltipStyle = {
  backgroundColor: '#1a2332',
  border: '1px solid #1e293b',
  borderRadius: '8px',
  color: '#f1f5f9',
};

const axisTickStyle = { fill: '#94a3b8', fontSize: 12 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>({
    downtime: [],
    maintenance_trends: [],
    mtbf: [],
    query_volume: [],
  });

  useEffect(() => {
    getAnalyticsData().then(res => setData(res || { downtime: [], maintenance_trends: [], mtbf: [], query_volume: [] }));
  }, []);

  const totalDowntime = (data.downtime || []).reduce(
    (sum: number, d: any) => sum + (d.planned || 0) + (d.unplanned || 0),
    0
  );

  const avgMonthlyCost =
    (data.maintenance_trends || []).reduce((sum: number, d: any) => sum + (d.total || 0), 0) /
    ((data.maintenance_trends || []).length || 1);

  const bestMTBF = (data.mtbf || []).reduce(
    (best: any, d: any) => ((d.current || 0) > (best?.current || 0) ? d : best),
    (data.mtbf || [])[0] || {}
  );

  const totalQueries = (data.query_volume || []).reduce(
    (sum: number, d: any) => sum + (d.queries || 0),
    0
  );
  const totalResolved = (data.query_volume || []).reduce(
    (sum: number, d: any) => sum + (d.resolved || 0),
    0
  );
  const resolutionRate =
    totalQueries > 0 ? ((totalResolved / totalQueries) * 100).toFixed(1) : '0';

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-blue-400" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          Comprehensive insights into equipment performance, maintenance costs, and AI usage
        </p>
      </motion.div>

      {/* Summary Stats Row */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-slate-400">Total Downtime</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalDowntime} hrs</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-slate-400">Avg Monthly Cost</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(avgMonthlyCost)}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Best MTBF Equipment</span>
          </div>
          <p className="text-2xl font-bold text-white truncate">
            {bestMTBF?.equipment || bestMTBF?.name || 'N/A'}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">Query Resolution Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{resolutionRate}%</p>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Equipment Downtime */}
        <motion.div className="glass-card p-6" variants={itemVariants}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Equipment Downtime
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.downtime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="equipment"
                stroke="#64748b"
                tick={axisTickStyle}
              />
              <YAxis stroke="#64748b" tick={axisTickStyle} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar
                dataKey="planned"
                name="Planned"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="unplanned"
                name="Unplanned"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 2. Maintenance Cost Trend */}
        <motion.div className="glass-card p-6" variants={itemVariants}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Maintenance Cost Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.maintenance_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={axisTickStyle}
              />
              <YAxis stroke="#64748b" tick={axisTickStyle} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Line
                type="monotone"
                dataKey="preventive"
                name="Preventive"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="corrective"
                name="Corrective"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 3. MTBF Comparison (Horizontal Bar) */}
        <motion.div className="glass-card p-6" variants={itemVariants}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            MTBF Comparison
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.mtbf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" tick={axisTickStyle} />
              <YAxis
                type="category"
                dataKey="equipment"
                stroke="#64748b"
                tick={axisTickStyle}
                width={100}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar
                dataKey="current"
                name="Current"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="target"
                name="Target"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="industry"
                name="Industry"
                fill="#f59e0b"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 4. AI Query Volume */}
        <motion.div className="glass-card p-6" variants={itemVariants}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            AI Query Volume
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.query_volume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={axisTickStyle}
              />
              <YAxis stroke="#64748b" tick={axisTickStyle} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Area
                type="monotone"
                dataKey="queries"
                name="Queries"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
}
