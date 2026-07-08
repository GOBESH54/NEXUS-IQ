"use client";

import React, { useState } from 'react';

export default function FieldMode() {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedData({
        tag: "BF-P-07A",
        name: "Cooling Water Centrifugal Pump",
        status: "Running",
        lastMaintenance: "2026-05-12",
        activeAlerts: 1
      });
    }, 1500);
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-slate-950 text-white flex flex-col p-4 md:p-6 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">NEXUS IQ™ Field Mode</h1>
          <p className="text-xs text-slate-400">QR Asset Scanner & On-Site Diagnostics</p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full transition-colors" title="Voice Assistant">
          🎤
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center">
        {!scannedData ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className={`w-64 h-64 border-4 border-dashed rounded-xl flex items-center justify-center mb-8 ${scanning ? 'border-blue-500 animate-pulse' : 'border-slate-600'}`}>
              <span className="text-4xl">📷</span>
            </div>
            <button 
              onClick={simulateScan}
              disabled={scanning}
              className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-lg"
            >
              {scanning ? 'Scanning...' : 'Scan Equipment QR'}
            </button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
              <h2 className="text-2xl font-bold text-blue-400">{scannedData.tag}</h2>
              <p className="text-slate-300">{scannedData.name}</p>
              <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-emerald-900 text-emerald-400 rounded-full text-sm font-semibold">{scannedData.status}</span>
                {scannedData.activeAlerts > 0 && (
                  <span className="px-3 py-1 bg-red-900 text-red-400 rounded-full text-sm font-semibold">{scannedData.activeAlerts} Alert</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="bg-slate-800 p-4 rounded-xl flex flex-col items-center gap-2">
                <span className="text-2xl">📄</span>
                <span>Manuals</span>
              </button>
              <button className="bg-slate-800 p-4 rounded-xl flex flex-col items-center gap-2">
                <span className="text-2xl">🔧</span>
                <span>History</span>
              </button>
              <button className="bg-slate-800 p-4 rounded-xl flex flex-col items-center gap-2">
                <span className="text-2xl">🕸️</span>
                <span>Graph</span>
              </button>
              <button className="bg-slate-800 p-4 rounded-xl flex flex-col items-center gap-2">
                <span className="text-2xl">💬</span>
                <span>Ask AI</span>
              </button>
            </div>
            
            <button 
              onClick={() => setScannedData(null)}
              className="w-full bg-slate-800 py-3 rounded-xl mt-4"
            >
              Scan Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
