import { type ShiftStatus } from "@/types";
import { shiftStatusLabel, shiftStatusColor } from "@/lib/utils";

interface BadgeProps {
  status: ShiftStatus;
}

export function StatusBadge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${shiftStatusColor(status)}`}
    >
      {shiftStatusLabel(status)}
    </span>
  );
}
