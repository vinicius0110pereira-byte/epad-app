"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ShiftStatus } from "@/types";

interface Props {
  shiftId: string;
  status: ShiftStatus;
  isMyShift?: boolean;
}

export function ShiftActions({ shiftId, status, isMyShift }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  async function handleAssign() {
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${shiftId}/assign`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao aceitar");
        return;
      }
      toast.success("Plantão aceito com sucesso!");
      setConfirmAction(null);
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function handleTransition(toStatus: ShiftStatus, description: string, successMsg: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${shiftId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro na operação");
        return;
      }
      toast.success(successMsg);
      setConfirmAction(null);
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function requestConfirm(action: string) {
    setConfirmAction(action);
  }

  function executeAction() {
    switch (confirmAction) {
      case "accept":
        handleAssign();
        break;
      case "confirm":
        handleTransition("CONFIRMED", "Profissional confirmou presença", "Presença confirmada!");
        break;
      case "start":
        handleTransition("IN_PROGRESS", "Plantão iniciado", "Plantão iniciado!");
        break;
      case "complete":
        handleTransition("COMPLETED", "Plantão finalizado", "Plantão finalizado!");
        break;
    }
  }

  const CONFIRM_MESSAGES: Record<string, { title: string; desc: string }> = {
    accept: { title: "Aceitar este plantão?", desc: "Você será responsável por este atendimento." },
    confirm: { title: "Confirmar presença?", desc: "Confirma que estará presente no horário." },
    start: { title: "Iniciar o plantão?", desc: "O plantão será marcado como em andamento." },
    complete: { title: "Finalizar o plantão?", desc: "Esta ação não pode ser desfeita." },
  };

  return (
    <div>
      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-medium text-slate-900">
            {CONFIRM_MESSAGES[confirmAction]?.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            {CONFIRM_MESSAGES[confirmAction]?.desc}
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={executeAction}
              loading={loading}
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setConfirmAction(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {!confirmAction && (
        <div className="flex flex-wrap gap-2">
          {(status === "OPEN" || status === "URGENT_OPEN") && !isMyShift && (
            <Button size="sm" onClick={() => requestConfirm("accept")} loading={loading}>
              Aceitar Plantão
            </Button>
          )}
          {status === "ACCEPTED" && isMyShift && (
            <Button size="sm" onClick={() => requestConfirm("confirm")} loading={loading}>
              Confirmar Presença
            </Button>
          )}
          {status === "CONFIRMED" && isMyShift && (
            <Button size="sm" onClick={() => requestConfirm("start")} loading={loading}>
              Iniciar Plantão
            </Button>
          )}
          {status === "IN_PROGRESS" && isMyShift && (
            <Button size="sm" onClick={() => requestConfirm("complete")} loading={loading}>
              Finalizar Plantão
            </Button>
          )}
          {isMyShift && (
            <Link
              href={`/professional/shifts/${shiftId}`}
              className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Ver Detalhes
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
