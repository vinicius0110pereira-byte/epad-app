import { type ShiftStatus } from "@/types";
import { shiftStatusLabel, shiftStatusColor } from "@/lib/utils";

interface BadgeProps {
  status: ShiftStatus;
}

export function StatusBadge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${shiftStatusColor(status)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 shrink-0" />
      {shiftStatusLabel(status)}
    </span>
  );
}
