/* ────────────────────────────────────────────────────────────── */
/*  Dashboard formatting helpers                                  */
/* ────────────────────────────────────────────────────────────── */

const ptBrNumber = new Intl.NumberFormat("pt-BR");

export function formatNumber(value: number): string {
    return ptBrNumber.format(value);
}

export function formatPercent(value: number): string {
    if (!Number.isFinite(value)) return "—";
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatRelative(dateIso: string): string {
    const diff = Date.now() - new Date(dateIso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} h`;
    const days = Math.floor(hours / 24);
    return `há ${days} d`;
}
