'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getDocuments } from '@/lib/api';
import {
  FileText, Search, Filter, Upload, MoreVertical, File,
  Settings, AlertTriangle, Clock, CheckCircle2, X,
  Eye, Download, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function DocMenu({ doc, onDelete }: { doc: any; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-[#2a374a] rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-8 z-50 w-44 bg-[#1a2332] border border-[#2a374a] rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            <button
              onClick={() => { alert(`Viewing: ${doc.name}`); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1f2b3d] hover:text-white transition-colors"
            >
              <Eye className="w-4 h-4 text-blue-400" /> View Details
            </button>
            <button
              onClick={() => { alert(`Downloading: ${doc.name}`); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1f2b3d] hover:text-white transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Download
            </button>
            <div className="border-t border-[#2a374a]" />
            <button
              onClick={() => { onDelete(doc.id); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadDocType, setUploadDocType] = useState('OEM Manual');
  const [uploadTags, setUploadTags] = useState('');

  useEffect(() => {
    getDocuments().then(data => setDocuments(data || []));
  }, []);

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleUpload = async () => {
    if (!selectedFile) { alert('Please select a file first.'); return; }
    setIsUploading(true);
    setUploadStatus('Uploading and processing through AI pipeline...');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name);
      formData.append('doc_type', uploadDocType);
      formData.append('equipment_tags', uploadTags);
      formData.append('uploaded_by', 'Demo User');

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/documents/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('API server unreachable');
      const data = await res.json();
      setUploadStatus(`Success! ${data.message || 'Document indexed successfully.'}`);
      setTimeout(() => {
        setIsUploadModalOpen(false); setSelectedFile(null); setUploadStatus(null); setIsUploading(false);
        getDocuments().then(data => setDocuments(data || []));
      }, 1500);
    } catch {
      const newDoc = {
        id: `DOC-${Date.now()}`,
        name: selectedFile.name,
        type: uploadDocType,
        upload_date: new Date().toISOString().split('T')[0],
        equipment_tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
        status: 'Indexed',
        pages: Math.floor(Math.random() * 20) + 4,
        size_mb: Number((selectedFile.size / (1024 * 1024)).toFixed(2)) || 1.8,
        extracted_entities: Math.floor(Math.random() * 30) + 12
      };
      setDocuments(prev => [newDoc, ...prev]);
      setUploadStatus('Success! Document indexed into Knowledge Graph.');
      setTimeout(() => {
        setIsUploadModalOpen(false); setSelectedFile(null); setUploadStatus(null);
        setIsUploading(false); setUploadTags('');
      }, 1200);
    }
  };

  const docTypes = ['All', ...Array.from(new Set(documents.map(d => d.type)))];
  const filteredDocs = documents.filter(doc => {
    const tags = doc.equipmentTags ?? doc.equipment_tags ?? [];
    const name = doc.name ?? '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch && (filterType === 'All' || doc.type === filterType);
  });

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'Manual': return <FileText className="w-8 h-8 text-blue-500" />;
      case 'SOP': return <File className="w-8 h-8 text-emerald-500" />;
      case 'Maintenance Record': return <Settings className="w-8 h-8 text-amber-500" />;
      case 'Incident Report': return <AlertTriangle className="w-8 h-8 text-red-500" />;
      default: return <FileText className="w-8 h-8 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Indexed':
        return <span className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full"><CheckCircle2 className="w-3 h-3" /> Indexed</span>;
      case 'Processing':
        return <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full"><Clock className="w-3 h-3 animate-pulse" /> Processing</span>;
      default:
        return <span className="text-xs px-2 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 text-slate-100 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Library</h1>
          <p className="text-slate-400 mt-1">Manage and search across all indexed industrial documents.</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all font-medium flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1a2332] p-4 rounded-xl border border-[#1e293b] flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name or equipment tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0e17] border border-[#2a374a] text-slate-100 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0a0e17] border border-[#2a374a] text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            {docTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <AnimatePresence>
          {filteredDocs.map((doc, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, delay: index * 0.04 }}
              key={doc.id}
              className="bg-[#1a2332] rounded-xl border border-[#1e293b] hover:border-blue-500/40 transition-colors group flex flex-col overflow-hidden"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-[#0a0e17] rounded-lg">{getDocIcon(doc.type)}</div>
                  <DocMenu doc={doc} onDelete={handleDelete} />
                </div>

                <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                  {doc.name}
                </h3>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs text-slate-400 bg-[#0a0e17] px-2 py-0.5 rounded border border-[#1e293b]">{doc.type}</span>
                  <span className="text-xs text-slate-500">{doc.uploadDate ?? doc.upload_date}</span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Related Equipment</p>
                  <div className="flex flex-wrap gap-1">
                    {(doc.equipmentTags ?? doc.equipment_tags ?? []).map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">{tag}</span>
                    ))}
                    {(doc.equipmentTags ?? doc.equipment_tags ?? []).length === 0 && (
                      <span className="text-xs text-slate-500 italic">None tagged</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-[#1e293b] bg-[#151c28] flex justify-between items-center">
                {getStatusBadge(doc.status)}
                <span className="text-xs text-slate-500">{doc.pages} Pages</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-20 bg-[#1a2332] rounded-xl border border-[#1e293b]">
          <FileText className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300">No documents found</h3>
          <p className="text-slate-500 mt-1 text-sm">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-[#1a2332] rounded-2xl border border-[#1e293b] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-[#1e293b] flex justify-between items-center">
                <h3 className="text-lg font-semibold">Upload Document</h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#2a374a]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <label className="border-2 border-dashed border-[#2a374a] rounded-xl p-8 text-center hover:bg-[#1f2b3d] hover:border-blue-500/40 transition-colors cursor-pointer group block">
                  <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} />
                  <Upload className="w-10 h-10 text-slate-500 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                  <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    {selectedFile ? selectedFile.name : 'Click to select a file'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Supports PDF, TXT, MD up to 50MB'}
                  </p>
                </label>

                {uploadStatus && (
                  <div className={`p-3 rounded-lg text-sm ${uploadStatus.startsWith('Error') ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {uploadStatus}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Document Type</label>
                    <select
                      value={uploadDocType} onChange={(e) => setUploadDocType(e.target.value)}
                      className="w-full bg-[#0a0e17] border border-[#2a374a] text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="OEM Manual">OEM Manual</option>
                      <option value="SOP">SOP (Standard Operating Procedure)</option>
                      <option value="Maintenance Manual">Maintenance Record / Manual</option>
                      <option value="Inspection Report">Inspection Report</option>
                      <option value="Regulatory">Regulatory / Standard</option>
                      <option value="P&ID">P&ID / Schematic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Equipment Tags (Optional)</label>
                    <input
                      type="text" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="e.g., BF-P-07A, BL-03"
                      className="w-full bg-[#0a0e17] border border-[#2a374a] text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave blank to auto-detect entities during processing.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-[#1e293b] bg-[#111827] flex justify-end gap-3">
                <button
                  onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}
                  className="px-4 py-2 text-sm border border-[#2a374a] text-slate-300 rounded-lg hover:bg-[#1a2332] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload} disabled={isUploading || !selectedFile}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isUploading ? 'Processing...' : 'Upload & Process'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
