"use client";

import Link from "next/link";
import { Clock, MapPin, User, AlertTriangle, Zap } from "lucide-react";
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
  const location = [address, neighborhood, city].filter(Boolean).join(", ");

  const content = (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-white transition-all hover:shadow-md ${
        isUrgent
          ? "border-red-200 hover:border-red-300 hover:shadow-red-100/60"
          : "border-slate-200 hover:border-blue-200 hover:shadow-blue-100/40"
      } ${compact ? "p-3" : "p-4"}`}
    >
      {/* Urgent accent stripe */}
      {isUrgent && (
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-red-400 to-red-600" />
      )}

      <div className={`flex items-start justify-between gap-3 ${isUrgent ? "pl-2" : ""}`}>
        <div className="min-w-0 flex-1">
          {/* Patient name + urgent badge */}
          <div className="flex items-center gap-2">
            <p
              className={`font-semibold text-slate-900 truncate ${
                compact ? "text-sm" : "text-base"
              }`}
            >
              {patientName}
            </p>
            {isUrgent && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                <Zap className="h-2.5 w-2.5" />
                Urgente
              </span>
            )}
          </div>

          {/* Time */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {formatDateTime(startDateTime)} — {formatDateTime(endDateTime)}
            </span>
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate max-w-[200px]">{location}</span>
              </span>
            )}
          </div>

          {/* Professional */}
          {professionalName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
              <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {professionalName}
            </p>
          )}

          {/* Needs */}
          {!compact && needs && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">{needs}</p>
          )}
        </div>

        {/* Right: status + value */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge status={status} />
          {value != null && value > 0 && (
            <span className="text-xs font-semibold text-slate-700">
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
