/**
 * Zod validation schemas for all server actions.
 *
 * Each schema validates input at the boundary of a server action,
 * producing user-friendly Portuguese error messages.
 */

import { z } from "zod";
import {
    MOTIVOS_OPTIONS,
    PRIORIDADES_OPTIONS,
    MOTIVO_STATUS_OPTIONS,
    AREA_ATUACAO_OPTIONS,
    USO_PLATAFORMA_OPTIONS,
} from "@/app/tickets/constants";

/* ── CPF checksum validation ─────────────────────────────── */

function isValidCpfChecksum(cpf: string): boolean {
    // All same digits are invalid
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // First check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i], 10) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf[9], 10)) return false;

    // Second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i], 10) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf[10], 10)) return false;

    return true;
}

/* ── Base schemas ────────────────────────────────────────── */

export const cpfSchema = z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11, { message: "CPF deve conter 11 dígitos." })
    .refine(isValidCpfChecksum, { message: "CPF inválido (dígito verificador incorreto)." });

export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: "E-mail inválido.",
    });

export const optionalEmailSchema = z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim().toLowerCase() : null))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: "E-mail inválido.",
    });

const nonEmptyText = (field: string) =>
    z.string().trim().min(1, { message: `${field} é obrigatório.` });

const limitedText = (field: string, max: number) =>
    z
        .string()
        .trim()
        .max(max, { message: `${field} deve ter no máximo ${max} caracteres.` });

/* ── Action schemas ──────────────────────────────────────── */

export const createTicketSchema = z
    .object({
        motivo: z.enum(MOTIVOS_OPTIONS, { message: "Motivo inválido." }),
        prioridade: z.enum(PRIORIDADES_OPTIONS, { message: "Prioridade inválida." }),
        data_atendimento: z.string().trim().optional().default(""),
        retroativo_motivo: z.string().trim().optional().default(""),
        cliente_nome: nonEmptyText("Nome do cliente"),
        cliente_cpf: cpfSchema,
        cliente_email: optionalEmailSchema,
        cliente_cidade: nonEmptyText("Cidade"),
        cliente_estado: z
            .string()
            .trim()
            .transform((v) => v.toUpperCase())
            .refine((v) => v.length === 2, { message: "UF deve conter 2 letras." }),
        area_atuacao: z.enum(AREA_ATUACAO_OPTIONS, { message: "Área de atuação inválida." }),
        uso_plataforma: z.enum(USO_PLATAFORMA_OPTIONS).optional().nullable(),
        unidade: z.string().trim().optional().default(""),
        motivo_outro_descricao: z.string().trim().optional().default(""),
    })
    .refine(
        (data) => data.motivo !== "Outro" || data.motivo_outro_descricao.length > 0,
        { message: "Descreva o motivo quando selecionar 'Outro'.", path: ["motivo_outro_descricao"] },
    );

export const updateTicketSchema = z.object({
    ticket_id: z.coerce.number().int().positive({ message: "Ticket inválido." }),
    motivo: z.enum(MOTIVOS_OPTIONS, { message: "Motivo inválido." }),
    prioridade: z.enum(PRIORIDADES_OPTIONS, { message: "Prioridade inválida." }),
    data_atendimento: z.string().trim().optional().default(""),
    retroativo_motivo: z.string().trim().optional().default(""),
    uso_plataforma: z.enum(USO_PLATAFORMA_OPTIONS).optional().nullable(),
    unidade: z.string().trim().optional().default(""),
    motivo_outro_descricao: z.string().trim().optional().default(""),
});

export const addMotivoSchema = z
    .object({
        ticket_id: z.coerce.number().int().optional(),
        client_id: z.coerce.number().int().positive({ message: "Cliente obrigatório." }),
        motivo: z.enum(MOTIVOS_OPTIONS, { message: "Motivo inválido." }),
        prioridade: z.enum(PRIORIDADES_OPTIONS, { message: "Prioridade inválida." }),
        unidade: z.string().trim().optional().default(""),
        uso_plataforma: z.string().trim().optional().default(""),
        motivo_outro_descricao: z.string().trim().optional().default(""),
    })
    .refine(
        (data) => data.motivo !== "Outro" || data.motivo_outro_descricao.length > 0,
        { message: "Descreva o motivo quando selecionar 'Outro'.", path: ["motivo_outro_descricao"] },
    );

export const updateMotivoStatusSchema = z.object({
    motivo_id: z.coerce.number().int().positive({ message: "Motivo inválido." }),
    ticket_id: z.coerce.number().int().optional(),
    status: z.enum(MOTIVO_STATUS_OPTIONS, { message: "Status inválido." }),
});

export const lookupClientSchema = z
    .object({
        cpf: z
            .string()
            .optional()
            .nullable()
            .transform((v) => (v ? v.replace(/\D/g, "").slice(0, 11) : null)),
        email: z
            .string()
            .optional()
            .nullable()
            .transform((v) => (v ? v.trim().toLowerCase().slice(0, 254) : null)),
        nome: limitedText("Nome", 120).optional().nullable(),
    })
    .refine(
        (data) => data.cpf || data.email || data.nome,
        { message: "Informe ao menos um campo de busca (CPF, e-mail ou nome)." },
    );

export const upsertClientSchema = z.object({
    cpf: cpfSchema,
    nome: nonEmptyText("Nome"),
    cidade: nonEmptyText("Cidade"),
    estado_uf: z
        .string()
        .trim()
        .transform((v) => v.toUpperCase())
        .refine((v) => v.length === 2, { message: "UF deve conter 2 letras." }),
    uso_plataforma: z.enum(USO_PLATAFORMA_OPTIONS).optional().nullable(),
    area_atuacao: z.enum(AREA_ATUACAO_OPTIONS).optional().nullable(),
    unidade: z.string().trim().optional().nullable(),
    email: optionalEmailSchema,
});

/* ── FormData helper ─────────────────────────────────────── */

/**
 * Extract all non-empty string values from a FormData object.
 * Returns a plain Record<string, string>.
 */
export function formDataToRecord(formData: FormData): Record<string, string> {
    const record: Record<string, string> = {};
    formData.forEach((value, key) => {
        if (typeof value === "string") {
            record[key] = value;
        }
    });
    return record;
}
