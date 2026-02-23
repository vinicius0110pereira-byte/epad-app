"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshProps {
  /** Intervalo em milissegundos (padrão: 20000 = 20s) */
  intervalMs?: number;
}

/**
 * Componente invisível que re-executa os Server Components da página
 * automaticamente no intervalo definido. Mantém os dados sempre atualizados
 * sem precisar recarregar a página manualmente.
 */
export function AutoRefresh({ intervalMs = 20_000 }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
