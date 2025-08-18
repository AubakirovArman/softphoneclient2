"use client";
import React from 'react';

type Tab = { id: string; label: string };

export function Tabs({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 border-b border-gray-200 mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`px-4 py-2 text-sm rounded-t-lg border-b-2 -mb-px transition-colors ${
            active === t.id
              ? 'border-black text-black font-medium'
              : 'border-transparent text-black/70 hover:text-black hover:border-gray-300'
          }`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}