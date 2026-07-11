'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { mockKnowledgeGraph } from '@/lib/mock-data';
import { Search, Filter, Maximize, ZoomIn, ZoomOut, Database, Settings, Activity, ShieldAlert, FileText, Users, ArrowLeft, AlertTriangle } from 'lucide-react';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function KnowledgeGraphPage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setIsClient(true);
    
    // Handle resize
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'Equipment': return '#3b82f6'; // Blue
      case 'Document': return '#10b981'; // Green
      case 'Incident': return '#ef4444'; // Red
      case 'Technician': return '#f59e0b'; // Amber
      case 'Regulation': return '#8b5cf6'; // Purple
      case 'FailureMode': return '#ec4899'; // Pink
      default: return '#94a3b8'; // Slate
    }
  };
  
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Equipment': return <Settings className="w-5 h-5 text-[#3b82f6]" />;
      case 'Document': return <FileText className="w-5 h-5 text-[#10b981]" />;
      case 'Incident': return <Activity className="w-5 h-5 text-[#ef4444]" />;
      case 'Technician': return <Users className="w-5 h-5 text-[#f59e0b]" />;
      case 'Regulation': return <ShieldAlert className="w-5 h-5 text-[#8b5cf6]" />;
      case 'FailureMode': return <AlertTriangle className="w-5 h-5 text-[#ec4899]" />;
      default: return <Database className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    if (fgRef.current) {
      // Center and zoom in on node
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2.5, 1000);
    }
  }, [fgRef]);

  // Filter graph data
  const graphData = useMemo(() => {
    let nodes = [...mockKnowledgeGraph.nodes];
    
    if (filter !== 'all') {
      nodes = nodes.filter(n => n.type === filter);
    }
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      nodes = nodes.filter(n => 
        n.label.toLowerCase().includes(lowerSearch) || 
        (n.properties?.tagId && n.properties.tagId.toLowerCase().includes(lowerSearch))
      );
    }
    
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = mockKnowledgeGraph.edges.filter(
      e => nodeIds.has(e.source as string) && nodeIds.has(e.target as string)
    );
    
    return { nodes, links };
  }, [filter, search]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col relative overflow-hidden bg-[#050810]">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        
        {/* Left Controls */}
        <div className="bg-[#1a2332]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e293b] shadow-xl pointer-events-auto space-y-4 w-72">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-500" />
              Knowledge Graph
            </h2>
            <p className="text-xs text-slate-400 mt-1">Explore relationships across {mockKnowledgeGraph.nodes.length} entities.</p>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search entities..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0e17] border border-[#2a374a] text-sm text-slate-100 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Entity Types</p>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'All Entities', color: 'bg-slate-500' },
                { id: 'Equipment', label: 'Equipment', color: 'bg-blue-500' },
                { id: 'Document', label: 'Documents', color: 'bg-emerald-500' },
                { id: 'Incident', label: 'Incidents', color: 'bg-red-500' },
                { id: 'Technician', label: 'Personnel', color: 'bg-amber-500' },
                { id: 'Regulation', label: 'Compliance', color: 'bg-purple-500' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilter(type.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors ${
                    filter === type.id ? 'bg-[#2a374a] text-white' : 'text-slate-400 hover:bg-[#1f2b3d] hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`w-2.5 h-2.5 rounded-full mr-2 ${type.color}`}></span>
                    {type.label}
                  </div>
                  <span className="text-xs text-slate-500">
                    {type.id === 'all' ? graphData.nodes.length : graphData.nodes.filter(n => n.type === type.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Controls (Zoom) */}
        <div className="bg-[#1a2332]/90 backdrop-blur-md rounded-lg border border-[#1e293b] shadow-xl pointer-events-auto flex flex-col overflow-hidden">
          <button 
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400)}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#2a374a] transition-colors border-b border-[#1e293b]"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button 
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400)}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#2a374a] transition-colors border-b border-[#1e293b]"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button 
            onClick={() => fgRef.current?.zoomToFit(400)}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#2a374a] transition-colors"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Entity Detail Side Panel */}
      {selectedNode && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#1a2332]/95 backdrop-blur-xl border-l border-[#1e293b] z-20 shadow-2xl overflow-y-auto transform transition-transform">
          <div className="p-4 border-b border-[#1e293b] sticky top-0 bg-[#1a2332] flex justify-between items-center">
            <h3 className="font-semibold text-slate-100 flex items-center">
              {getNodeIcon(selectedNode.type)}
              <span className="ml-2">Entity Details</span>
            </h3>
            <button 
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#2a374a]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-6">
            <div>
              <div className="inline-block px-2.5 py-1 rounded-full text-xs font-medium border mb-3" style={{ 
                borderColor: `${getNodeColor(selectedNode.type)}50`, 
                color: getNodeColor(selectedNode.type),
                backgroundColor: `${getNodeColor(selectedNode.type)}10` 
              }}>
                {selectedNode.type}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{selectedNode.label}</h2>
              {selectedNode.properties?.tagId && (
                <p className="text-slate-400 font-mono text-sm">{selectedNode.properties.tagId}</p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-[#1e293b] pb-2">Properties</h4>
              {selectedNode.properties && Object.entries(selectedNode.properties).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-slate-200">{String(value)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-[#1e293b] pb-2">Connections</h4>
              <div className="space-y-2">
                {graphData.links.filter(l => (l.source as any).id === selectedNode.id || (l.target as any).id === selectedNode.id || l.source === selectedNode.id || l.target === selectedNode.id).map((link, i) => {
                  const isSource = (link.source as any).id === selectedNode.id || link.source === selectedNode.id;
                  const otherNodeId = isSource ? ((link.target as any).id || link.target) : ((link.source as any).id || link.source);
                  const otherNode = graphData.nodes.find(n => n.id === otherNodeId);
                  
                  if (!otherNode) return null;
                  
                  return (
                    <div key={i} className="flex flex-col text-sm bg-[#111827] p-2 rounded border border-[#1e293b]">
                      <span className="text-xs text-slate-500 italic mb-1">{link.label || link.relationship || 'Related to'} {isSource ? '→' : '←'}</span>
                      <button 
                        onClick={() => handleNodeClick(otherNode)}
                        className="text-left font-medium text-blue-400 hover:text-blue-300"
                        style={{ color: getNodeColor(otherNode.type) }}
                      >
                        {otherNode.label}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graph Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair">
        {isClient && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="label"
            nodeColor={(node: any) => getNodeColor(node.type)}
            nodeRelSize={6}
            linkColor={() => 'rgba(30, 41, 59, 0.6)'}
            linkWidth={1.5}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            onNodeClick={handleNodeClick}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.label;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Inter, Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); 
              
              // Draw node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
              ctx.fillStyle = getNodeColor(node.type);
              ctx.fill();
              
              // Draw glow effect for selected node
              if (selectedNode && selectedNode.id === node.id) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }

              // Text background
              ctx.fillStyle = 'rgba(10, 14, 23, 0.8)';
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + 6, bckgDimensions[0], bckgDimensions[1]);
              
              // Text
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#e2e8f0';
              ctx.fillText(label, node.x, node.y + 6 + (bckgDimensions[1]/2));
            }}
          />
        )}
      </div>
    </div>
  );
}
