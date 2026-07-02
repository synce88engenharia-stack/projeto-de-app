"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDateBR } from "@/lib/date";

type Obra = { id: string; nome: string };

type Funcionario = {
  id: string;
  nome: string;
  funcao: string;
  status: "ATIVO" | "DESLIGADO";
  dataAdmissao: string;
  dataDesligamento: string | null;
  obra: { id: string; nome: string };
};

export function FuncionariosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const obraFilter = searchParams.get("obra") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  const [obras, setObras] = useState<Obra[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/obras?status=todas")
      .then((r) => r.json())
      .then(setObras);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (obraFilter) params.set("obraId", obraFilter);
      if (statusFilter) params.set("status", statusFilter);
      const data = await fetch(`/api/funcionarios?${params.toString()}`).then((r) => r.json());
      if (cancelled) return;
      setFuncionarios(data);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [obraFilter, statusFilter]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/funcionarios?${params.toString()}`);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Funcionários</h1>
          <p className="text-sm text-muted mt-1">Cadastro, obra atual e situação de cada funcionário</p>
        </div>
        <Link
          href="/funcionarios/novo"
          className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md px-3.5 py-2"
        >
          + Novo funcionário
        </Link>
      </div>

      <div className="flex gap-2.5 mb-4 flex-wrap">
        <select
          value={obraFilter}
          onChange={(e) => updateFilter("obra", e.target.value)}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm bg-panel"
        >
          <option value="">Todas as obras</option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm bg-panel"
        >
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="DESLIGADO">Desligados</option>
        </select>
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr>
                {["Funcionário", "Função", "Obra", "Admissão", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] uppercase tracking-wide text-muted font-bold px-3.5 py-2.5 border-b border-line whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-3.5 py-6 text-center text-muted text-sm">
                    Carregando…
                  </td>
                </tr>
              )}
              {!loading && funcionarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3.5 py-6 text-center text-muted text-sm">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              )}
              {funcionarios.map((f) => (
                <tr key={f.id} className="hover:bg-[#f0f5fa]">
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">{f.nome}</td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">{f.funcao}</td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">{f.obra.nome}</td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5] font-mono tabular-nums">
                    {formatDateBR(new Date(f.dataAdmissao))}
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                    {f.status === "ATIVO" ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-success-bg text-success">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-danger-bg text-danger">
                        Desligado{f.dataDesligamento ? ` — ${formatDateBR(new Date(f.dataDesligamento))}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                    <Link
                      href={`/funcionarios/${f.id}`}
                      className="border border-line rounded-md px-3 py-1 text-xs font-semibold hover:border-[#aac0da]"
                    >
                      Ver
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
