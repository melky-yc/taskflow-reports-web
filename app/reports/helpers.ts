/**
 * Shared formatting helpers for the Reports feature.
 *
 * Keep pure — no React, no side effects.
 */
import type { AppBadgeTone } from "@/app/ui/badge";

/* ── String padding ───────────────────────────────────── */

export function pad(value: number) {
    return String(value).padStart(2, "0");
}

/* ── Date formatting ──────────────────────────────────── */

export function formatDateBrFromDate(date: Date) {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatMonthYear(date: Date) {
    return `${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function toIsoDate(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* ── Input masks ──────────────────────────────────────── */

export function maskDateInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    let result = day;
    if (digits.length > 2) result += `/${month}`;
    if (digits.length > 4) result += `/${year}`;
    return result;
}

export function maskMonthInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    const month = digits.slice(0, 2);
    const year = digits.slice(2, 6);
    let result = month;
    if (digits.length > 2) result += `/${year}`;
    return result;
}

/* ── Date parsing ─────────────────────────────────────── */

export function parseBrDate(value: string) {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }
    return date;
}

export function parseMonthYear(value: string) {
    const match = value.match(/^(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const month = Number(match[1]);
    const year = Number(match[2]);
    if (month < 1 || month > 12 || year < 1900) return null;
    return { month, year };
}

export function parseYear(value: string) {
    const year = Number(value);
    if (!year || value.length !== 4) return null;
    return year;
}

/* ── Filename ─────────────────────────────────────────── */

export function buildFilename(periodLabel: string, extension: "csv" | "xlsx" | "pdf") {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate(),
    )}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const slug = periodLabel
        .normalize("NFD")
        .replace(/[`\-?]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    return `relatorio_${stamp}_${slug}.${extension}`;
}

/* ── Priority tone mapper ─────────────────────────────── */

const PRIORITY_TONE_MAP: Record<string, AppBadgeTone> = {
    Baixa: "default",
    Media: "warning",
    Alta: "danger",
    Critica: "critical",
};

export function priorityTone(label: string): AppBadgeTone {
    return PRIORITY_TONE_MAP[label] ?? "default";
}
