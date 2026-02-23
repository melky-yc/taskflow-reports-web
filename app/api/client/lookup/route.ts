import { NextResponse } from "next/server";
import { lookupClientAction } from "@/app/clients/actions";
import { requireUser, unauthorizedResponse, AuthError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const result = await lookupClientAction({
      cpf: body?.cpf,
      email: body?.email,
      nome: body?.nome,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof AuthError) return unauthorizedResponse();
    console.error("client_lookup_error", error);
    return NextResponse.json(
      { ok: false, error: { code: "LOOKUP_FAILED", message: "Falha na busca do cliente." } },
      { status: 500 }
    );
  }
}
