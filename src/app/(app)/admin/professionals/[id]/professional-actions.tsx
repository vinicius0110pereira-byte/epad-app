"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ProfessionalStatus } from "@/types";

interface Props {
  professionalId: string;
  currentStatus: ProfessionalStatus;
}

const STATUS_ACTIONS: Record<ProfessionalStatus, { label: string; target: ProfessionalStatus; variant: "primary" | "danger" | "secondary" }[]> = {
  ACTIVE: [
    { label: "Suspender", target: "SUSPENDED", variant: "danger" },
    { label: "Inativar", target: "INACTIVE", variant: "secondary" },
  ],
  INACTIVE: [
    { label: "Ativar", target: "ACTIVE", variant: "primary" },
  ],
  SUSPENDED: [
    { label: "Ativar", target: "ACTIVE", variant: "primary" },
    { label: "Inativar", target: "INACTIVE", variant: "secondary" },
  ],
  PENDING: [
    { label: "Aprovar (Ativar)", target: "ACTIVE", variant: "primary" },
    { label: "Rejeitar (Inativar)", target: "INACTIVE", variant: "danger" },
  ],
};

const STATUS_LABELS: Record<ProfessionalStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
  PENDING: "Pendente",
};

export function ProfessionalActions({ professionalId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ProfessionalStatus | null>(null);
  const [reason, setReason] = useState("");

  const actions = STATUS_ACTIONS[currentStatus] ?? [];

  function handleActionClick(target: ProfessionalStatus) {
    setTargetStatus(target);
    setShowDialog(true);
    setReason("");
  }

  async function handleConfirm() {
    if (!reason.trim()) {
      toast.error("Informe o motivo da alteração");
      return;
    }
    if (!targetStatus) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/professionals/${professionalId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro na operação");
        return;
      }
      toast.success(`Status alterado para ${STATUS_LABELS[targetStatus]}`);
      setShowDialog(false);
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.target}
            size="sm"
            variant={action.variant}
            onClick={() => handleActionClick(action.target)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Alterar status para {targetStatus ? STATUS_LABELS[targetStatus] : ""}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Informe o motivo desta alteração.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo da alteração..."
              rows={3}
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowDialog(false);
                  setReason("");
                  setTargetStatus(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                loading={loading}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
