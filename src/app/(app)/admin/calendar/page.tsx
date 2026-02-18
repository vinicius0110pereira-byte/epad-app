import { CalendarView } from "@/components/calendar/calendar-view";
import { PageHeader } from "@/components/ui/page-header";
import { getCalendarFiltersData } from "@/services/calendar.service";

export default async function AdminCalendarPage() {
  const { patients, professionals } = await getCalendarFiltersData();

  return (
    <div>
      <PageHeader
        title="Calendário"
        description="Visualize e gerencie plantões por data"
      />

      <CalendarView
        patients={patients.map((p) => ({ id: p.id, label: p.fullName }))}
        professionals={professionals.map((p) => ({
          id: p.id,
          label: p.user.name ?? "Sem nome",
        }))}
      />
    </div>
  );
}
