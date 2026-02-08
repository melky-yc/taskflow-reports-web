import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfigPage() {
  return (
    <AppShell active="config" breadcrumb="Configuração">
      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>Configurações do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            Em breve: temas, unidades e preferências avançadas.
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
