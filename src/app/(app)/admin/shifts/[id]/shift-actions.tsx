"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ShiftStatus } from "@/types";

interface DuplicateData {
  patientId: string;
  address: string;
  neighborhood: string | null;
  city: string | null;
  requiredProfessionalType: string;
  needs: string | null;
  value: number | null;
  isUrgent: boolean;
}

interface Props {
  shiftId: string;
  status: ShiftStatus;
  hasProfessional: boolean;
  startDateTime: string;
  endDateTime: string;
  duplicateData?: DuplicateData;
}

type DialogType = "cancel" | "unassign" | "reschedule" | "adjust-value" | "add-note" | "duplicate" | null;

export function AdminShiftActions({ shiftId, status, hasProfessional, startDateTime, endDateTime, duplicateData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [reason, setReason] = useState("");
  const [noteText, setNoteText] = useState("");
  const [newStart, setNewStart] = useState(startDateTime.slice(0, 16));
  const [newEnd, setNewEnd] = useState(endDateTime.slice(0, 16));
  const [adjustmentCents, setAdjustmentCents] = useState("");
  const [dupStart, setDupStart] = useState("");
  const [dupEnd, setDupEnd] = useState("");

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
      toast.success(
        toStatus === "CANCELLED"
          ? "Plantão cancelado"
          : toStatus === "COMPLETED"
            ? "Plantão finalizado"
            : toStatus === "CONFIRMED"
              ? "Plantão confirmado"
              : toStatus === "VERIFIED"
                ? "Plantão verificado"
                : toStatus === "NO_SHOW"
                  ? "Ausência registrada"
                  : `Status alterado para ${toStatus}`,
      );
      setDialog(null);
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminAction(endpoint: string, body: Record<string, unknown>, successMsg: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shifts/${shiftId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro na operação");
        return;
      }
      toast.success(successMsg);
      setDialog(null);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmCancel() {
    if (!reason.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }
    handleTransition("CANCELLED", "Cancelado pelo administrador", {
      cancelReason: reason.trim(),
    });
  }

  function handleConfirmUnassign() {
    if (!reason.trim()) {
      toast.error("Informe o motivo");
      return;
    }
    handleAdminAction("unassign", { reason: reason.trim() }, "Profissional removido do plantão");
  }

  function handleConfirmReschedule() {
    if (!reason.trim()) {
      toast.error("Informe o motivo");
      return;
    }
    if (!newStart || !newEnd) {
      toast.error("Informe as datas");
      return;
    }
    handleAdminAction("reschedule", {
      startDateTime: new Date(newStart).toISOString(),
      endDateTime: new Date(newEnd).toISOString(),
      reason: reason.trim(),
    }, "Plantão reagendado");
  }

  function handleConfirmAdjustValue() {
    if (!reason.trim()) {
      toast.error("Informe o motivo");
      return;
    }
    const cents = Math.round(parseFloat(adjustmentCents) * 100);
    if (isNaN(cents) || cents === 0) {
      toast.error("Informe um valor de ajuste válido");
      return;
    }
    handleAdminAction("adjust-value", {
      adjustmentsCents: cents,
      reason: reason.trim(),
    }, "Valor ajustado");
  }

  function handleConfirmAddNote() {
    if (!noteText.trim()) {
      toast.error("Informe a nota");
      return;
    }
    handleAdminAction("note", { note: noteText.trim() }, "Nota adicionada");
  }

  async function handleConfirmDuplicate() {
    if (!dupStart || !dupEnd) {
      toast.error("Informe as datas do novo plantão");
      return;
    }
    if (!duplicateData) return;
    setLoading(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: duplicateData.patientId,
          startDateTime: new Date(dupStart).toISOString(),
          endDateTime: new Date(dupEnd).toISOString(),
          requiredProfessionalType: duplicateData.requiredProfessionalType,
          address: duplicateData.address,
          neighborhood: duplicateData.neighborhood,
          city: duplicateData.city,
          needs: duplicateData.needs,
          value: duplicateData.value,
          isUrgent: duplicateData.isUrgent,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao duplicar plantão");
        return;
      }
      const data = await res.json();
      toast.success("Plantão duplicado com sucesso");
      setDialog(null);
      router.push(`/admin/shifts/${data.data.id}`);
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function handleFinalize() {
    const ok = confirm(
      "Tem certeza que deseja finalizar este plantão? Esta ação não pode ser desfeita.",
    );
    if (!ok) return;
    handleTransition("COMPLETED", "Plantão finalizado pelo admin");
  }

  function closeDialog() {
    setDialog(null);
    setReason("");
    setNoteText("");
    setAdjustmentCents("");
    setDupStart("");
    setDupEnd("");
  }

  const canCancel = ["OPEN", "OFFERED", "ASSIGNED", "ACCEPTED", "CONFIRMED", "IN_PROGRESS", "URGENT_OPEN"].includes(status);
  const canUnassign = hasProfessional && !["COMPLETED", "VERIFIED", "CANCELLED"].includes(status);
  const canReschedule = !["COMPLETED", "VERIFIED", "CANCELLED"].includes(status);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === "ACCEPTED" && (
          <Button
            size="sm"
            onClick={() => handleTransition("CONFIRMED", "Confirmado pelo administrador")}
            loading={loading}
          >
            Confirmar
          </Button>
        )}
        {status === "CONFIRMED" && (
          <Button
            size="sm"
            onClick={() => handleTransition("IN_PROGRESS", "Iniciado pelo administrador")}
            loading={loading}
          >
            Iniciar
          </Button>
        )}
        {status === "IN_PROGRESS" && (
          <>
            <Button size="sm" onClick={handleFinalize} loading={loading}>
              Finalizar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleTransition("NO_SHOW", "Ausência registrada pelo admin")}
              loading={loading}
            >
              No-Show
            </Button>
          </>
        )}
        {status === "COMPLETED" && (
          <Button
            size="sm"
            onClick={() => handleTransition("VERIFIED", "Verificado pelo admin")}
            loading={loading}
          >
            Verificar
          </Button>
        )}

        {canUnassign && (
          <Button size="sm" variant="secondary" onClick={() => setDialog("unassign")}>
            Desatribuir
          </Button>
        )}
        {canReschedule && (
          <Button size="sm" variant="secondary" onClick={() => setDialog("reschedule")}>
            Reagendar
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => setDialog("adjust-value")}>
          Ajustar Valor
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDialog("add-note")}>
          Nota
        </Button>
        {duplicateData && (
          <Button size="sm" variant="secondary" onClick={() => setDialog("duplicate")}>
            Duplicar
          </Button>
        )}

        {canCancel && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDialog("cancel")}
            loading={loading}
          >
            Cancelar
          </Button>
        )}
      </div>

      {/* Dialog */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            {dialog === "cancel" && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Cancelar Plantão</h3>
                <p className="mt-1 text-sm text-slate-500">Esta ação não pode ser desfeita. Informe o motivo.</p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo do cancelamento..."
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={closeDialog}>Voltar</Button>
                  <Button size="sm" variant="danger" onClick={handleConfirmCancel} loading={loading}>
                    Confirmar Cancelamento
                  </Button>
                </div>
              </>
            )}

            {dialog === "unassign" && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Desatribuir Profissional</h3>
                <p className="mt-1 text-sm text-slate-500">O profissional será removido e o plantão voltará a ficar aberto.</p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo da desatribuição..."
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={closeDialog}>Voltar</Button>
                  <Button size="sm" onClick={handleConfirmUnassign} loading={loading}>
                    Confirmar
                  </Button>
                </div>
              </>
            )}

            {dialog === "reschedule" && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Reagendar Plantão</h3>
                <p className="mt-1 text-sm text-slate-500">Defina as novas datas e informe o motivo.</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Início</label>
                    <input
                      type="datetime-local"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Término</label>
                    <input
                      type="datetime-local"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo do reagendamento..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={closeDialog}>Voltar</Button>
                  <Button size="sm" onClick={handleConfirmReschedule} loading={loading}>
                    Reagendar
                  </Button>
                </div>
              </>
            )}

            {dialog === "adjust-value" && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Ajustar Valor</h3>
                <p className="mt-1 text-sm text-slate-500">Informe o valor do ajuste em reais (positivo para acréscimo, negativo para desconto).</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Ajuste (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustmentCents}
                      onChange={(e) => setAdjustmentCents(e.target.value)}
                      placeholder="Ex: 50.00 ou -25.50"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo do ajuste..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={closeDialog}>Voltar</Button>
                  <Button size="sm" onClick={handleConfirmAdjustValue} loading={loading}>
                    Aplicar Ajuste
                  </Button>
                </div>
              </>
            )}

            {dialog === "add-note" && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Adicionar Nota</h3>
                <p className="mt-1 text-sm text-slate-500">Nota interna visível apenas para administradores.</p>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Escreva sua nota..."
                  rows={4}
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={closeDialog}>Voltar</Button>
                  <Button size="sm" onClick={handleConfirmAddNote} loading={loading}>
                    Salvar Nota
                  </Button>
                </div>
              </>
            )}

            {dialog === "duplicate" && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">Duplicar Plantão</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Um novo plantão será criado com os mesmos dados (paciente, endereço, tipo, valor). Defina as datas.
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Início</label>
                    <input
                      type="datetime-local"
                      value={dupStart}
                      onChange={(e) => setDupStart(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Término</label>
                    <input
                      type="datetime-local"
                      value={dupEnd}
                      onChange={(e) => setDupEnd(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={closeDialog}>Voltar</Button>
                  <Button size="sm" onClick={handleConfirmDuplicate} loading={loading}>
                    Duplicar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
