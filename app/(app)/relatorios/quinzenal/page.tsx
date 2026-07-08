"use client";

import { useEffect, useState } from "react";

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

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function defaultRange() {
  const today = new Date();
  const day = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth();
  const start = day <= 15 ? 1 : 16;
  const end = day <= 15 ? 15 : new Date(year, month + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
  return { from: iso(year, month, start), to: iso(year, month, end) };
}

export default function RelatorioQuinzenalPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [{ from, to }, setRange] = useState(defaultRange);
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
    if (!obraId || !from || !to) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const data = await fetch(`/api/relatorios/quinzenal?obraId=${obraId}&from=${from}&to=${to}`).then((r) =>
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
  }, [obraId, from, to]);

  function exportCsv() {
    if (!report) return;
    const header = [
      "Funcionário",
      "Função",
      "Presenças",
      "Faltas",
      "Dias vale",
      "Vale a pagar",
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
    link.download = `relatorio-${from}-a-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Relatório quinzenal</h1>
          <p className="text-sm text-muted mt-1">Fechamento de pagamento por funcionário — escolha o período</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!report || report.funcionarios.length === 0}
          className="border border-line rounded-md px-3.5 py-2 text-sm font-semibold hover:border-[#aac0da] disabled:opacity-50"
        >
          Exportar CSV
        </button>
      </div>

      <div className="flex gap-2.5 mb-4 flex-wrap items-center">
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
        <input
          type="date"
          value={from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm font-mono"
        />
        <span className="text-sm text-muted">até</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm font-mono"
        />
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[860px]">
            <thead>
              <tr>
                {["Funcionário", "Presenças", "Faltas", "Dias vale", "Vale a pagar", "Merenda", "Deslocamento", "Total geral"].map(
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
                    Nenhum lançamento neste período para esta obra.
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
