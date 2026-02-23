interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: { value: number; positive: boolean };
  icon?: React.ReactNode;
  accent?: "blue" | "emerald" | "amber" | "red" | "purple" | "indigo";
}

const ACCENT_STYLES = {
  blue:    { bar: "bg-blue-500",    icon: "bg-blue-50 text-blue-700",    value: "text-blue-900" },
  emerald: { bar: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-700", value: "text-emerald-900" },
  amber:   { bar: "bg-amber-500",   icon: "bg-amber-50 text-amber-700",   value: "text-amber-900" },
  red:     { bar: "bg-red-500",     icon: "bg-red-50 text-red-700",       value: "text-red-900" },
  purple:  { bar: "bg-purple-500",  icon: "bg-purple-50 text-purple-700", value: "text-purple-900" },
  indigo:  { bar: "bg-indigo-500",  icon: "bg-indigo-50 text-indigo-700", value: "text-indigo-900" },
};

export function StatCard({ title, value, description, trend, icon, accent = "blue" }: StatCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Accent bar */}
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
            <p className={`mt-1.5 text-3xl font-bold ${styles.value}`}>{value}</p>
            {description && (
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
            {trend && (
              <p
                className={`mt-1 text-xs font-medium ${
                  trend.positive ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {trend.positive ? "▲" : "▼"} {Math.abs(trend.value)}% vs mês anterior
              </p>
            )}
          </div>
          {icon && (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
