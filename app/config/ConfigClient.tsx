"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Settings, Sun, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import {
  AppButton,
  AppCard,
  AppCardBody,
  AppSwitch,
  AppTab,
  AppTabs,
  FormCard,
  PageHeader,
} from "@/app/ui";

const THEME_STORAGE_KEY = "taskflow-theme";
const PREFS_STORAGE_KEY = "taskflow-preferences";

type ThemeOption = "light" | "dark";

type Preferences = {
  showTips: boolean;
  confirmDelete: boolean;
  openDashboard: boolean;
};

const DEFAULT_PREFS: Preferences = {
  showTips: true,
  confirmDelete: true,
  openDashboard: true,
};

function applyTheme(theme: ThemeOption) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.dataset.theme = theme;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export default function ConfigClient() {
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);
  const router = useRouter();
  const { notify } = useAlerts();

  const [theme, setTheme] = useState<ThemeOption>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as
        | ThemeOption
        | null;
      return storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : "light";
    } catch {
      return "light";
    }
  });
  const [prefs, setPrefs] = useState<Preferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFS;
    try {
      const storedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
      if (!storedPrefs) return DEFAULT_PREFS;
      const parsed = JSON.parse(storedPrefs) as Preferences;
      return { ...DEFAULT_PREFS, ...parsed };
    } catch {
      return DEFAULT_PREFS;
    }
  });
  const [email, setEmail] = useState("-");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setEmail(data.user?.email ?? "-");
      })
      .catch(() => {
        setEmail("-");
      });
  }, [supabase]);

  const handleThemeChange = (nextTheme: ThemeOption) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {}
    notify({
      title: "Tema atualizado",
      description: "Preferências salvas com sucesso.",
      tone: "success",
    });
  };

  const handlePrefChange = (key: keyof Preferences) => (value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    notify({
      title: "Preferências atualizadas",
      description: "As alterações foram salvas.",
      tone: "success",
    });
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[var(--color-muted-soft)] p-2 text-[var(--color-muted-strong)]">
          <Settings className="h-5 w-5" />
        </div>
        <PageHeader
          title="Configuração"
          subtitle="Preferências da plataforma e configurações de sessão."
          className="flex-1"
        />
      </div>

      <AppTabs defaultSelectedKey="themes" aria-label="Configurações">
        <AppTab key="themes" title="Aparência">
          <FormCard
            title="Aparência"
            description="Defina o tema que melhor se adapta ao seu ambiente."
          >
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <AppCard
                isPressable
                onPress={() => handleThemeChange("light")}
                className={`transition ${
                  theme === "light"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
                }`}
              >
                <AppCardBody className="p-4 md:p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                    <Sun className="h-4 w-4 text-[var(--color-warning)]" />
                    Claro
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Tema padrão para ambientes corporativos.
                  </p>
                </AppCardBody>
              </AppCard>

              <AppCard
                isPressable
                onPress={() => handleThemeChange("dark")}
                className={`transition ${
                  theme === "dark"
                    ? "border-[var(--color-primary)] bg-[var(--color-muted-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
                }`}
              >
                <AppCardBody className="p-4 md:p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                    <Moon className="h-4 w-4 text-[var(--color-primary)]" />
                    Escuro
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Interface otimizada para uso noturno.
                  </p>
                </AppCardBody>
              </AppCard>
            </div>
          </FormCard>
        </AppTab>

        <AppTab key="prefs" title="Preferências avançadas">
          <FormCard
            title="Preferências avançadas"
            description="Ajuste comportamentos e opções de exibição da interface."
          >
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <AppCard>
                <AppCardBody className="p-4 md:p-6">
                  <div className="text-xs text-[var(--color-muted)]">Idioma</div>
                  <div className="mt-1 text-sm font-medium text-[var(--color-text)]">
                    Português (Brasil)
                  </div>
                </AppCardBody>
              </AppCard>
              <AppCard>
                <AppCardBody className="p-4 md:p-6">
                  <div className="text-xs text-[var(--color-muted)]">
                    Formato de data
                  </div>
                  <div className="mt-1 text-sm font-medium text-[var(--color-text)]">
                    DD/MM/AAAA
                  </div>
                </AppCardBody>
              </AppCard>
            </div>

            <div className="mt-4 space-y-3">
              <AppCard>
                <AppCardBody className="flex items-center justify-between gap-4 p-4 md:p-6">
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text)]">
                      Mostrar dicas na interface
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      Exibe sugestões rápidas nos formulários.
                    </div>
                  </div>
                  <AppSwitch
                    checked={prefs.showTips}
                    onCheckedChange={handlePrefChange("showTips")}
                  />
                </AppCardBody>
              </AppCard>

              <AppCard>
                <AppCardBody className="flex items-center justify-between gap-4 p-4 md:p-6">
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text)]">
                      Confirmar antes de excluir registros
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      Exibe confirmação antes de ações críticas.
                    </div>
                  </div>
                  <AppSwitch
                    checked={prefs.confirmDelete}
                    onCheckedChange={handlePrefChange("confirmDelete")}
                  />
                </AppCardBody>
              </AppCard>

              <AppCard>
                <AppCardBody className="flex items-center justify-between gap-4 p-4 md:p-6">
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text)]">
                      Abrir dashboard ao fazer login
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      Mantém a home no painel de métricas.
                    </div>
                  </div>
                  <AppSwitch
                    checked={prefs.openDashboard}
                    onCheckedChange={handlePrefChange("openDashboard")}
                  />
                </AppCardBody>
              </AppCard>

              <AppCard className="border-dashed bg-[var(--color-muted-soft)]">
                <AppCardBody className="p-4 md:p-6 text-xs text-[var(--color-muted)]">
                  Em breve: notificações por e-mail, preferências de exportação e
                  regras de aprovação.
                </AppCardBody>
              </AppCard>
            </div>
          </FormCard>
        </AppTab>

        <AppTab key="session" title="Sessão">
          <FormCard
            title="Sessão"
            description="Informações da conta autenticada."
          >
            <AppCard>
              <AppCardBody className="flex items-center gap-3 p-4 md:p-6">
                <div className="rounded-full bg-[var(--color-muted-soft)] p-2 text-[var(--color-muted-strong)]">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-[var(--color-muted)]">
                    Usuário logado
                  </div>
                  <div className="text-sm font-medium text-[var(--color-text)]">
                    {email}
                  </div>
                </div>
              </AppCardBody>
            </AppCard>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[var(--color-muted)]">
                Encerre a sessão para trocar de conta.
              </div>
              <AppButton variant="soft" onPress={handleLogout}>
                Logout
              </AppButton>
            </div>
          </FormCard>
        </AppTab>
      </AppTabs>
    </div>
  );

}




