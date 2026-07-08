import { STATUS_FUNCIONARIO_LABEL, type StatusFuncionario } from "@/lib/funcionario";
import { formatDateBR } from "@/lib/date";

const STYLE: Record<StatusFuncionario, string> = {
  ATIVO: "bg-success-bg text-success",
  AFASTADO: "bg-warning-bg text-warning",
  FERIAS: "bg-warning-bg text-warning",
  ATESTADO: "bg-warning-bg text-warning",
  DESLIGADO: "bg-danger-bg text-danger",
};

export function StatusFuncionarioPill({
  status,
  dataDesligamento,
}: {
  status: StatusFuncionario;
  dataDesligamento?: string | null;
}) {
  const label = STATUS_FUNCIONARIO_LABEL[status];
  const sufixo = status === "DESLIGADO" && dataDesligamento ? ` — ${formatDateBR(new Date(dataDesligamento))}` : "";
  return (
    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${STYLE[status]}`}>
      {label}
      {sufixo}
    </span>
  );
}
