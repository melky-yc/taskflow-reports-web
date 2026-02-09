"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Settings, Sun, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  document.documentElement.dataset.theme = theme;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export default function ConfigClient() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [theme, setTheme] = useState<ThemeOption>(() => {
    if (typeof window === "undefined") return "light";
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeOption | null;
    return storedTheme === "dark" || storedTheme === "light" ? storedTheme : "light";
  });
  const [prefs, setPrefs] = useState<Preferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFS;
    const storedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!storedPrefs) return DEFAULT_PREFS;
    try {
      const parsed = JSON.parse(storedPrefs) as Preferences;
      return { ...DEFAULT_PREFS, ...parsed };
    } catch {
      return DEFAULT_PREFS;
    }
  });
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("-");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "-");
    });
  }, [supabase]);

  const handleThemeChange = (nextTheme: ThemeOption) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setNotice("Preferências salvas.");
    window.setTimeout(() => setNotice(""), 2500);
  };

  const handlePrefChange = (key: keyof Preferences) => (value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
    setNotice("Preferências salvas.");
    window.setTimeout(() => setNotice(""), 2500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[var(--color-muted-soft)] p-2 text-[var(--color-muted-strong)]">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Configuração
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Preferências da plataforma e configurações de sessão.
          </p>
        </div>
      </div>

      {notice ? (
        <Alert className="border-[var(--color-success)] bg-[var(--color-success-soft)]">
          <AlertTitle>Configurações atualizadas</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="themes">
        <TabsList>
          <TabsTrigger value="themes">Aparência</TabsTrigger>
          <TabsTrigger value="prefs">Preferências avançadas</TabsTrigger>
          <TabsTrigger value="session">Sessão</TabsTrigger>
        </TabsList>

        <TabsContent value="themes">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Defina o tema que melhor se adapta ao seu ambiente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    theme === "light"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                    <Sun className="h-4 w-4 text-[var(--color-warning)]" />
                    Claro
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Tema padrão para ambientes corporativos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    theme === "dark"
                      ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                    <Moon className="h-4 w-4 text-[var(--color-primary)]" />
                    Escuro
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Interface otimizada para uso noturno.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prefs">
          <Card>
            <CardHeader>
              <CardTitle>Preferências avançadas</CardTitle>
              <CardDescription>
                Ajuste comportamentos e opções de exibição da interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <div className="text-xs text-[var(--color-muted)]">
                    Idioma
                  </div>
                  <div className="mt-1 text-sm font-medium text-[var(--color-text)]">
                    Português (Brasil)
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <div className="text-xs text-[var(--color-muted)]">
                    Formato de data
                  </div>
                  <div className="mt-1 text-sm font-medium text-[var(--color-text)]">
                    DD/MM/AAAA
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[var(--color-text)]">
                    Mostrar dicas na interface
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">
                    Exibe sugestões rápidas nos formulários.
                  </div>
                </div>
                <Switch
                  checked={prefs.showTips}
                  onCheckedChange={handlePrefChange("showTips")}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[var(--color-text)]">
                    Confirmar antes de excluir registros
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">
                    Exibe confirmação antes de ações críticas.
                  </div>
                </div>
                <Switch
                  checked={prefs.confirmDelete}
                  onCheckedChange={handlePrefChange("confirmDelete")}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[var(--color-text)]">
                    Abrir dashboard ao fazer login
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">
                    Mantém a home no painel de métricas.
                  </div>
                </div>
                <Switch
                  checked={prefs.openDashboard}
                  onCheckedChange={handlePrefChange("openDashboard")}
                />
              </div>

              <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-3 text-xs text-[var(--color-muted)]">
                Em breve: notificações por e-mail, preferências de exportação e
                regras de aprovação.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session">
          <Card>
            <CardHeader>
              <CardTitle>Sessão</CardTitle>
              <CardDescription>Informações da conta autenticada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
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
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[var(--color-muted)]">
                  Encerre a sessão para trocar de conta.
                </div>
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
