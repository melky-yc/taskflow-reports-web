import { NextResponse } from "next/server";
import { upsertClientAction } from "@/app/clients/actions";
import { requireUser, unauthorizedResponse, AuthError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const result = await upsertClientAction(body);

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedResponse();
    console.error("client_upsert_error", error);
    return NextResponse.json(
      { ok: false, error: { code: "UNKNOWN", message: "Falha ao salvar cliente." } },
      { status: 500 }
    );
  }
}
