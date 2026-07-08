export type RegistroDiarioLike = {
  funcionarioId: string;
  presenca: boolean;
  tipoRefeicao: "EM_ESPECIE" | "DINHEIRO" | null;
  custoRefeicao: number;
  custoMerenda: number;
  valorDeslocamento: number;
};

export type FuncionarioLike = {
  id: string;
  nome: string;
  funcao: string;
};

export type FuncionarioQuinzenaReport = {
  funcionarioId: string;
  nome: string;
  funcao: string;
  diasPresentes: number;
  diasFalta: number;
  diasAlmoco: number;
  valorAlmocoTotal: number;
  diasVale: number;
  valorValeTotal: number;
  valorMerendaTotal: number;
  valorDeslocamentoTotal: number;
  totalGeral: number;
};

export type QuinzenaReport = {
  funcionarios: FuncionarioQuinzenaReport[];
  totais: Omit<FuncionarioQuinzenaReport, "funcionarioId" | "nome" | "funcao">;
};

export function computeQuinzenaReport(
  registros: RegistroDiarioLike[],
  funcionarios: FuncionarioLike[]
): QuinzenaReport {
  const funcionariosPorId = new Map(funcionarios.map((f) => [f.id, f]));

  const acumuladoPorFuncionario = new Map<string, FuncionarioQuinzenaReport>();

  for (const registro of registros) {
    const funcionario = funcionariosPorId.get(registro.funcionarioId);
    if (!funcionario) continue;

    let linha = acumuladoPorFuncionario.get(registro.funcionarioId);
    if (!linha) {
      linha = {
        funcionarioId: registro.funcionarioId,
        nome: funcionario.nome,
        funcao: funcionario.funcao,
        diasPresentes: 0,
        diasFalta: 0,
        diasAlmoco: 0,
        valorAlmocoTotal: 0,
        diasVale: 0,
        valorValeTotal: 0,
        valorMerendaTotal: 0,
        valorDeslocamentoTotal: 0,
        totalGeral: 0,
      };
      acumuladoPorFuncionario.set(registro.funcionarioId, linha);
    }

    if (registro.presenca) {
      linha.diasPresentes += 1;
    } else {
      linha.diasFalta += 1;
    }

    if (registro.tipoRefeicao === "EM_ESPECIE") {
      linha.diasAlmoco += 1;
      linha.valorAlmocoTotal += registro.custoRefeicao;
    } else if (registro.tipoRefeicao === "DINHEIRO") {
      linha.diasVale += 1;
      linha.valorValeTotal += registro.custoRefeicao;
    }

    linha.valorMerendaTotal += registro.custoMerenda;
    linha.valorDeslocamentoTotal += registro.valorDeslocamento;
  }

  const funcionariosReport = Array.from(acumuladoPorFuncionario.values())
    .map((linha) => ({
      ...linha,
      totalGeral: linha.valorAlmocoTotal + linha.valorValeTotal + linha.valorMerendaTotal + linha.valorDeslocamentoTotal,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const totaisIniciais = {
    diasPresentes: 0,
    diasFalta: 0,
    diasAlmoco: 0,
    valorAlmocoTotal: 0,
    diasVale: 0,
    valorValeTotal: 0,
    valorMerendaTotal: 0,
    valorDeslocamentoTotal: 0,
    totalGeral: 0,
  };

  const totais = funcionariosReport.reduce((acc, linha) => {
    for (const key of Object.keys(totaisIniciais) as (keyof typeof totaisIniciais)[]) {
      acc[key] += linha[key];
    }
    return acc;
  }, { ...totaisIniciais });

  return { funcionarios: funcionariosReport, totais };
}
