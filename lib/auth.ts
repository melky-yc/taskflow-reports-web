import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Verifies that the current request has a valid Supabase session.
 * Returns the authenticated user or throws an error.
 *
 * Usage in API routes:
 * ```ts
 * export async function GET() {
 *   const user = await requireUser();
 *   // ... handle authenticated request
 * }
 * ```
 */
export async function requireUser(): Promise<User> {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new AuthError("UNAUTHORIZED", "Sessão inválida ou expirada.");
    }

    return user;
}

/**
 * Standard 401 JSON response for API routes.
 */
export function unauthorizedResponse(): NextResponse {
    return NextResponse.json(
        {
            ok: false,
            error: { code: "UNAUTHORIZED", message: "Sessão inválida ou expirada." },
        },
        { status: 401 },
    );
}

/**
 * Custom error class for auth failures.
 * API routes can catch this specifically to return 401.
 */
export class AuthError extends Error {
    code: string;
    constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.name = "AuthError";
    }
}
