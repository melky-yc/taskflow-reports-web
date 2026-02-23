/**
 * Standardized Result type for all server actions and API responses.
 *
 * Usage:
 *   return success({ ticket_id: 123 });
 *   return failure("CPF_INVALID", "CPF deve conter 11 dígitos válidos.");
 */

export type ResultOk<T> = { ok: true; data: T };
export type ResultErr = { ok: false; error: { code: string; message: string } };
export type Result<T> = ResultOk<T> | ResultErr;

/** Create a success result. */
export function success<T>(data: T): ResultOk<T> {
    return { ok: true, data };
}

/** Create a failure result with error code and user-friendly message. */
export function failure(code: string, message: string): ResultErr {
    return { ok: false, error: { code, message } };
}

/**
 * Convert a Zod validation error into a standardized failure result.
 * Uses the first error's message for the user-facing text.
 */
export function fromZodError(zodError: { issues: Array<{ message: string }> }): ResultErr {
    const firstMessage = zodError.issues[0]?.message ?? "Dados inválidos.";
    return failure("VALIDATION_ERROR", firstMessage);
}
