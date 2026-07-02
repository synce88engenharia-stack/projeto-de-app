"use client";

import { useEffect, useMemo, useState } from "react";

type Obra = { id: string; nome: string };

type FuncionarioReport = {
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

type ReportResponse = {
  funcionarios: FuncionarioReport[];
  totais: Omit<FuncionarioReport, "funcionarioId" | "nome" | "funcao">;
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function buildQuinzenaOptions() {
  const options: { id: string; label: string }[] = [];
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1; // 1-12

  for (let i = 0; i < 8; i++) {
    const mm = String(month).padStart(2, "0");
    options.push({ id: `${year}-${mm}-Q2`, label: `16–fim de ${MESES[month - 1]} ${year}` });
    options.push({ id: `${year}-${mm}-Q1`, label: `1–15 de ${MESES[month - 1]} ${year}` });
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return options;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function RelatorioQuinzenalPage() {
  const quinzenaOptions = useMemo(() => buildQuinzenaOptions(), []);
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [quinzena, setQuinzena] = useState(quinzenaOptions[0]?.id ?? "");
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/obras?status=todas")
      .then((r) => r.json())
      .then((list: Obra[]) => {
        setObras(list);
        if (list.length > 0) setObraId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (!obraId || !quinzena) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const data = await fetch(`/api/relatorios/quinzenal?obraId=${obraId}&quinzena=${quinzena}`).then((r) =>
        r.json()
      );
      if (cancelled) return;
      setReport(data);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [obraId, quinzena]);

  function exportCsv() {
    if (!report) return;
    const header = [
      "Funcionário",
      "Função",
      "Presenças",
      "Faltas",
      "Dias refeição $",
      "Refeição a pagar",
      "Merenda",
      "Deslocamento",
      "Total geral",
    ];
    const rows = report.funcionarios.map((f) => [
      f.nome,
      f.funcao,
      f.diasPresentes,
      f.diasFalta,
      f.diasRefeicaoDinheiro,
      f.valorRefeicaoTotal.toFixed(2),
      f.valorMerendaTotal.toFixed(2),
      f.valorDeslocamentoTotal.toFixed(2),
      f.totalGeral.toFixed(2),
    ]);
    const csv = [header, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-quinzenal-${quinzena}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Relatório quinzenal</h1>
          <p className="text-sm text-muted mt-1">Fechamento de pagamento por funcionário</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!report || report.funcionarios.length === 0}
          className="border border-line rounded-md px-3.5 py-2 text-sm font-semibold hover:border-[#aac0da] disabled:opacity-50"
        >
          Exportar CSV
        </button>
      </div>

      <div className="flex gap-2.5 mb-4 flex-wrap">
        <select
          value={obraId}
          onChange={(e) => setObraId(e.target.value)}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm bg-panel"
        >
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
        <select
          value={quinzena}
          onChange={(e) => setQuinzena(e.target.value)}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm bg-panel"
        >
          {quinzenaOptions.map((q) => (
            <option key={q.id} value={q.id}>
              {q.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[860px]">
            <thead>
              <tr>
                {["Funcionário", "Presenças", "Faltas", "Dias refeição $", "Refeição a pagar", "Merenda", "Deslocamento", "Total geral"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`text-[11px] uppercase tracking-wide text-muted font-bold px-3.5 py-2.5 border-b border-line whitespace-nowrap ${
                        i === 0 ? "text-left" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-3.5 py-6 text-center text-muted text-sm">
                    Carregando…
                  </td>
                </tr>
              )}
              {!loading && report && report.funcionarios.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3.5 py-6 text-center text-muted text-sm">
                    Nenhum lançamento nesta quinzena para esta obra.
                  </td>
                </tr>
              )}
              {!loading &&
                report &&
                report.funcionarios.map((f) => (
                  <tr key={f.funcionarioId} className="hover:bg-[#f0f5fa]">
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">{f.nome}</td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                      {f.diasPresentes}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                      {f.diasFalta}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                      {f.diasRefeicaoDinheiro}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                      {formatCurrency(f.valorRefeicaoTotal)}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                      {formatCurrency(f.valorMerendaTotal)}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                      {formatCurrency(f.valorDeslocamentoTotal)}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums font-semibold">
                      {formatCurrency(f.totalGeral)}
                    </td>
                  </tr>
                ))}
              {!loading && report && report.funcionarios.length > 0 && (
                <tr className="bg-[#eef3f9] font-bold border-t-2 border-ink">
                  <td className="px-3.5 py-2.5">Total — {report.funcionarios.length} funcionário(s)</td>
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">{report.totais.diasPresentes}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">{report.totais.diasFalta}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">{report.totais.diasRefeicaoDinheiro}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                    {formatCurrency(report.totais.valorRefeicaoTotal)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                    {formatCurrency(report.totais.valorMerendaTotal)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                    {formatCurrency(report.totais.valorDeslocamentoTotal)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                    {formatCurrency(report.totais.totalGeral)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
