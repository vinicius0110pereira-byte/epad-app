import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, SectionCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, ClipboardList, TrendingUp, Settings2 } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getDateRange(period: string, from?: string, to?: string) {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  if (from && to) {
    start = new Date(from);
    end = new Date(to);
    end.setHours(23, 59, 59, 999);
  } else {
    switch (period) {
      case "week":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "month":
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
  }

  return { start, end };
}

const PERIOD_OPTIONS = [
  { value: "week", label: "7 dias" },
  { value: "month", label: "30 dias" },
  { value: "year", label: "12 meses" },
];

export default async function AdminReportsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const period = typeof params.period === "string" ? params.period : "month";
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;

  const { start, end } = getDateRange(period, from, to);

  const shifts = await prisma.shift.findMany({
    where: {
      status: { in: ["COMPLETED", "VERIFIED"] },
      startDateTime: { gte: start, lte: end },
    },
    select: {
      id: true,
      value: true,
      totalValueCents: true,
      adjustmentsCents: true,
      patient: { select: { id: true, fullName: true } },
      professional: {
        select: { id: true, user: { select: { name: true } } },
      },
    },
    take: 1000,
  });

  // KPIs
  let totalRevenue = 0;
  let totalAdjustments = 0;

  for (const s of shifts) {
    const val = s.totalValueCents ?? s.value ?? 0;
    totalRevenue += val;
    totalAdjustments += s.adjustmentsCents ?? 0;
  }

  const avgTicket = shifts.length > 0 ? Math.round(totalRevenue / shifts.length) : 0;

  // Group by professional
  const byProfessional = new Map<
    string,
    { id: string; name: string; count: number; total: number }
  >();

  for (const s of shifts) {
    if (!s.professional) continue;
    const key = s.professional.id;
    const existing = byProfessional.get(key);
    const val = s.totalValueCents ?? s.value ?? 0;
    if (existing) {
      existing.count++;
      existing.total += val;
    } else {
      byProfessional.set(key, {
        id: key,
        name: s.professional.user.name || "Sem nome",
        count: 1,
        total: val,
      });
    }
  }

  const professionalRows = [...byProfessional.values()].sort(
    (a, b) => b.total - a.total,
  );

  // Group by patient
  const byPatient = new Map<
    string,
    { id: string; name: string; count: number; total: number }
  >();

  for (const s of shifts) {
    const key = s.patient.id;
    const existing = byPatient.get(key);
    const val = s.totalValueCents ?? s.value ?? 0;
    if (existing) {
      existing.count++;
      existing.total += val;
    } else {
      byPatient.set(key, {
        id: key,
        name: s.patient.fullName,
        count: 1,
        total: val,
      });
    }
  }

  const patientRows = [...byPatient.values()].sort(
    (a, b) => b.total - a.total,
  );

  const activePeriod = from && to ? "custom" : period;

  return (
    <div>
      <PageHeader
        title="Relatórios Financeiros"
        description={`${shifts.length} plantão(ões) concluído(s) no período`}
      />

      {/* Period selector */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/reports?period=${opt.value}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activePeriod === opt.value
                ? "bg-blue-800 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </Link>
        ))}

        {/* Custom date form */}
        <form className="ml-auto flex items-center gap-2">
          <input
            name="from"
            type="date"
            defaultValue={from}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-400">até</span>
          <input
            name="to"
            type="date"
            defaultValue={to}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-800 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Faturado"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatCard
          title="Plantões"
          value={shifts.length}
          icon={<ClipboardList className="h-6 w-6" />}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(avgTicket)}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatCard
          title="Ajustes"
          value={formatCurrency(totalAdjustments)}
          description={
            totalAdjustments > 0
              ? "acréscimos"
              : totalAdjustments < 0
                ? "descontos"
                : "sem ajustes"
          }
          icon={<Settings2 className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Professional */}
        <SectionCard
          title="Por Profissional"
          description={`${professionalRows.length} profissional(is)`}
        >
          {professionalRows.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum dado no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 text-left font-medium text-slate-500">
                      Profissional
                    </th>
                    <th className="pb-2 text-right font-medium text-slate-500">
                      Qty
                    </th>
                    <th className="pb-2 text-right font-medium text-slate-500">
                      Total
                    </th>
                    <th className="pb-2 text-right font-medium text-slate-500">
                      Média
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {professionalRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-2 font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="py-2 text-right text-slate-600">
                        {row.count}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        {formatCurrency(row.total)}
                      </td>
                      <td className="py-2 text-right text-slate-600">
                        {formatCurrency(
                          row.count > 0 ? Math.round(row.total / row.count) : 0,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* By Patient */}
        <SectionCard
          title="Por Paciente"
          description={`${patientRows.length} paciente(s)`}
        >
          {patientRows.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum dado no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 text-left font-medium text-slate-500">
                      Paciente
                    </th>
                    <th className="pb-2 text-right font-medium text-slate-500">
                      Qty
                    </th>
                    <th className="pb-2 text-right font-medium text-slate-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {patientRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-2 font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="py-2 text-right text-slate-600">
                        {row.count}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        {formatCurrency(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
