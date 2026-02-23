/**
 * Shared formatting helpers for the Tickets feature.
 *
 * Keep pure — no React, no side effects.
 */
import { getTodayLocalISODate } from "@/utils/date";

/* ── CPF ──────────────────────────────────────────────────── */

export function formatCpf(digits: string) {
    const clean = digits.replace(/\D/g, "").slice(0, 11);
    const p1 = clean.slice(0, 3);
    const p2 = clean.slice(3, 6);
    const p3 = clean.slice(6, 9);
    const p4 = clean.slice(9, 11);
    if (!clean) return "";
    if (clean.length <= 3) return p1;
    if (clean.length <= 6) return `${p1}.${p2}`;
    if (clean.length <= 9) return `${p1}.${p2}.${p3}`;
    return `${p1}.${p2}.${p3}-${p4}`;
}

export function maskCpf(digits: string) {
    if (digits.length !== 11) return digits;
    return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

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
