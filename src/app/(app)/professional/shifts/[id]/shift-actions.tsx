"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ShiftStatus } from "@/types";

interface Props {
  shiftId: string;
  status: ShiftStatus;
}

const ACTIVE_STATUSES: ShiftStatus[] = [
  "ACCEPTED",
  "CONFIRMED",
  "IN_PROGRESS",
];

export function ProfessionalShiftActions({ shiftId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  async function handleTransition(
    toStatus: ShiftStatus,
    description: string,
    extra?: { cancelReason?: string },
  ) {
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${shiftId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, description, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro na operação");
        return;
      }
      const messages: Partial<Record<ShiftStatus, string>> = {
        CONFIRMED: "Presença confirmada",
        IN_PROGRESS: "Plantão iniciado",
        COMPLETED: "Plantão finalizado",
        CANCELLED: "Plantão cancelado",
      };
      toast.success(messages[toStatus] ?? `Status alterado para ${toStatus}`);
      setShowCancelModal(false);
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmCancel() {
    if (!cancelReason.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }
    handleTransition("CANCELLED", "Cancelado pelo profissional", {
      cancelReason: cancelReason.trim(),
    });
  }

  async function handleAlertAdmin() {
    if (!alertMessage.trim()) {
      toast.error("Escreva uma mensagem antes de enviar");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${shiftId}/alert-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: alertMessage.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao enviar aviso");
        return;
      }
      toast.success("Aviso enviado ao admin com sucesso");
      setShowAlertModal(false);
      setAlertMessage("");
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  const canCancel = ACTIVE_STATUSES.includes(status);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === "ACCEPTED" && (
          <Button
            onClick={() =>
              handleTransition("CONFIRMED", "Presença confirmada pelo profissional")
            }
            loading={loading}
          >
            Confirmar Presença
          </Button>
        )}
        {status === "CONFIRMED" && (
          <Button
            onClick={() =>
              handleTransition("IN_PROGRESS", "Plantão iniciado pelo profissional")
            }
            loading={loading}
          >
            Iniciar Plantão
          </Button>
        )}
        {status === "IN_PROGRESS" && (
          <Button
            onClick={() =>
              handleTransition("COMPLETED", "Plantão finalizado pelo profissional")
            }
            loading={loading}
          >
            Finalizar Plantão
          </Button>
        )}
        {status === "IN_PROGRESS" && (
          <Button
            variant="secondary"
            onClick={() => setShowAlertModal(true)}
            loading={loading}
          >
            Avisar Admin
          </Button>
        )}
        {canCancel && (
          <Button
            variant="danger"
            onClick={() => setShowCancelModal(true)}
            loading={loading}
          >
            Cancelar
          </Button>
        )}
      </div>

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Avisar Admin
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Descreva o que está acontecendo. A mensagem ficará registrada na timeline do plantão.
            </p>
            <textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder="Ex: Paciente recusou a medicação das 14h..."
              rows={4}
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAlertModal(false);
                  setAlertMessage("");
                }}
              >
                Voltar
              </Button>
              <Button
                size="sm"
                onClick={handleAlertAdmin}
                loading={loading}
              >
                Enviar Aviso
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Cancelar Plantão
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Informe o motivo do cancelamento.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo do cancelamento..."
              rows={3}
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
              >
                Voltar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancel}
                loading={loading}
              >
                Confirmar Cancelamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
