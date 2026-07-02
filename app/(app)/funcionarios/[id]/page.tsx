"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateBR } from "@/lib/date";

type FuncionarioDetail = {
  id: string;
  nome: string;
  funcao: string;
  status: "ATIVO" | "DESLIGADO";
  dataAdmissao: string;
  dataDesligamento: string | null;
  obra: { id: string; nome: string };
};

export default function FuncionarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();

  const [funcionario, setFuncionario] = useState<FuncionarioDetail | null>(null);
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDesligar, setShowDesligar] = useState(false);
  const [dataDesligamento, setDataDesligamento] = useState(() => new Date().toISOString().slice(0, 10));

  function load() {
    fetch(`/api/funcionarios/${id}`)
      .then((r) => r.json())
      .then((data: FuncionarioDetail) => {
        setFuncionario(data);
        setNome(data.nome);
        setFuncao(data.funcao);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const response = await fetch(`/api/funcionarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, funcao }),
    });
    setSaving(false);
    if (response.ok) {
      router.push("/funcionarios");
      return;
    }
    const data = await response.json().catch(() => null);
    setError(data?.error ?? "Não foi possível salvar.");
  }

  async function confirmDesligar() {
    const response = await fetch(`/api/funcionarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DESLIGADO", dataDesligamento }),
    });
    if (response.ok) {
      setShowDesligar(false);
      load();
    }
  }

  async function reativar() {
    const response = await fetch(`/api/funcionarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ATIVO" }),
    });
    if (response.ok) load();
  }

  if (loading) return <p className="text-sm text-muted">Carregando…</p>;
  if (!funcionario) return <p className="text-sm text-danger">Funcionário não encontrado.</p>;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/funcionarios" className="text-sm text-muted hover:text-ink">
          ← Funcionários
        </Link>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <h1 className="text-xl font-extrabold text-ink">{funcionario.nome}</h1>
          {funcionario.status === "ATIVO" ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-success-bg text-success">Ativo</span>
          ) : (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-danger-bg text-danger">
              Desligado{funcionario.dataDesligamento ? ` — ${formatDateBR(new Date(funcionario.dataDesligamento))}` : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-muted mt-1">
          {funcionario.obra.nome} · Admitido em {formatDateBR(new Date(funcionario.dataAdmissao))}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-lg p-6 flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Função</label>
          <input
            value={funcao}
            onChange={(e) => setFuncao(e.target.value)}
            required
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2 mt-1 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
          <Link
            href={`/funcionarios/${id}/historico`}
            className="border border-line rounded-md px-4 py-2 text-sm font-semibold flex items-center hover:border-[#aac0da]"
          >
            Ver histórico
          </Link>
          {funcionario.status === "ATIVO" ? (
            <button
              type="button"
              onClick={() => setShowDesligar(true)}
              className="border border-danger text-danger rounded-md px-4 py-2 text-sm font-semibold hover:bg-danger-bg"
            >
              Marcar como desligado
            </button>
          ) : (
            <button
              type="button"
              onClick={reativar}
              className="border border-line rounded-md px-4 py-2 text-sm font-semibold hover:border-[#aac0da]"
            >
              Reativar
            </button>
          )}
        </div>
      </form>

      {showDesligar && (
        <div className="bg-panel border border-danger rounded-lg p-5">
          <h3 className="text-sm font-bold text-ink mb-2">Confirmar desligamento</h3>
          <p className="text-sm text-muted mb-3">
            O funcionário deixará de aparecer no lançamento diário. O histórico é mantido.
          </p>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Data de desligamento
          </label>
          <input
            type="date"
            value={dataDesligamento}
            onChange={(e) => setDataDesligamento(e.target.value)}
            className="border border-line rounded-md px-3 py-2 text-sm font-mono mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={confirmDesligar}
              className="bg-danger hover:opacity-90 text-white text-sm font-semibold rounded-md px-4 py-2"
            >
              Confirmar desligamento
            </button>
            <button
              onClick={() => setShowDesligar(false)}
              className="border border-line rounded-md px-4 py-2 text-sm font-semibold hover:border-[#aac0da]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
