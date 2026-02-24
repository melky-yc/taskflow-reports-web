/**
 * Shared formatting helpers for the Tickets feature.
 *
 * Keep pure — no React, no side effects.
 */
import { formatCPF, maskCPF } from "@/utils/cpf";
import { getTodayLocalISODate } from "@/utils/date";

/* ── CPF ──────────────────────────────────────────────────── */

// Backwards-compatible aliases that keep old imports working.
export const formatCpf = (digits: string) => formatCPF(digits);
export const maskCpf = (digits: string) => maskCPF(digits);
export { formatCPF, maskCPF };

/* ── Date / Time ──────────────────────────────────────────── */

export function parseDateOnly(value: string) {
    return new Date(`${value}T00:00:00`);
}

export function formatDate(value?: string | null) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("pt-BR").format(parseDateOnly(value));
}

export function formatDateTime(value?: string | null) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}

export function isoToBr(value?: string | null) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "";
    return `${day}/${month}/${year}`;
}

export function isRetroativoIso(dateValue: string) {
    if (!dateValue) return false;
    return dateValue < getTodayLocalISODate();
}

/* ── Motivo ───────────────────────────────────────────────── */

export function motivoTone(motivo: string) {
    if (motivo === "Outro") return "warning" as const;
    if (motivo.includes("Problema")) return "default" as const;
    return "success" as const;
}
