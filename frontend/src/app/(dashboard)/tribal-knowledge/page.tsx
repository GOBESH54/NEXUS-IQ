'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Plus,
  Search,
  ThumbsUp,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Zap,
  ClipboardList,
  X,
  Settings,
} from 'lucide-react';
import { mockTribalKnowledge, mockEquipment } from '@/lib/mock-data';
import { addTribalKnowledge } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { TribalKnowledge } from '@/types';

const typeBadgeMap: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
  tip: {
    className: 'badge-emerald',
    icon: <Lightbulb className="w-3 h-3" />,
    label: 'Tip',
  },
  warning: {
    className: 'badge-red',
    icon: <AlertTriangle className="w-3 h-3" />,
    label: 'Warning',
  },
  quirk: {
    className: 'badge-amber',
    icon: <Zap className="w-3 h-3" />,
    label: 'Quirk',
  },
  procedure: {
    className: 'badge-blue',
    icon: <ClipboardList className="w-3 h-3" />,
    label: 'Procedure',
  },
};

const typeFilters = ['All', 'Tip', 'Warning', 'Quirk', 'Procedure'] as const;
const sortOptions = [
  { value: 'upvotes', label: 'Most Upvoted' },
  { value: 'newest', label: 'Newest First' },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function TribalKnowledgePage() {
  const [entries, setEntries] = useState<TribalKnowledge[]>(mockTribalKnowledge);
  const [search, setSearch] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'upvotes' | 'newest'>('upvotes');
  const [showModal, setShowModal] = useState(false);

  // New entry form state
  const [newEquipment, setNewEquipment] = useState('');
  const [newType, setNewType] = useState<string>('tip');
  const [newContent, setNewContent] = useState('');
  const [newExpert, setNewExpert] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.content?.toLowerCase().includes(q) ||
          e.equipment?.toLowerCase().includes(q) ||
          e.expert?.toLowerCase().includes(q)
      );
    }

    // Equipment filter
    if (equipmentFilter !== 'all') {
      filtered = filtered.filter(
        (e) => e.equipment?.toLowerCase() === equipmentFilter.toLowerCase()
      );
    }

    // Type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter(
        (e) => e.type?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    // Sort
    if (sortBy === 'upvotes') {
      filtered.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.date || b.createdAt || 0).getTime() -
          new Date(a.date || a.createdAt || 0).getTime()
      );
    }

    return filtered;
  }, [entries, search, equipmentFilter, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const total = entries.length;
    const verified = entries.filter((e) => e.verified).length;
    const totalUpvotes = entries.reduce((sum, e) => sum + (e.upvotes || 0), 0);
    return { total, verified, totalUpvotes };
  }, [entries]);

  const handleUpvote = (id: string | number) => {
    setEntries((prev) =>
      prev.map((e) =>
        (e.id === id) ? { ...e, upvotes: (e.upvotes || 0) + 1 } : e
      )
    );
  };

  const handleSubmit = async () => {
    if (!newContent.trim() || !newExpert.trim()) return;

    setSubmitting(true);
    try {
      const entry: Partial<TribalKnowledge> = {
        equipment: newEquipment || 'General',
        type: newType as TribalKnowledge['type'],
        content: newContent,
        expert: newExpert,
        date: new Date().toISOString().split('T')[0],
        upvotes: 0,
        verified: false,
      };

      await addTribalKnowledge(entry);

      setEntries((prev) => [
        { ...entry, id: `tk-${Date.now()}` } as TribalKnowledge,
        ...prev,
      ]);

      // Reset form
      setNewEquipment('');
      setNewType('tip');
      setNewContent('');
      setNewExpert('');
      setShowModal(false);
    } catch (err) {
      console.error('Failed to add knowledge:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            Tribal Knowledge Base
          </h1>
          <p className="text-slate-400 mt-1">
            Collective expertise and institutional knowledge from your team
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="gradient-btn flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Knowledge
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={itemVariants}
      >
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-slate-400 mt-1">Total Entries</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.verified}</p>
          <p className="text-sm text-slate-400 mt-1">Verified</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-blue-400">{stats.totalUpvotes}</p>
          <p className="text-sm text-slate-400 mt-1">Total Upvotes</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="glass-card p-4 flex flex-col lg:flex-row gap-4"
        variants={itemVariants}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search knowledge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
          />
        </div>

        {/* Equipment dropdown */}
        <select
          value={equipmentFilter}
          onChange={(e) => setEquipmentFilter(e.target.value)}
          className="input-dark px-4 py-2.5 rounded-lg text-sm min-w-[180px]"
        >
          <option value="all">All Equipment</option>
          {mockEquipment.map((eq) => (
            <option key={eq.id} value={eq.name}>
              {eq.name}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                typeFilter === t
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-300'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'upvotes' | 'newest')}
          className="input-dark px-4 py-2.5 rounded-lg text-sm min-w-[150px]"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Knowledge Cards Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        variants={containerVariants}
      >
        {filteredEntries.map((entry) => {
          const badge = typeBadgeMap[entry.type?.toLowerCase() || 'tip'] || typeBadgeMap.tip;
          return (
            <motion.div
              key={entry.id}
              className="glass-card-hover p-5 space-y-3"
              variants={itemVariants}
              layout
            >
              {/* Top row: badge + equipment + verified */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                      badge.className
                    )}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                    {entry.equipment}
                  </span>
                </div>
                {entry.verified && (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                )}
              </div>

              {/* Content */}
              <p className="text-slate-300 text-sm leading-relaxed">
                {entry.content}
              </p>

              {/* Footer: expert, date, upvote */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {entry.expert}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {entry.date || entry.createdAt}
                  </span>
                </div>
                <button
                  onClick={() => handleUpvote(entry.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    text-slate-400 hover:text-blue-400 bg-slate-800/50 hover:bg-blue-500/10
                    border border-slate-700/50 hover:border-blue-500/30 transition-all"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {entry.upvotes || 0}
                </button>
              </div>
            </motion.div>
          );
        })}

        {filteredEntries.length === 0 && (
          <motion.div
            className="col-span-full glass-card p-12 text-center"
            variants={itemVariants}
          >
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg">No knowledge entries found</p>
            <p className="text-slate-500 text-sm mt-1">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Add Knowledge Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />

            {/* Modal Content */}
            <motion.div
              className="glass-card p-6 w-full max-w-lg relative z-10 space-y-5"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Add Knowledge
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Equipment Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Equipment
                </label>
                <select
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm"
                >
                  <option value="">Select equipment...</option>
                  {mockEquipment.map((eq) => (
                    <option key={eq.id} value={eq.name}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['tip', 'warning', 'quirk', 'procedure'] as const).map((t) => {
                    const badge = typeBadgeMap[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                          newType === t
                            ? `${badge.className} border-current`
                            : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-slate-300'
                        )}
                      >
                        {badge.icon}
                        {badge.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Knowledge Content
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your knowledge, tips, or observations..."
                  rows={4}
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm resize-none"
                />
              </div>

              {/* Expert Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Expert Name
                </label>
                <input
                  type="text"
                  value={newExpert}
                  onChange={(e) => setNewExpert(e.target.value)}
                  placeholder="Your name..."
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white
                    bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !newContent.trim() || !newExpert.trim()}
                  className={cn(
                    'gradient-btn px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2',
                    (submitting || !newContent.trim() || !newExpert.trim()) &&
                      'opacity-50 cursor-not-allowed'
                  )}
                >
                  {submitting ? (
                    <>
                      <Settings className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
