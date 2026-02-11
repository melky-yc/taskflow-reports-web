"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Settings, Sun, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { SettingsRow } from "@/components/ui/SettingsRow";
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
              <SelectableCard
                title="Claro"
                description="Tema padrão para ambientes corporativos."
                icon={<Sun className="text-[var(--color-warning)]" />}
                selected={theme === "light"}
                onPress={() => handleThemeChange("light")}
              />
              <SelectableCard
                title="Escuro"
                description="Interface otimizada para uso noturno."
                icon={<Moon className="text-[var(--color-primary)]" />}
                selected={theme === "dark"}
                onPress={() => handleThemeChange("dark")}
              />
            </div>
          </FormCard>
        </AppTab>

        <AppTab key="prefs" title="Preferências avançadas">
          <FormCard
            title="Preferências avançadas"
            description="Ajuste comportamentos e opções de exibição da interface."
          >
            <div className="space-y-4">
              <AppCard>
                <AppCardBody className="p-0 md:p-0 gap-0">
                  <div className="divide-y divide-[var(--color-border)]">
                    <SettingsRow
                      title="Idioma"
                      right={
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          Português (Brasil)
                        </span>
                      }
                      className="p-4 md:p-6"
                    />
                    <SettingsRow
                      title="Formato de data"
                      right={
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          DD/MM/AAAA
                        </span>
                      }
                      className="p-4 md:p-6"
                    />
                  </div>
                </AppCardBody>
              </AppCard>

              <AppCard>
                <AppCardBody className="p-0 md:p-0 gap-0">
                  <div className="divide-y divide-[var(--color-border)]">
                    <SettingsRow
                      title="Mostrar dicas na interface"
                      description="Exibe sugestões rápidas nos formulários."
                      right={
                        <AppSwitch
                          checked={prefs.showTips}
                          onCheckedChange={handlePrefChange("showTips")}
                        />
                      }
                      className="p-4 md:p-6"
                    />
                    <SettingsRow
                      title="Confirmar antes de excluir registros"
                      description="Exibe confirmação antes de ações críticas."
                      right={
                        <AppSwitch
                          checked={prefs.confirmDelete}
                          onCheckedChange={handlePrefChange("confirmDelete")}
                        />
                      }
                      className="p-4 md:p-6"
                    />
                    <SettingsRow
                      title="Abrir dashboard ao fazer login"
                      description="Mantém a home no painel de métricas."
                      right={
                        <AppSwitch
                          checked={prefs.openDashboard}
                          onCheckedChange={handlePrefChange("openDashboard")}
                        />
                      }
                      className="p-4 md:p-6"
                    />
                  </div>
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




