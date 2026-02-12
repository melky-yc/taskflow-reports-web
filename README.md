# Taskflow Reports Web

## Visao geral
Taskflow Reports e um sistema interno para registrar chamados de suporte, consolidar historico de atendimento e gerar visao gerencial (dashboard e relatorios) para operacao.

Publico principal:
- Time de suporte/atendimento (registro e edicao de tickets)
- Lideranca operacional (dashboard e relatorios por periodo)

## Stack ultilizada
Aplicacao:
- Next.js App Router (`app/`)
- React 19
- TypeScript (`tsconfig.json`)
- Tailwind CSS v4 (`app/globals.css`, `postcss.config.mjs`)
- HeroUI (wrappers em `app/ui/*`)
- Recharts (graficos)

Dados e autenticacao:
- Supabase Auth (email/senha)
- Supabase Postgres (tabelas `clients`, `tickets`, `profiles`)
- RPCs SQL para dashboard e lookup de cliente por CPF

Ferramentas de qualidade:
- ESLint (`eslint.config.mjs`)
- Typecheck (`npm run typecheck`)
- Build Next (`npm run build`)
- Test script minimo (`npm run test`)

## Como rodar local
### Pre-requisitos
- Node.js 20+
- npm 10+
- Projeto Supabase com schema aplicado

### Variaveis de ambiente
Crie `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Observacao: o codigo tambem suporta fallback para `SUPABASE_URL` e `SUPABASE_ANON_KEY` (`lib/supabase/client.ts`, `lib/supabase/server.ts`, `proxy.ts`).

### Comandos
```bash
npm install
npm run dev
```

Validacoes tecnicas:
```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

## Modulos principais
- `app/login/*`: autenticacao por email/senha
- `app/tickets/*`: cadastro, listagem, filtros e edicao de tickets
- `clients` (dominio de dados): mantido por `app/tickets/actions.ts` e tabela `public.clients`
- `app/dashboard/*`: metricas e visualizacoes com filtros
- `app/reports/*`: geracao de relatorios por periodo + exportacao CSV
- `app/config/*`: preferencias locais (tema e ajustes de UX)
- `app/ui/*` e `components/ui/*`: camada de componentes reutilizaveis
- `supabase/*.sql`: schema, RPCs e scripts auxiliares de banco

## Fluxos criticos (journeys)
- Login:
  - Usuario envia email/senha em `app/login/page.tsx`
  - Sessao e validada em `proxy.ts` para rotas protegidas
- Criacao de ticket:
  - Formulario em `app/tickets/TicketsClient.tsx`
  - Lookup opcional de cliente por CPF via RPC `find_client_by_cpf`
  - Persistencia via server action `createTicketAction` (`app/tickets/actions.ts`)
  - Revalidacao de rota `/tickets`
- Edicao de ticket:
  - Modal de edicao em `app/tickets/TicketsClient.tsx`
  - Persistencia via `updateTicketAction`
- Dashboard:
  - Filtros no cliente (`app/dashboard/DashboardClient.tsx`)
  - Carga de metricas via RPC `dashboard_metrics` (`supabase/dashboard_rpc.sql`)
- Relatorios:
  - Consulta de tickets com recorte temporal em `app/reports/ReportsClient.tsx`
  - Exportacao CSV via `utils/exportReports.ts`

## Known Issues / Divida tecnica
- Drift entre app e schema SQL: app usa `tickets.uso_plataforma`, mas `supabase/schema.sql` atual nao define essa coluna.
- Componentes de pagina muito grandes (hotspots):
  - `app/tickets/TicketsClient.tsx`
  - `app/dashboard/DashboardClient.tsx`
  - `app/reports/ReportsClient.tsx`
- Regras de negocio distribuidas entre UI cliente, server action e SQL (sem camada de servico explicita).
- Politicas RLS estao amplas (`using (true)` para usuarios autenticados).
- Ausencia de testes automatizados reais (script `test` e placeholder).

## Roadmap (arquitetura e qualidade)
### P0
- Alinhar schema SQL com uso real da aplicacao (especialmente `tickets.uso_plataforma`) sem migracao destrutiva.
- Endurecer autorizacao/RLS para reduzir superficie de acesso.
- Introduzir suite minima de testes para fluxo de ticket (happy path + validacoes basicas).

### P1
- Extrair camada `services` e `repositories` para reduzir regra de negocio em componentes.
- Centralizar contratos de input/output com schemas compartilhados.
- Padronizar error model (codigo, mensagem, contexto) e telemetria.

### P2
- Observabilidade (metricas de latencia, taxa de erro por modulo).
- Melhorias de performance (cache seletivo e tuning de consultas pesadas).
- Melhorias de DX (geracao de tipos de banco e convencoes de modulo).

## Fontes do repositorio (paths)
- `package.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/login/page.tsx`
- `app/tickets/page.tsx`
- `app/tickets/TicketsClient.tsx`
- `app/tickets/actions.ts`
- `app/dashboard/DashboardClient.tsx`
- `app/reports/ReportsClient.tsx`
- `app/config/ConfigClient.tsx`
- `components/AppShell.tsx`
- `components/dashboard/FiltersToolbar.tsx`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `proxy.ts`
- `utils/exportTickets.ts`
- `utils/exportReports.ts`
- `supabase/schema.sql`
- `supabase/dashboard_rpc.sql`
- `supabase/client_lookup_rpc.sql`
- `supabase/SETUP.md`
