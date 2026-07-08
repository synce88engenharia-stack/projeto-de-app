"use client";

import { useEffect, useState } from "react";
import { formatDateBR } from "@/lib/date";

type Obra = { id: string; nome: string };
type Membro = { id: string; nome: string; funcao: string };
type DiaRdo = { data: string; atividades: string; equipe: Membro[] };

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

export default function RdoRelatorioPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [{ from, to }, setRange] = useState(defaultRange);
  const [dias, setDias] = useState<DiaRdo[] | null>(null);
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
      const res: { dias: DiaRdo[] } = await fetch(
        `/api/rdo/relatorio?obraId=${obraId}&from=${from}&to=${to}`
      ).then((r) => r.json());
      if (cancelled) return;
      setDias(res.dias);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [obraId, from, to]);

  function exportCsv() {
    if (!dias) return;
    const header = ["Data", "Atividades", "Equipe"];
    const rows = dias.map((d) => [
      formatDateBR(new Date(d.data)),
      d.atividades.replace(/\n/g, " "),
      d.equipe.map((m) => m.nome).join(", "),
    ]);
    const csv = [header, ...rows].map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rdo-${from}-a-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Relatório de RDO</h1>
          <p className="text-sm text-muted mt-1">Atividades e equipe por dia, no período escolhido</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!dias || dias.length === 0}
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

      {loading && <p className="text-sm text-muted">Carregando…</p>}

      {!loading && dias && dias.length === 0 && (
        <div className="bg-panel border border-line rounded-lg px-5 py-6 text-center text-sm text-muted">
          Nenhum RDO preenchido neste período para esta obra.
        </div>
      )}

      {!loading && dias && dias.length > 0 && (
        <div className="flex flex-col gap-3">
          {dias.map((d) => (
            <div key={d.data} className="bg-panel border border-line rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono tabular-nums font-semibold text-ink">{formatDateBR(new Date(d.data))}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success">
                  {d.equipe.length} na equipe
                </span>
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap mb-3">{d.atividades || "—"}</p>
              {d.equipe.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {d.equipe.map((m) => (
                    <span
                      key={m.id}
                      className="text-xs bg-[#eef3f9] text-ink rounded-full px-2.5 py-1"
                    >
                      {m.nome}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
