import { describe, it, expect } from "vitest";
import { computeQuinzenaReport, type RegistroDiarioLike, type FuncionarioLike } from "./relatorio";

const funcionarios: FuncionarioLike[] = [
  { id: "f1", nome: "Carlos Silva", funcao: "Mestre de obras" },
  { id: "f2", nome: "Ana Souza", funcao: "Pedreira" },
  { id: "f3", nome: "Bruno Costa", funcao: "Servente" }, // desligado no meio do período
  { id: "f4", nome: "Diego Lima", funcao: "Eletricista" }, // sem nenhum registro no período
];

function registro(overrides: Partial<RegistroDiarioLike>): RegistroDiarioLike {
  return {
    funcionarioId: "f1",
    presenca: true,
    tipoRefeicao: null,
    custoRefeicao: 0,
    custoMerenda: 0,
    valorDeslocamento: 0,
    ...overrides,
  };
}

describe("computeQuinzenaReport", () => {
  it("soma dias, valores (almoço e vale custam igual pra empresa) e ignora funcionário sem registros", () => {
    const registros: RegistroDiarioLike[] = [
      // f1: 3 dias vale com merenda, 1 dia almoço sem merenda, 1 falta
      registro({ funcionarioId: "f1", presenca: true, tipoRefeicao: "DINHEIRO", custoRefeicao: 14, custoMerenda: 6, valorDeslocamento: 10 }),
      registro({ funcionarioId: "f1", presenca: true, tipoRefeicao: "DINHEIRO", custoRefeicao: 14, custoMerenda: 6, valorDeslocamento: 10 }),
      registro({ funcionarioId: "f1", presenca: true, tipoRefeicao: "DINHEIRO", custoRefeicao: 14, custoMerenda: 6, valorDeslocamento: 10 }),
      registro({ funcionarioId: "f1", presenca: true, tipoRefeicao: "EM_ESPECIE", custoRefeicao: 14, custoMerenda: 0, valorDeslocamento: 8 }),
      registro({ funcionarioId: "f1", presenca: false }),

      // f2: sempre almoço, sem merenda, sem faltas
      registro({ funcionarioId: "f2", presenca: true, tipoRefeicao: "EM_ESPECIE", custoRefeicao: 14, custoMerenda: 0, valorDeslocamento: 5 }),
      registro({ funcionarioId: "f2", presenca: true, tipoRefeicao: "EM_ESPECIE", custoRefeicao: 14, custoMerenda: 0, valorDeslocamento: 5 }),

      // f3: desligado no meio do período, mas tem histórico e deve aparecer
      registro({ funcionarioId: "f3", presenca: true, tipoRefeicao: "DINHEIRO", custoRefeicao: 14, custoMerenda: 0, valorDeslocamento: 0 }),
      registro({ funcionarioId: "f3", presenca: false }),
    ];

    const report = computeQuinzenaReport(registros, funcionarios);

    expect(report.funcionarios).toHaveLength(3); // f4 fora, sem registros

    const f1 = report.funcionarios.find((f) => f.funcionarioId === "f1")!;
    expect(f1.diasPresentes).toBe(4);
    expect(f1.diasFalta).toBe(1);
    expect(f1.diasVale).toBe(3);
    expect(f1.valorValeTotal).toBe(42); // 3 * 14
    expect(f1.diasAlmoco).toBe(1);
    expect(f1.valorAlmocoTotal).toBe(14);
    expect(f1.valorMerendaTotal).toBe(18); // 3 * 6
    expect(f1.valorDeslocamentoTotal).toBe(38); // 10+10+10+8
    expect(f1.totalGeral).toBe(14 + 42 + 18 + 38);

    const f2 = report.funcionarios.find((f) => f.funcionarioId === "f2")!;
    expect(f2.diasPresentes).toBe(2);
    expect(f2.diasFalta).toBe(0);
    expect(f2.diasAlmoco).toBe(2);
    expect(f2.valorAlmocoTotal).toBe(28); // almoço também custa 14 pra empresa
    expect(f2.diasVale).toBe(0);
    expect(f2.valorValeTotal).toBe(0);
    expect(f2.valorDeslocamentoTotal).toBe(10);
    expect(f2.totalGeral).toBe(28 + 10);

    const f3 = report.funcionarios.find((f) => f.funcionarioId === "f3")!;
    expect(f3.diasPresentes).toBe(1);
    expect(f3.diasFalta).toBe(1);
    expect(f3.diasVale).toBe(1);
    expect(f3.valorValeTotal).toBe(14);
    expect(f3.totalGeral).toBe(14);

    expect(report.funcionarios.find((f) => f.funcionarioId === "f4")).toBeUndefined();

    expect(report.totais).toEqual({
      diasPresentes: f1.diasPresentes + f2.diasPresentes + f3.diasPresentes,
      diasFalta: f1.diasFalta + f2.diasFalta + f3.diasFalta,
      diasAlmoco: f1.diasAlmoco + f2.diasAlmoco + f3.diasAlmoco,
      valorAlmocoTotal: f1.valorAlmocoTotal + f2.valorAlmocoTotal + f3.valorAlmocoTotal,
      diasVale: f1.diasVale + f2.diasVale + f3.diasVale,
      valorValeTotal: f1.valorValeTotal + f2.valorValeTotal + f3.valorValeTotal,
      valorMerendaTotal: f1.valorMerendaTotal + f2.valorMerendaTotal + f3.valorMerendaTotal,
      valorDeslocamentoTotal: f1.valorDeslocamentoTotal + f2.valorDeslocamentoTotal + f3.valorDeslocamentoTotal,
      totalGeral: f1.totalGeral + f2.totalGeral + f3.totalGeral,
    });
  });

  it("retorna listas vazias quando não há registros", () => {
    const report = computeQuinzenaReport([], funcionarios);
    expect(report.funcionarios).toEqual([]);
    expect(report.totais.totalGeral).toBe(0);
  });

  it("ordena funcionários por nome", () => {
    const registros: RegistroDiarioLike[] = [
      registro({ funcionarioId: "f2", presenca: true }),
      registro({ funcionarioId: "f1", presenca: true }),
    ];
    const report = computeQuinzenaReport(registros, funcionarios);
    expect(report.funcionarios.map((f) => f.nome)).toEqual(["Ana Souza", "Carlos Silva"]);
  });
});
