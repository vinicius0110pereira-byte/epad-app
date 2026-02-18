"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  beforeJson: string | null;
  afterJson: string | null;
}

export function AuditDiffViewer({ beforeJson, afterJson }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!beforeJson && !afterJson) return null;

  let before: Record<string, unknown> = {};
  let after: Record<string, unknown> = {};

  try {
    if (beforeJson) before = JSON.parse(beforeJson);
  } catch { /* ignore */ }
  try {
    if (afterJson) after = JSON.parse(afterJson);
  } catch { /* ignore */ }

  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const changes = allKeys.filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );

  if (changes.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
      >
        Ver diff
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                <th className="px-3 py-1.5 text-left font-semibold text-slate-600">Campo</th>
                <th className="px-3 py-1.5 text-left font-semibold text-red-600">Antes</th>
                <th className="px-3 py-1.5 text-left font-semibold text-green-600">Depois</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((key) => (
                <tr key={key} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-1.5 font-medium text-slate-700">{key}</td>
                  <td className="px-3 py-1.5 text-red-700 bg-red-50/50">
                    {formatValue(before[key])}
                  </td>
                  <td className="px-3 py-1.5 text-green-700 bg-green-50/50">
                    {formatValue(after[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val;
  return JSON.stringify(val);
}
