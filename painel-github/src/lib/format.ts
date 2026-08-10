/**
 * Tempo relativo em português, sem depender de Intl.RelativeTimeFormat
 * locale data extra — cobre os intervalos que aparecem na UI (última
 * atualização de repositório, commits).
 */
export function relativeTime(isoDate: string | null): string {
  if (!isoDate) return "nunca";

  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "agora mesmo";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `há ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `há ${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;
  const diffYears = Math.floor(diffMonths / 12);
  return `há ${diffYears} ano${diffYears === 1 ? "" : "s"}`;
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
