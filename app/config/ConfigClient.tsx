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
        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Configuração</h1>
          <p className="text-sm text-slate-500">
            Preferências da plataforma e configurações de sessão.
          </p>
        </div>
      </div>

      {notice ? (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertTitle>Configurações atualizadas</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="themes">
        <TabsList>
          <TabsTrigger value="themes">Temas</TabsTrigger>
          <TabsTrigger value="prefs">Preferências</TabsTrigger>
          <TabsTrigger value="session">Sessão</TabsTrigger>
        </TabsList>

        <TabsContent value="themes">
          <Card>
            <CardHeader>
              <CardTitle>Temas</CardTitle>
              <CardDescription>
                Personalize a aparência da interface para o seu ambiente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    theme === "light"
                      ? "border-[color:var(--primary)] bg-indigo-50/40"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Sun className="h-4 w-4 text-amber-500" />
                    Claro
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Tema padrão para ambientes corporativos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    theme === "dark"
                      ? "border-[color:var(--primary)] bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Moon className="h-4 w-4 text-slate-500" />
                    Escuro
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Prévia disponível. Alguns módulos podem permanecer claros.
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
                Ajuste comportamentos e atalhos do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    Mostrar dicas na interface
                  </div>
                  <div className="text-xs text-slate-500">
                    Exibe sugestões rápidas nos formulários.
                  </div>
                </div>
                <Switch
                  checked={prefs.showTips}
                  onCheckedChange={handlePrefChange("showTips")}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    Confirmar antes de excluir registros
                  </div>
                  <div className="text-xs text-slate-500">
                    Exibe confirmação antes de ações críticas.
                  </div>
                </div>
                <Switch
                  checked={prefs.confirmDelete}
                  onCheckedChange={handlePrefChange("confirmDelete")}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    Abrir dashboard ao fazer login
                  </div>
                  <div className="text-xs text-slate-500">
                    Mantém a home no painel de métricas.
                  </div>
                </div>
                <Switch
                  checked={prefs.openDashboard}
                  onCheckedChange={handlePrefChange("openDashboard")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session">
          <Card>
            <CardHeader>
              <CardTitle>Sessão</CardTitle>
              <CardDescription>
                Informações da conta autenticada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="rounded-full bg-slate-100 p-2 text-slate-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Usuário logado</div>
                  <div className="text-sm font-medium text-slate-900">{email}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Encerre a sessão para trocar de conta.
                </div>
                <Button variant="outline" onClick={handleLogout}>
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
