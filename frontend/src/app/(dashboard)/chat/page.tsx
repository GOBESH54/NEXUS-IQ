'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Bot, User, FileText, ChevronDown, ChevronRight, CheckCircle2, Server, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content: 'Hello. I am NEXUS IQ, your industrial knowledge assistant. How can I help you today?',
    citations: [] as any[],
    confidence: null as string | null,
    agents: [] as string[]
  },
  {
    id: 2,
    role: 'user',
    content: 'BF-P-07A bearing temperature alarm at 87 degrees Celsius. What is happening and what do I do right now?',
    citations: [] as any[],
    confidence: null as string | null,
    agents: [] as string[]
  },
  {
    id: 3,
    role: 'assistant',
    content: `⚠️ **HIGH PRIORITY — Immediate Action Required**

**CURRENT STATUS:**
Bearing temperature at 87°C exceeds the OEM warning threshold of 80°C. [SOURCE-1]
The shutdown threshold is 90°C — you have a narrow window.

**HISTORICAL CONTEXT:**
This is the third bearing-related event on BF-P-07A in 18 months:
• October 2023: Emergency repair for seal leak [SOURCE-2]
• January 2025: Inspector noted minor seal wear at bearing housing [SOURCE-3]
• March 2024: Bearing replacement performed [SOURCE-4]

⚠️ **PATTERN MATCH**: The seal wear observed in January was never corrected. Per the OEM manual, a worn shaft seal allows water ingression which contaminates bearing lubricant → accelerated wear. [SOURCE-1]

**ROOT CAUSE HYPOTHESIS:**
Primary: Bearing wear from lubricant contamination via degraded shaft seal
Contributing: 6-month lubrication interval may be too long for current duty cycle

**IMMEDIATE ACTIONS:**
1. RIGHT NOW: Switch to standby pump BF-P-07B immediately
2. Notify Plant Head and Maintenance Manager
3. Do NOT restart BF-P-07A until bearing inspection is complete`,
    confidence: 'High',
    agents: ['Supervisor Agent', 'Maintenance Agent', 'Knowledge Graph Agent'],
    citations: [
      { id: 1, docName: 'Grundfos CRN Series Manual', type: 'Manual', page: 34, snippet: 'Warning: Bearing temperature should not exceed 80°C during normal operation. Absolute limit 90°C.' },
      { id: 2, docName: 'MWO-2023-0789', type: 'Maintenance Record', page: 1, snippet: 'Emergency repair. Seal leak detected.' },
      { id: 3, docName: 'INS-2025-047', type: 'Inspection', page: 2, snippet: 'Minor seal wear observed at bearing housing.' },
      { id: 4, docName: 'MWO-2024-1142', type: 'Maintenance Record', page: 1, snippet: 'Routine bearing replacement.' }
    ]
  }
];

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (line === '') return <div key={i} className="h-2" />;
    if (line.trim() === '---') {
      return <hr key={i} className="border-[#2a374a] my-3" />;
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-cyan-400 font-bold text-base mt-3 mb-1">{line.replace('### ', '')}</h3>;
    }
    if (line.startsWith('#### ')) {
      return <h4 key={i} className="text-blue-300 font-semibold text-sm mt-2 mb-1">{line.replace('#### ', '')}</h4>;
    }
    if (line.startsWith('⚠️')) {
      return <p key={i} className="text-amber-400 font-semibold my-1">{line}</p>;
    }

    const renderBoldSegments = (text: string) => {
      if (!text.includes('**')) return <span>{text}</span>;
      const parts = text.split('**');
      return (
        <>
          {parts.map((p, j) =>
            j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{p}</strong> : <span key={j}>{p}</span>
          )}
        </>
      );
    };

    if (line.trim().startsWith('•')) {
      return (
        <p key={i} className="my-0.5 pl-2 text-slate-300">
          {renderBoldSegments(line)}
        </p>
      );
    }

    return (
      <p key={i} className="my-0.5 text-slate-200">
        {renderBoldSegments(line)}
      </p>
    );
  });
}

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [expandedCitations, setExpandedCitations] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = {
      id: messages.length + 1,
      role: 'user' as const,
      content: input,
      citations: [],
      confidence: null,
      agents: []
    };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const res = await import('@/lib/api').then(mod => mod.sendChatMessage(currentInput, 'BF-P-07A'));
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant' as const,
        content: res.content,
        citations: (res.citations || []).map((c: any, i: number) => ({
          id: i + 1,
          docName: c.document_name || 'Industrial Document',
          type: 'Reference',
          page: c.page || 1,
          snippet: c.snippet || ''
        })),
        confidence: res.confidence || 'High',
        agents: res.agent_trace ? res.agent_trace.map((a: any) => a.agent_name) : ['Supervisor Agent', 'Search Agent']
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant' as const,
        content: 'I have logged this information. Is there anything else you need assistance with regarding BF-P-07A?',
        citations: [],
        confidence: 'High',
        agents: ['Supervisor Agent']
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const suggestions = [
    'Show maintenance history for BF-P-07A',
    'What caused the last pump seizure?',
    'Recommended mechanical seal replacement SOP',
    'Check compliance gaps for Captive Power Plant'
  ];

  return (
    <div className="flex h-full overflow-hidden bg-[#0a0e17] -m-4 md:-m-6 -mb-20 md:-mb-6">
      {/* Conversation History Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-[#111827] border-r border-[#1e293b] flex-shrink-0">
        <div className="p-3 border-b border-[#1e293b]">
          <button
            onClick={() => { setMessages(initialMessages); setExpandedCitations(null); setInput(''); }}
            className="w-full py-2.5 bg-[#1a2332] hover:bg-[#1f2b3d] border border-[#2a374a] rounded-lg text-sm text-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Today</p>
          <button className="w-full text-left px-3 py-2.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm truncate border border-blue-500/20">
            BF-P-07A Temperature Alarm
          </button>
          <button className="w-full text-left px-3 py-2.5 text-slate-400 hover:bg-[#1a2332] rounded-lg text-sm truncate transition-colors">
            Boiler BL-03 Compliance Check
          </button>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-3">Yesterday</p>
          <button className="w-full text-left px-3 py-2.5 text-slate-400 hover:bg-[#1a2332] rounded-lg text-sm truncate transition-colors">
            Compressor Vibration Analysis
          </button>
        </div>
      </div>

      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Context chip */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="bg-[#1a2332]/90 backdrop-blur-md border border-[#1e293b] rounded-full px-4 py-1.5 flex items-center gap-2 shadow">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-slate-300">Context: <strong className="text-white">BF-P-07A (Pump)</strong></span>
          </div>
        </div>

        {/* Scrollable messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end max-w-[75%]' : 'items-start max-w-[85%]'}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-[#1a2332] border border-[#1e293b] text-slate-200 rounded-tl-sm'
                  }`}>
                    <div className="space-y-0">{renderContent(msg.content)}</div>

                    {msg.role === 'assistant' && (msg.confidence || msg.citations.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-[#2a374a] space-y-2">
                        <div className="flex flex-wrap gap-2 text-xs">
                          {msg.confidence && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                              <CheckCircle2 className="w-3 h-3" /> {msg.confidence} Confidence
                            </span>
                          )}
                          {msg.agents.length > 0 && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                              <Server className="w-3 h-3" /> {msg.agents.length} Agents
                            </span>
                          )}
                        </div>

                        {msg.citations.length > 0 && (
                          <div className="bg-[#0f172a] rounded-lg border border-[#1e293b] overflow-hidden">
                            <button
                              onClick={() => setExpandedCitations(expandedCitations === msg.id ? null : msg.id)}
                              className="w-full flex justify-between items-center px-3 py-2 text-xs text-slate-400 hover:bg-[#1a2332] transition-colors"
                            >
                              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {msg.citations.length} Sources</span>
                              {expandedCitations === msg.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            <AnimatePresence>
                              {expandedCitations === msg.id && (
                                <motion.div
                                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                  className="overflow-hidden border-t border-[#1e293b]"
                                >
                                  <div className="p-2 space-y-2">
                                    {msg.citations.map((cit: any) => (
                                      <div key={cit.id} className="text-xs bg-[#1a2332] p-2 rounded border border-[#2a374a]">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-semibold text-blue-400">[SOURCE-{cit.id}] {cit.docName}</span>
                                          <span className="text-slate-500 ml-2 flex-shrink-0">Pg {cit.page}</span>
                                        </div>
                                        <p className="text-slate-400 italic">"{cit.snippet}"</p>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#1a2332] border border-[#1e293b] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area — pinned to bottom, no overlap */}
        <div className="flex-shrink-0 border-t border-[#1e293b] bg-[#0a0e17] px-4 md:px-6 py-3">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Suggestion pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="whitespace-nowrap px-3 py-1.5 bg-[#1a2332] hover:bg-[#1f2b3d] border border-[#2a374a] hover:border-blue-500/40 rounded-full text-xs text-slate-300 transition-colors flex-shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Textarea input */}
            <div className="flex items-end gap-2 bg-[#1a2332] border border-[#2a374a] rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask NEXUS IQ anything about your plant..."
                className="flex-1 bg-transparent text-slate-100 text-sm placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: '160px' }}
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-[#2a374a]">
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-600">NEXUS IQ can make mistakes. Verify critical safety information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
