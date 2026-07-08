"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { formatDateBR } from "@/lib/date";

type LinhaHistorico = {
  data: string;
  presenca: boolean;
  tipoRefeicao: "EM_ESPECIE" | "DINHEIRO" | null;
  custoRefeicao: number;
  merendaRecebida: boolean;
  custoMerenda: number;
  valorDeslocamento: number;
  totalDia: number;
  acumulado: number;
};

type HistoricoResponse = {
  funcionario: { id: string; nome: string; funcao: string };
  from: string;
  to: string;
  linhas: LinhaHistorico[];
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toInputDate(iso: string) {
  return iso.slice(0, 10);
}

export default function HistoricoFuncionarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);

  const [historico, setHistorico] = useState<HistoricoResponse | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      setLoading(true);
      const data: HistoricoResponse = await fetch(`/api/funcionarios/${id}/historico?${params.toString()}`).then(
        (r) => r.json()
      );
      if (cancelled) return;
      setHistorico(data);
      if (!from) setFrom(toInputDate(data.from));
      if (!to) setTo(toInputDate(data.to));
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function reload() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/funcionarios/${id}/historico?${params.toString()}`)
      .then((r) => r.json())
      .then(setHistorico)
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/funcionarios/${id}`} className="text-sm text-muted hover:text-ink">
          ← {historico?.funcionario.nome ?? "Funcionário"}
        </Link>
        <h1 className="text-xl font-extrabold text-ink mt-2">Histórico de lançamentos</h1>
      </div>

      <div className="flex gap-2.5 mb-4 flex-wrap items-center">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm font-mono"
        />
        <span className="text-sm text-muted">até</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm font-mono"
        />
        <button
          onClick={reload}
          className="border border-line rounded-md px-3.5 py-1.5 text-sm font-semibold hover:border-[#aac0da]"
        >
          Filtrar
        </button>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr>
                {["Data", "Presença", "Refeição", "Merenda", "Deslocamento", "Total do dia", "Acumulado"].map((h, i) => (
                  <th
                    key={h}
                    className={`text-[11px] uppercase tracking-wide text-muted font-bold px-3.5 py-2.5 border-b border-line whitespace-nowrap ${
                      i >= 4 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-3.5 py-6 text-center text-muted text-sm">
                    Carregando…
                  </td>
                </tr>
              )}
              {!loading && historico && historico.linhas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3.5 py-6 text-center text-muted text-sm">
                    Nenhum lançamento no período.
                  </td>
                </tr>
              )}
              {!loading &&
                historico &&
                historico.linhas.map((l) => (
                  <tr key={l.data} className="hover:bg-[#f0f5fa]">
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] font-mono tabular-nums">
                      {formatDateBR(new Date(l.data))}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                      {l.presenca ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success">
                          Presente
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-danger-bg text-danger">
                          Falta
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                      {l.tipoRefeicao === "DINHEIRO"
                        ? "Vale"
                        : l.tipoRefeicao === "EM_ESPECIE"
                          ? "Almoço"
                          : "—"}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">{l.merendaRecebida ? "Sim" : "Não"}</td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                      {formatCurrency(l.valorDeslocamento)}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums font-semibold">
                      {formatCurrency(l.totalDia)}
                    </td>
                    <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums text-muted">
                      {formatCurrency(l.acumulado)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
