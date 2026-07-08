"use client";

import React from 'react';
import FieldMode from '@/components/FieldMode';

export default function FieldPage() {
  return (
    <div className="w-full min-h-screen bg-slate-950 flex justify-center">
      <div className="w-full max-w-md bg-slate-950 border-x border-slate-800">
        <FieldMode />
      </div>
    </div>
  );
}
