import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildUrl: (page: number) => string;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}

export function Pagination({ currentPage, totalPages, buildUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  const navBtn =
    "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-none";
  const disabledBtn =
    "inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-300 cursor-not-allowed select-none";

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Paginação">
      {currentPage > 1 ? (
        <Link href={buildUrl(currentPage - 1)} className={navBtn}>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Link>
      ) : (
        <span className={disabledBtn}>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="flex h-9 w-6 items-center justify-center text-sm text-slate-400">
              ···
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-gradient-to-b from-blue-700 to-blue-900 px-3 text-sm font-semibold text-white shadow-sm"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildUrl(p)}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-none"
            >
              {p}
            </Link>
          ),
        )}
      </div>

      {currentPage < totalPages ? (
        <Link href={buildUrl(currentPage + 1)} className={navBtn}>
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={disabledBtn}>
          Próximo
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
