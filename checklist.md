✅ Checklist 1/3 — DB (Supabase)
Estrutura e constraints

 Existem as tabelas clients e tickets no schema public.

 clients.cpf é único (unique index/constraint).

 clients.cpf armazena somente 11 dígitos (sem ponto/traço).

 CHECK existe e funciona: cpf ~ '^[0-9]{11}$'.

 CHECK existe: estado_uf com 2 chars (ex: char_length(estado_uf)=2).

 CHECK existe: prioridade in ('Baixa','Media','Alta').

 CHECK existe: uso_plataforma in ('Mobile','Web').

 CHECK existe: motivo in (...) com os 5 novos motivos.

 CHECK existe: motivo_outro_descricao obrigatório quando motivo='Outro'.

 CHECK existe: retroativo_motivo obrigatório quando retroativo=true.

 tickets.client_id é FK válida para clients.id.

 tickets.profissional_id referencia auth.users(id) (ou equivalente).

 tickets.created_at tem default now().

RLS / Policies

 RLS está enabled em clients e tickets.

 Policy de SELECT permite apenas authenticated.

 Policy de INSERT permite apenas authenticated.

 Policy de UPDATE permite apenas authenticated.

 Policy de DELETE permite apenas authenticated.

 anon não consegue SELECT nem INSERT.

Smoke test SQL (rodar no SQL Editor)

 Inserir um cliente válido funciona (com cpf 11 dígitos).

 Inserir cliente com cpf inválido falha.

 Inserir ticket com motivo='Outro' e descrição vazia falha.

 Inserir ticket com retroativo=true e motivo vazio falha.

Se quiser, eu te monto um bloco SQL pronto (INSERTs + cases de erro) pra colar direto.

✅ Checklist 2/3 — Auth (Next.js + Supabase)
Env / build

 .env.local configurado com:

 NEXT_PUBLIC_SUPABASE_URL

 NEXT_PUBLIC_SUPABASE_ANON_KEY

 npm run dev sobe sem erro.

 Build passa: npm run build.

Fluxo de login/logout

 /login abre e renderiza form.

 Login com usuário válido redireciona para / (ou /tickets).

 Login com senha errada mostra erro (sem crash).

 Botão Sair desloga e volta para /login.

Proteção de rotas (zero bypass)

 Abrir / sem sessão → redireciona para /login.

 Abrir /tickets sem sessão → redireciona para /login.

 Após login, refresh na página privada mantém sessão.

 Cookies/sessão funcionam no SSR/CSR (sem “logou mas ao atualizar cai”).

Segurança básica

 O projeto não usa service_role em nenhum lugar.

 Não existe chave do Supabase hardcoded no repo (apenas via env).

 Logs não imprimem env nem tokens.

✅ Checklist 3/3 — UI Tickets + Cliente (Corporativo + Regras)
UI/UX corporativa (clara, consistente)

 Tema é claro e consistente (sem mistura “dark + light” estranha).

 Topbar com nome do sistema + botão Sair.

 Sidebar com Tickets e Dashboard (coming soon) desativado.

 Layout responsivo básico (não quebra feio em 1366x768).

Form: regras de negócio funcionando

 Motivo tem os 5 novos motivos.

 Se motivo = Outro → campo descrição aparece e é obrigatório.

 Se data_atendimento < hoje → marca retroativo e exige retroativo_motivo.

 Se data_atendimento >= hoje → retroativo desliga e campo some.

 CPF:

 Máscara na UI (ex: 123.456.789-00).

 Salva no banco só dígitos (11 chars).

 Não aparece CPF completo em console/log.

Upsert de cliente por CPF (o coração do sistema)

 Criar ticket com CPF novo → cria cliente + ticket.

 Criar novo ticket com mesmo CPF:

 Não cria outro cliente (mesmo clients.id).

 Atualiza dados do cliente (nome/cidade/UF/uso/unidade) se mudaram.

 CPF no modo edição:

 Não é editável.

 Demais campos do cliente são editáveis e persistem.

Listagem / filtros / paginação

 Tabela mostra colunas previstas (ID, Data, Profissional, Motivo, Prioridade, Cliente, CPF mascarado, Unidade, created_at).

 Filtro período 7/30/90 dias funciona (muda resultados).

 Filtro por motivo funciona.

 Paginação funciona (offset/limit ou cursor).

Edição via modal

 Duplo clique / clique abre modal sem crash.

 Alterar prioridade/motivo/etc salva.

 Alterar dados do cliente salva.

 Regras continuam valendo no modal (Outro exige descrição; retroativo exige motivo).

Integridade e auditoria mínima

 Ticket salva profissional_id (uuid do auth) e profissional_nome snapshot.

 created_at vem do banco (não depender do relógio do cliente).

Mini “teste de guerra” (3 cenários obrigatórios)

Outro + descrição

 Criar ticket motivo Outro sem descrição → bloqueia.

 Com descrição → salva.

Retroativo

 data_atendimento ontem → exige motivo retroativo.

 Preenche motivo → salva.

Cliente existente

 CPF X cria cliente

 CPF X de novo não duplica cliente

 Atualiza nome/unidade e reflete no próximo ticket