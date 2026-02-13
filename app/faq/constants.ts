export type FaqSection =
  | "Cadastro"
  | "Regras de atendimento"
  | "Relatórios e dashboard"
  | "Erros comuns";

export type FaqItem = {
  id: string;
  section: FaqSection;
  question: string;
  answer: string[];
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "o-que-e",
    section: "Cadastro",
    question: "O que é o Taskflow Reports?",
    answer: [
      "É o sistema interno para registrar chamados atendidos pela equipe de suporte e gerar visão gerencial de operação.",
      "Tudo que foi atendido deve virar registro no sistema para manter histórico e métricas confiáveis.",
    ],
  },
  {
    id: "quem-registra",
    section: "Cadastro",
    question: "Quem deve registrar um chamado?",
    answer: [
      "O profissional interno que realizou o atendimento é o responsável pelo registro.",
      "O cliente não cadastra diretamente no sistema.",
    ],
  },
  {
    id: "cliente-vs-ticket",
    section: "Cadastro",
    question: "Qual a diferença entre Cliente e Ticket?",
    answer: [
      "Cliente é o cadastro da pessoa/contato atendido (dados estáveis como nome, CPF, cidade e unidade padrão).",
      "Ticket é a ocorrência pontual atendida (motivo, prioridade, data, retroativo e unidade afetada).",
    ],
  },
  {
    id: "unidade-afetada",
    section: "Regras de atendimento",
    question: "O que é “Unidade afetada” e por que ela fica no ticket?",
    answer: [
      "É a unidade onde o problema realmente ocorreu naquela ocorrência.",
      "Ela fica no ticket porque o mesmo cliente pode abrir chamados para unidades diferentes ao longo do tempo.",
    ],
  },
  {
    id: "quando-alterar-unidade",
    section: "Regras de atendimento",
    question: "Quando devo alterar a unidade?",
    answer: [
      "Altere sempre que o atendimento da ocorrência tiver ocorrido em unidade diferente da unidade padrão do cliente.",
      "Não use textos genéricos como “Não informada”.",
    ],
  },
  {
    id: "secretaria-municipal",
    section: "Regras de atendimento",
    question: "Caso Secretaria Municipal: como registrar corretamente?",
    answer: [
      "Clientes marcados como multi-unidade exigem preenchimento manual da unidade afetada no ticket.",
      "Antes de salvar, confirme com o solicitante em qual unidade ocorreu o problema.",
    ],
  },
  {
    id: "nao-sei-unidade",
    section: "Regras de atendimento",
    question: "O que fazer quando não sei a unidade?",
    answer: [
      "Cliente comum: o sistema usa a unidade padrão automaticamente; ajuste se necessário.",
      "Cliente multi-unidade (Secretaria): a unidade do ticket é obrigatória, então confirme a informação antes de finalizar o registro.",
    ],
  },
  {
    id: "uso-plataforma",
    section: "Regras de atendimento",
    question: "Como preencher Uso de plataforma (Mobile/Web/Ambos/Não informado)?",
    answer: [
      "No cliente: use para registrar o padrão de uso recorrente do cliente.",
      "No ticket: use quando o atendimento da ocorrência teve contexto específico que pode diferir do padrão do cliente.",
      "O dashboard e relatórios priorizam o uso informado no ticket e, quando vazio, usam o do cliente.",
    ],
  },
  {
    id: "motivo-outro",
    section: "Regras de atendimento",
    question: "Quando usar Motivo “Outro”?",
    answer: [
      "Use somente quando nenhum motivo da lista representar o atendimento.",
      "Ao selecionar “Outro”, a descrição detalhada passa a ser obrigatória.",
    ],
  },
  {
    id: "retroativo",
    section: "Regras de atendimento",
    question: "Quando marcar Retroativo?",
    answer: [
      "Quando a data de atendimento for anterior ao dia atual.",
      "Nesses casos, o motivo do retroativo é obrigatório.",
    ],
  },
  {
    id: "prioridade",
    section: "Regras de atendimento",
    question: "Como escolher prioridade (Baixa, Média, Alta)?",
    answer: [
      "Baixa: dúvida simples ou ajuste sem bloqueio operacional.",
      "Média: impacto moderado com operação parcialmente afetada.",
      "Alta: indisponibilidade, bloqueio de atividade crítica ou impacto amplo.",
    ],
  },
  {
    id: "boas-praticas",
    section: "Cadastro",
    question: "Boas práticas de cadastro",
    answer: [
      "Preencha dados completos e padronizados para manter relatórios confiáveis.",
      "Evite valores genéricos em campos estruturados.",
      "Revise unidade afetada, motivo e prioridade antes de salvar.",
    ],
  },
  {
    id: "erro-salvar",
    section: "Erros comuns",
    question: "Por que não consigo salvar o chamado?",
    answer: [
      "Verifique campos obrigatórios (motivo, prioridade, cliente, data e unidade afetada quando aplicável).",
      "Se motivo for “Outro”, confirme se a descrição foi preenchida.",
      "Se for retroativo, confirme se informou justificativa.",
    ],
  },
  {
    id: "erro-unidade-multi",
    section: "Erros comuns",
    question: "Erro de unidade para cliente multi-unidade",
    answer: [
      "O cliente está marcado como multi-unidade e exige unidade afetada no ticket.",
      "Selecione/preencha a unidade correta e tente salvar novamente.",
    ],
  },
  {
    id: "faq-relatorios",
    section: "Relatórios e dashboard",
    question: "Como a unidade aparece em dashboard e relatórios?",
    answer: [
      "As métricas e exportações usam a unidade do ticket como fonte principal.",
      "Quando a unidade do ticket estiver vazia, o sistema exibe “Sem classificação” como fallback visual.",
    ],
  },
];

export const FAQ_SECTIONS: FaqSection[] = [
  "Cadastro",
  "Regras de atendimento",
  "Relatórios e dashboard",
  "Erros comuns",
];
