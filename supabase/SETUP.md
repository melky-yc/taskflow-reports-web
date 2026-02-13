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
