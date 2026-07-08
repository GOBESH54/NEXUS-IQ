"use client";

import React, { useState } from 'react';

export default function TribalKnowledgeCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [equipmentTag, setEquipmentTag] = useState('');

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      // In a real app, stop MediaRecorder and send blob to Whisper API
      setTranscript("This pump typically overheats during summer if the ambient temp crosses 40°C. We usually increase the cooling water flow rate by 15% to compensate.");
    } else {
      setIsRecording(true);
      setTranscript('');
    }
  };

  const handleSubmit = () => {
    if (!transcript || !equipmentTag) return;
    alert(`Tribal knowledge saved for ${equipmentTag} and added to the Knowledge Graph!`);
    setTranscript('');
    setEquipmentTag('');
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 text-white max-w-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🎙️</span> Tribal Knowledge Capture
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Record operational insights or "quirks" about specific equipment to preserve institutional knowledge.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Equipment Tag</label>
          <input 
            type="text" 
            placeholder="e.g. BF-P-07A"
            value={equipmentTag}
            onChange={(e) => setEquipmentTag(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white"
          />
        </div>

        <button 
          onClick={handleRecordToggle}
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
        </button>

        {transcript && (
          <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Transcribed Insight:</h3>
            <p className="text-slate-100 text-sm italic">"{transcript}"</p>
            <button 
              onClick={handleSubmit}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg font-semibold"
            >
              Inject into Knowledge Graph
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
