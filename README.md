# 📌 Sistema Interno de Chamados de Suporte

## Visão geral

Este repositório documenta um **sistema interno de chamados de Suporte**, desenvolvido para **organizar, centralizar e analisar** os atendimentos da empresa, que antes **não possuía controle estruturado sobre os chamados**.

O sistema foi criado com foco em:
- padronização dos registros  
- histórico confiável  
- geração de relatórios  
- visualização clara dos dados  

🔒 **Projeto fechado**  
Este sistema é de **uso exclusivo da empresa** e não foi desenvolvido para uso público ou comercial.

---

## 🎯 Contexto e motivação

Antes do sistema:

- Chamados eram registrados de forma informal
- Não existia histórico centralizado
- Não havia métricas ou relatórios
- Dificuldade em responder perguntas simples como:
  - Quantos chamados existem por período?
  - Quais são os principais motivos?
  - Onde estão os maiores problemas?

Após a implementação:

- Todos os chamados são registrados em um único sistema
- Dados padronizados e validados
- Relatórios e exportações disponíveis
- Dashboard com indicadores claros para acompanhamento

---

## 🧱 Funcionalidades principais

- Cadastro de chamados de suporte
- Cadastro de clientes vinculados aos chamados
- Controle por:
  - motivo
  - prioridade
  - área de atuação
  - uso da plataforma
  - data de atendimento
- Dashboard com indicadores e gráficos
- Relatórios:
  - diário
  - semanal
  - mensal
  - anual
- Exportação de dados:
  - CSV
  - XLSX (Excel)
- Autenticação de usuários (uso interno)
- Interface web responsiva e corporativa

> Dados sensíveis não são exibidos em dashboards ou relatórios visuais.

---

## 🖥️ Tecnologias utilizadas

### Frontend
- Next.js  
- React  
- Tailwind CSS  
- shadcn/ui  
- Recharts  

### Backend / Dados
- Supabase (PostgreSQL)
- RPCs SQL para métricas
- Row Level Security (RLS)

---

## 🎨 Interface

- Design limpo e corporativo
- Foco em clareza e usabilidade
- Responsivo para desktop e mobile
- Estrutura preparada para evolução futura (ex: novos dashboards)

---

## 📸 Demonstração

> As imagens abaixo mostram o sistema em funcionamento em ambiente interno.

_(imagens serão adicionadas aqui)_

---

## 👤 Autor

Sistema idealizado, arquitetado e desenvolvido **individualmente** por:

**Melchisedek Lima**

O projeto foi criado **por iniciativa própria**, com o objetivo de **ajudar a empresa a resolver a falta de controle sobre os chamados de suporte**, trazendo organização, visibilidade e dados confiáveis para o dia a dia operacional.

---

## 🔒 Uso e licença

Este é um **projeto proprietário**.

- Uso restrito à empresa  
- Não é open source  
- Não é permitido reutilizar ou redistribuir  
