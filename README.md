# Taskflow Reports Web

## Visão geral
Taskflow Reports é um sistema interno para registrar chamados de suporte, consolidar histórico de atendimento e gerar visão gerencial (dashboard e relatórios).

Público principal:
- Time de suporte/atendimento (registro e edição de tickets)
- Liderança operacional (dashboard e relatórios por período)

## Stack utilizada
Aplicação:
- Next.js App Router (`app/`)
- React 19
- TypeScript (`tsconfig.json`)
- Tailwind CSS v4 (`app/globals.css`, `postcss.config.mjs`)
- HeroUI (wrappers em `app/ui/*`)
- Recharts (gráficos)

Dados e autenticação:
- Supabase Auth (email/senha)
- Supabase Postgres (tabelas `clients`, `tickets`, `profiles`)
- RPCs SQL para dashboard e lookup de cliente por CPF

Qualidade:
- ESLint (`npm run lint`)
- Typecheck (`npm run typecheck`)
- Build (`npm run build`)

## Regra de negócio atual (Unidade)
A unidade da ocorrência é registrada no ticket (`tickets.unidade`), não mais como valor fixo do cliente.

Como funciona:
- `clients.unidade`: unidade padrão do cliente (atalho para preenchimento)
- `clients.multi_unidade`: define se o cliente abre chamados para várias unidades
- `tickets.unidade`: unidade afetada naquela ocorrência (fonte principal para dashboard e relatórios)

Regras de cadastro:
- Cliente comum (`multi_unidade = false`):
  - se unidade do ticket vier vazia, o sistema preenche com `clients.unidade`
- Cliente multi-unidade (`multi_unidade = true`):
  - unidade do ticket é obrigatória
- Emails de clientes:
  - Emails ficam em `client_emails` (`email_norm` gerado minúsculo/trim, único).
  - Lookup prioriza CPF, depois email, e por último nome (sugestões).
  - Clientes legados sem email podem receber email opcional durante o cadastro/atendimento.
- Tickets gerais com múltiplos motivos:
  - Tabela `tickets` agora é o container (prioridade, retroativo, profissional).
  - Motivos ficam em `ticket_motivos` com status individual e relacionamento com cliente.
  - Status geral do ticket é derivado dos itens (RESOLVIDO se todos itens resolvidos/cancelados).
  - Script: `supabase/ticket_motivos.sql` para criar tabela e RLS.

### Cadastro de Unidades (name_status)
- Tabela `units` separa o dado real (`unit_name`) do estado (`name_status`).
- Quando a unidade está sem nome: `unit_name = null` e `name_status` obrigatório (`NAO_INFORMADO`, `NAO_ENCONTRADO` ou `SEM_NOME`).
- Quando o nome é informado: `name_status = INFORMADO` e `unit_name` precisa de no mínimo 3 caracteres (bloqueia valores lixo como S/N, NA, N/A, "-").
- Fallback na listagem: se `unit_name` for nulo, exibimos `— (Não informado|Não encontrado|Sem nome)` conforme `name_status`.

## Como rodar local
### Pré-requisitos
- Node.js 20+
- npm 10+
- Projeto Supabase com schema aplicado

### Variáveis de ambiente
Crie `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Comandos
```bash
npm install
npm run dev
```

Validações:
```bash
npm run lint
npm run typecheck
npm run build
```

## Módulos principais
- `app/tickets/*`: criação, listagem, filtros e edição de tickets
- `app/dashboard/*`: métricas e visualizações
- `app/reports/*`: geração de relatórios e exportação CSV
- `app/faq/*`: manual operacional com perguntas frequentes
- `components/navigation.ts`: menu lateral
- `supabase/*.sql`: schema, RPCs e migrações

## Fluxos críticos
- Login:
  - formulário em `app/login/page.tsx`
  - sessão validada por `proxy.ts`
- Criação de ticket:
  - formulário em `app/tickets/TicketsClient.tsx`
  - lookup opcional por CPF via `find_client_by_cpf`
  - persistência via `createTicketAction`
- Edição de ticket:
  - modal em `app/tickets/TicketsClient.tsx`
  - persistência via `updateTicketAction`
- Dashboard:
  - filtros em `app/dashboard/DashboardClient.tsx`
  - métricas via `dashboard_metrics`
- Relatórios:
  - consulta em `app/reports/ReportsClient.tsx`
  - exportação via `utils/exportReports.ts`

## Fontes principais
- `app/tickets/actions.ts`
- `app/tickets/TicketsClient.tsx`
- `app/tickets/page.tsx`
- `app/dashboard/DashboardClient.tsx`
- `app/reports/ReportsClient.tsx`
- `app/faq/FaqClient.tsx`
- `components/navigation.ts`
- `supabase/schema.sql`
- `supabase/unidade_triagem.sql`
- `supabase/dashboard_rpc.sql`
- `supabase/client_lookup_rpc.sql`
