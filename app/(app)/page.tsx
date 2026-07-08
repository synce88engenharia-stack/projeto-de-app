import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { todayDayKey, formatDateBR } from "@/lib/date";
import { getQuinzenaId, getQuinzenaRange } from "@/lib/quinzena";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage() {
  const today = todayDayKey();
  const quinzenaAtual = getQuinzenaId(today);
  const range = getQuinzenaRange(quinzenaAtual);

  const [obrasAtivas, obrasInativasCount, funcionariosAtivosCount, agregadoQuinzena] = await Promise.all([
    prisma.obra.findMany({
      where: { ativa: true },
      orderBy: { nome: "asc" },
      include: { _count: { select: { funcionarios: { where: { status: "ATIVO" } } } } },
    }),
    prisma.obra.count({ where: { ativa: false } }),
    prisma.funcionario.count({ where: { status: "ATIVO" } }),
    prisma.registroDiario.aggregate({
      where: { data: { gte: range.start, lte: range.end } },
      _sum: { custoRefeicao: true, custoMerenda: true, valorDeslocamento: true },
    }),
  ]);

  const obrasComContagemHoje = await Promise.all(
    obrasAtivas.map(async (obra) => {
      const lancadosHoje = await prisma.registroDiario.count({ where: { obraId: obra.id, data: today } });
      return { ...obra, lancadosHoje };
    })
  );

  const totalAtivosHoje = obrasComContagemHoje.reduce((acc, o) => acc + o._count.funcionarios, 0);
  const totalLancadosHoje = obrasComContagemHoje.reduce((acc, o) => acc + o.lancadosHoje, 0);

  const totalAPagarQuinzena =
    (agregadoQuinzena._sum.custoRefeicao ?? 0) +
    (agregadoQuinzena._sum.custoMerenda ?? 0) +
    (agregadoQuinzena._sum.valorDeslocamento ?? 0);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Dashboard</h1>
          <p className="text-sm text-muted mt-1">Visão geral de hoje, {formatDateBR(today)}</p>
        </div>
        <Link
          href="/lancamento"
          className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md px-3.5 py-2"
        >
          Lançar o dia
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-panel border border-line rounded-lg px-4.5 py-4">
          <div className="text-[11px] uppercase tracking-wide text-muted font-bold">Obras ativas</div>
          <div className="font-mono tabular-nums text-2xl font-semibold mt-2">{obrasAtivas.length}</div>
          <div className="text-xs text-muted mt-1.5">{obrasInativasCount} obra(s) inativa(s) no histórico</div>
        </div>
        <div className="bg-panel border border-line rounded-lg px-4.5 py-4">
          <div className="text-[11px] uppercase tracking-wide text-muted font-bold">Funcionários ativos</div>
          <div className="font-mono tabular-nums text-2xl font-semibold mt-2">{funcionariosAtivosCount}</div>
        </div>
        <div className="bg-panel border border-line rounded-lg px-4.5 py-4">
          <div className="text-[11px] uppercase tracking-wide text-muted font-bold">Lançados hoje</div>
          <div className="font-mono tabular-nums text-2xl font-semibold mt-2">
            {totalLancadosHoje}/{totalAtivosHoje}
          </div>
          <div className="text-xs text-success mt-1.5">
            {totalAtivosHoje > 0 ? Math.round((totalLancadosHoje / totalAtivosHoje) * 100) : 0}% das obras já lançaram
          </div>
        </div>
        <div className="bg-panel border border-line rounded-lg px-4.5 py-4">
          <div className="text-[11px] uppercase tracking-wide text-muted font-bold">Custo — quinzena atual</div>
          <div className="font-mono tabular-nums text-2xl font-semibold mt-2">{formatCurrency(totalAPagarQuinzena)}</div>
          <div className="text-xs text-muted mt-1.5">Almoço + vale + merenda + deslocamento</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-line">
          <h3 className="text-sm font-bold text-ink">Lançamento de hoje por obra</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr>
                {["Obra", "Funcionários ativos", "Lançados hoje", "Status", ""].map((h, i) => (
                  <th
                    key={h}
                    className={`text-[11px] uppercase tracking-wide text-muted font-bold px-3.5 py-2.5 border-b border-line whitespace-nowrap ${
                      i === 1 || i === 2 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {obrasComContagemHoje.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3.5 py-6 text-center text-muted text-sm">
                    Nenhuma obra ativa cadastrada ainda.
                  </td>
                </tr>
              )}
              {obrasComContagemHoje.map((obra) => {
                const completo = obra._count.funcionarios > 0 && obra.lancadosHoje >= obra._count.funcionarios;
                return (
                  <tr key={obra.id} className="hover:bg-[#f0f5fa]">
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">{obra.nome}</td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                      {obra._count.funcionarios}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                      {obra.lancadosHoje}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                      {completo ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-success-bg text-success">
                          Completo
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-warning-bg text-warning">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                      <Link
                        href="/lancamento"
                        className="border border-line rounded-md px-3 py-1 text-xs font-semibold hover:border-[#aac0da]"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
