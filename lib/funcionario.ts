export const STATUS_FUNCIONARIO = ["ATIVO", "AFASTADO", "FERIAS", "ATESTADO", "DESLIGADO"] as const;

export type StatusFuncionario = (typeof STATUS_FUNCIONARIO)[number];

export const STATUS_FUNCIONARIO_LABEL: Record<StatusFuncionario, string> = {
  ATIVO: "Ativo",
  AFASTADO: "Afastado",
  FERIAS: "Férias",
  ATESTADO: "Atestado",
  DESLIGADO: "Desligado",
};
