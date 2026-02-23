import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, SectionCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { ShiftStatus } from "@/types";
import { DollarSign, ClipboardList, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProfessionalEarningsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROFESSIONAL") redirect("/login");

  const profileId = session.user.professionalProfileId;
  if (!profileId) redirect("/login");

  const params = await searchParams;
  const period = typeof params.period === "string" ? params.period : "month";

  const now = new Date();
  let start: Date;
  switch (period) {
    case "week":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const [completedShifts, allTimeAgg] = await Promise.all([
    prisma.shift.findMany({
      where: {
        professionalId: profileId,
        status: { in: ["COMPLETED", "VERIFIED"] },
        startDateTime: { gte: start },
      },
      select: {
        id: true,
        startDateTime: true,
        status: true,
        value: true,
        totalValueCents: true,
        patient: { select: { fullName: true } },
      },
      orderBy: { startDateTime: "desc" },
      take: 200,
    }),
    prisma.shift.aggregate({
      where: {
        professionalId: profileId,
        status: { in: ["COMPLETED", "VERIFIED"] },
      },
      _sum: { value: true, totalValueCents: true },
      _count: true,
    }),
  ]);

  let periodTotal = 0;
  for (const s of completedShifts) {
    periodTotal += s.totalValueCents ?? s.value ?? 0;
  }

  const allTimeTotal = (allTimeAgg._sum.totalValueCents ?? allTimeAgg._sum.value) ?? 0;

  const avgTicket = completedShifts.length > 0
    ? Math.round(periodTotal / completedShifts.length)
    : 0;

  const PERIOD_OPTIONS = [
    { value: "week", label: "7 dias" },
    { value: "month", label: "30 dias" },
    { value: "year", label: "12 meses" },
  ];

  return (
    <div>
      <PageHeader title="Meus Ganhos" description="Resumo financeiro dos seus plantões" />

      {/* Period selector */}
      <div className="mb-6 flex gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/professional/earnings?period=${opt.value}`}
            className={`rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all ${
              period === opt.value
                ? "bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-blue-800/25"
                : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ganho no período"
          value={formatCurrency(periodTotal)}
          icon={<DollarSign className="h-6 w-6" />}
          accent="emerald"
        />
        <StatCard
          title="Plantões no período"
          value={completedShifts.length}
          icon={<ClipboardList className="h-6 w-6" />}
          accent="blue"
        />
        <StatCard
          title="Ticket médio"
          value={formatCurrency(avgTicket)}
          icon={<TrendingUp className="h-6 w-6" />}
          accent="indigo"
        />
        <StatCard
          title="Ganho total (histórico)"
          value={formatCurrency(allTimeTotal)}
          icon={<Calendar className="h-6 w-6" />}
          accent="purple"
        />
      </div>

      {/* Shift list */}
      <SectionCard
        title="Plantões Concluídos"
        description={`${completedShifts.length} no período`}
      >
        {completedShifts.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum plantão concluído neste período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-2 text-left font-medium text-slate-500">Paciente</th>
                  <th className="pb-2 text-left font-medium text-slate-500">Data</th>
                  <th className="pb-2 text-right font-medium text-slate-500">Valor</th>
                  <th className="pb-2 text-right font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedShifts.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-slate-900">
                      <Link href={`/professional/shifts/${s.id}`} className="hover:text-blue-700">
                        {s.patient.fullName}
                      </Link>
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {formatDateTime(s.startDateTime)}
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-900">
                      {(s.totalValueCents ?? s.value) != null
                        ? formatCurrency(s.totalValueCents ?? s.value ?? 0)
                        : "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      <StatusBadge status={s.status as ShiftStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
