# Taskflow Reports (Web)

Projeto Next.js com autenticacao via Supabase (email/senha) e protecao de rotas.

## Requisitos
- Node.js 18+
- Projeto Supabase com Auth (Email/Password) habilitado

## Setup local (copy/paste)
```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Se estiver no Windows PowerShell:
```powershell
Copy-Item .env.local.example .env.local
```

Depois:
1. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`.
2. No Supabase, crie os usuarios manualmente em **Authentication** -> **Users**.
3. Acesse `http://localhost:3000/login` e teste o login.

Obs: o app tambem aceita `SUPABASE_URL` e `SUPABASE_ANON_KEY` como fallback, se ja existir `.env` local.

## Rotas
- `GET /login` publica
- `GET /` privada (Dashboard em breve)
- `GET /tickets` privada (cadastro e listagem de chamados)

## Fluxo Tickets
1. Acesse `/tickets` e preencha o formulario de novo chamado.
2. O cliente e criado ou atualizado por CPF (upsert).
3. O ticket e registrado com o cliente associado.
4. A tabela de Ultimos Chamados permite filtrar por periodo e motivo, com paginacao simples.

## Deploy na Vercel (passos)
1. Crie um novo projeto na Vercel e importe este repositorio.
2. Defina as variaveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Use o build padrao do Next.js (`npm run build`) e finalize o deploy.
4. Teste o login em `/login` no dominio publicado.
