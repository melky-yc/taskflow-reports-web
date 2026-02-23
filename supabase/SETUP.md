# Supabase Setup

## 1) Criar projeto
1. No painel do Supabase, crie um novo projeto.
2. Aguarde a inicialização do banco.

## 2) Rodar o schema
1. Abra **SQL Editor** -> **New query**.
2. Abra o arquivo `supabase/schema.sql` e copie todo o conteúdo.
3. Cole no SQL Editor e clique em **Run**.

## 3) Rodar funções auxiliares e migração de unidade no ticket
1. Abra o arquivo `supabase/client_lookup_rpc.sql` e execute no SQL Editor.
2. Abra o arquivo `supabase/dashboard_rpc.sql` e execute no SQL Editor.
3. Abra o arquivo `supabase/unidade_triagem.sql` e execute no SQL Editor.
4. Abra o arquivo `supabase/reports_filters_indexes.sql` e execute no SQL Editor.
5. Abra o arquivo `supabase/units_alter.sql` e execute no SQL Editor.
6. Abra o arquivo `supabase/units_cleanup.sql` e execute no SQL Editor.
7. Abra o arquivo `supabase/client_emails.sql` e execute no SQL Editor.
8. Abra o arquivo `supabase/ticket_motivos.sql` e execute no SQL Editor.
9. Abra o arquivo `supabase/tickets_container_alter.sql` e execute no SQL Editor.
10. Abra o arquivo `supabase/ticket_motivos_alter.sql` e execute no SQL Editor.
11. Reaplique (ou rode) `supabase/ticket_motivos.sql` se a constraint `ticket_motivos_motivo_outro_chk` ainda existir.
12. Rode `supabase/ticket_motivos_prioridade_alter.sql` para mover prioridade para os motivos.
13. Rode `supabase/tickets_status_backfill.sql` para popular status/updated_at nos tickets antigos.
14. Rode `supabase/tickets_status_unique_idx.sql` para garantir 1 ticket ativo por cliente.

## 4) (Opcional) Rodar o seed
1. Abra o arquivo `supabase/seed.sql` e copie todo o conteúdo.
2. Cole no SQL Editor e clique em **Run**.

## 5) Habilitar Auth email/senha
1. Vá em **Authentication** -> **Providers**.
2. Habilite **Email** (email/password).

## 6) Criar usuários manualmente
1. Vá em **Authentication** -> **Users**.
2. Crie os usuários manualmente (email/senha).
3. Não insira diretamente na tabela `auth.users` via SQL.

## 7) Obter SUPABASE_URL e ANON KEY
1. Vá em **Project Settings** -> **API**.
2. Copie **Project URL** (SUPABASE_URL) e a **anon public key** (ANON KEY).
