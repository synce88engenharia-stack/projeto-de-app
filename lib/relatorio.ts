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
  diasRefeicaoDinheiro: number;
  valorRefeicaoTotal: number;
  valorMerendaTotal: number;
  valorDeslocamentoTotal: number;
  totalGeral: number;
};

export type QuinzenaReport = {
  funcionarios: FuncionarioQuinzenaReport[];
  totais: {
    diasPresentes: number;
    diasFalta: number;
    diasRefeicaoDinheiro: number;
    valorRefeicaoTotal: number;
    valorMerendaTotal: number;
    valorDeslocamentoTotal: number;
    totalGeral: number;
  };
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
        diasRefeicaoDinheiro: 0,
        valorRefeicaoTotal: 0,
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

    if (registro.tipoRefeicao === "DINHEIRO") {
      linha.diasRefeicaoDinheiro += 1;
    }

    linha.valorRefeicaoTotal += registro.custoRefeicao;
    linha.valorMerendaTotal += registro.custoMerenda;
    linha.valorDeslocamentoTotal += registro.valorDeslocamento;
  }

  const funcionariosReport = Array.from(acumuladoPorFuncionario.values())
    .map((linha) => ({
      ...linha,
      totalGeral: linha.valorRefeicaoTotal + linha.valorMerendaTotal + linha.valorDeslocamentoTotal,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const totais = funcionariosReport.reduce(
    (acc, linha) => ({
      diasPresentes: acc.diasPresentes + linha.diasPresentes,
      diasFalta: acc.diasFalta + linha.diasFalta,
      diasRefeicaoDinheiro: acc.diasRefeicaoDinheiro + linha.diasRefeicaoDinheiro,
      valorRefeicaoTotal: acc.valorRefeicaoTotal + linha.valorRefeicaoTotal,
      valorMerendaTotal: acc.valorMerendaTotal + linha.valorMerendaTotal,
      valorDeslocamentoTotal: acc.valorDeslocamentoTotal + linha.valorDeslocamentoTotal,
      totalGeral: acc.totalGeral + linha.totalGeral,
    }),
    {
      diasPresentes: 0,
      diasFalta: 0,
      diasRefeicaoDinheiro: 0,
      valorRefeicaoTotal: 0,
      valorMerendaTotal: 0,
      valorDeslocamentoTotal: 0,
      totalGeral: 0,
    }
  );

  return { funcionarios: funcionariosReport, totais };
}
