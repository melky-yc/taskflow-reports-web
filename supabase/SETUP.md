# Supabase Setup

## 1) Criar projeto
1. No painel do Supabase, crie um novo projeto.
2. Aguarde a inicialização do banco.

## 2) Rodar o schema
1. Abra **SQL Editor** -> **New query**.
2. Abra o arquivo `supabase/schema.sql` e copie todo o conteúdo.
3. Cole no SQL Editor e clique em **Run**.

## 3) (Opcional) Rodar o seed
1. Abra o arquivo `supabase/seed.sql` e copie todo o conteúdo.
2. Cole no SQL Editor e clique em **Run**.

## 4) Habilitar Auth email/senha
1. Vá em **Authentication** -> **Providers**.
2. Habilite **Email** (email/password).

## 5) Criar usuários manualmente
1. Vá em **Authentication** -> **Users**.
2. Crie os 3 usuários manualmente (email/senha).
3. Não insira diretamente na tabela `auth.users` via SQL.

## 6) Obter SUPABASE_URL e ANON KEY
1. Vá em **Project Settings** -> **API**.
2. Copie **Project URL** (SUPABASE_URL) e a **anon public key** (ANON KEY).