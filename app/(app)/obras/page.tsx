"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Obra = {
  id: string;
  nome: string;
  endereco: string | null;
  ativa: boolean;
  _count: { funcionarios: number };
};

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [status, setStatus] = useState("todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const query = status === "todas" ? "" : `?status=${status}`;
      const data = await fetch(`/api/obras${query}`).then((r) => r.json());
      if (!cancelled) {
        setObras(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Obras</h1>
          <p className="text-sm text-muted mt-1">Cadastre e gerencie as obras da empresa</p>
        </div>
        <Link
          href="/obras/nova"
          className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md px-3.5 py-2"
        >
          + Nova obra
        </Link>
      </div>

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm bg-panel"
        >
          <option value="todas">Todas as obras</option>
          <option value="ativas">Ativas</option>
          <option value="inativas">Inativas</option>
        </select>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left text-[11px] uppercase tracking-wide text-muted font-bold px-3.5 py-2.5 border-b border-line">
                  Nome
                </th>
                <th className="text-left text-[11px] uppercase tracking-wide text-muted font-bold px-3.5 py-2.5 border-b border-line">
                  Endereço
                </th>
                <th className="text-right text-[11px] uppercase tracking-wide text-muted font-bold px-3.5 py-2.5 border-b border-line">
                  Funcionários ativos
                </th>
                <th className="text-left text-[11px] uppercase tracking-wide text-muted font-bold px-3.5 py-2.5 border-b border-line">
                  Status
                </th>
                <th className="px-3.5 py-2.5 border-b border-line"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3.5 py-6 text-center text-muted text-sm">
                    Carregando…
                  </td>
                </tr>
              )}
              {!loading && obras.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3.5 py-6 text-center text-muted text-sm">
                    Nenhuma obra cadastrada ainda.
                  </td>
                </tr>
              )}
              {obras.map((obra) => (
                <tr key={obra.id} className="hover:bg-[#f0f5fa]">
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">{obra.nome}</td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-muted">{obra.endereco ?? "—"}</td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right font-mono tabular-nums">
                    {obra._count.funcionarios}
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                    {obra.ativa ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-success-bg text-success">
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#e6edf5] text-muted">
                        Inativa
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                    <Link
                      href={`/obras/${obra.id}`}
                      className="border border-line rounded-md px-3 py-1 text-xs font-semibold hover:border-[#aac0da]"
                    >
                      Editar
                    </Link>
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
