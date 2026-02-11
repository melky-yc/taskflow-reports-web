import { redirect } from "next/navigation";
import Image from "next/image";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  AppAlert,
  AppButton,
  AppCard,
  AppCardBody,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
  AppInput,
} from "@/app/ui";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=1");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=1");
  }

  redirect("/dashboard");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const hasError = params?.error === "1";

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
            <Image
              src="/logotsf.svg"
              alt="Taskflow Reports"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
          </div>
        </div>

        <AppCard>
          <AppCardHeader className="p-4 pb-0 md:p-6 md:pb-0">
            <AppCardTitle className="text-xl">Acesso ao sistema</AppCardTitle>
            <AppCardDescription>
              Entre com suas credenciais para continuar.
            </AppCardDescription>
          </AppCardHeader>
          <AppCardBody className="p-4 pt-4 md:p-6 md:pt-4">
            <form action={signIn} className="space-y-4">
              <AppInput
                label="E-mail"
                name="email"
                type="email"
                autoComplete="email"
                startContent={<Mail className="h-4 w-4 text-[var(--color-muted)]" />}
                isRequired
              />

              <AppInput
                label="Senha"
                name="password"
                type="password"
                autoComplete="current-password"
                startContent={<Lock className="h-4 w-4 text-[var(--color-muted)]" />}
                isRequired
              />

              {hasError ? (
                <AppAlert
                  tone="danger"
                  title="Acesso inválido"
                  description="E-mail ou senha inválidos."
                />
              ) : null}

              <AppButton className="w-full" type="submit">
                Entrar
              </AppButton>
            </form>
          </AppCardBody>
        </AppCard>

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Suporte interno. Use apenas contas autorizadas.
        </p>
      </div>
    </div>
  );
}


