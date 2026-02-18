"use client";

import Link from "next/link";
import { Clock, MapPin, User, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import type { ShiftStatus } from "@/types";
import { formatDateTime, formatCurrency } from "@/lib/utils";

interface ShiftCardProps {
  id: string;
  patientName: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  status: ShiftStatus;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  professionalName?: string | null;
  value?: number | null;
  isUrgent?: boolean;
  needs?: string | null;
  compact?: boolean;
  href?: string;
}

export function ShiftCard({
  id,
  patientName,
  startDateTime,
  endDateTime,
  status,
  address,
  neighborhood,
  city,
  professionalName,
  value,
  isUrgent,
  needs,
  compact = false,
  href,
}: ShiftCardProps) {
  const content = (
    <div
      className={`group rounded-xl border bg-white transition-all hover:border-blue-200 hover:shadow-md ${
        isUrgent ? "border-l-4 border-l-red-500 border-t-slate-200 border-r-slate-200 border-b-slate-200" : "border-slate-200"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-slate-900 truncate ${compact ? "text-sm" : "text-base"}`}>
              {patientName}
            </p>
            {isUrgent && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Urgente
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDateTime(startDateTime)} — {formatDateTime(endDateTime)}
            </span>
            {address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {address}
                {neighborhood ? `, ${neighborhood}` : ""}
              </span>
            )}
          </div>

          {professionalName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
              <User className="h-3.5 w-3.5" />
              {professionalName}
            </p>
          )}

          {!compact && needs && (
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">{needs}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={status} />
          {value != null && value > 0 && (
            <span className="text-xs font-medium text-slate-600">
              {formatCurrency(value)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
