"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateBR } from "@/lib/date";
import { STATUS_FUNCIONARIO, STATUS_FUNCIONARIO_LABEL, type StatusFuncionario } from "@/lib/funcionario";
import { StatusFuncionarioPill } from "@/components/StatusFuncionarioPill";

type FuncionarioDetail = {
  id: string;
  nome: string;
  funcao: string;
  status: StatusFuncionario;
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
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendenteDesligar, setPendenteDesligar] = useState(false);
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

  async function handleStatusChange(novoStatus: StatusFuncionario) {
    setStatusError(null);
    if (novoStatus === "DESLIGADO") {
      setPendenteDesligar(true);
      return;
    }
    setPendenteDesligar(false);
    const response = await fetch(`/api/funcionarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    if (response.ok) {
      load();
    } else {
      const data = await response.json().catch(() => null);
      setStatusError(data?.error ?? "Não foi possível atualizar o status.");
    }
  }

  async function confirmDesligar() {
    const response = await fetch(`/api/funcionarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DESLIGADO", dataDesligamento }),
    });
    if (response.ok) {
      setPendenteDesligar(false);
      load();
    } else {
      const data = await response.json().catch(() => null);
      setStatusError(data?.error ?? "Não foi possível desligar o funcionário.");
    }
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
          <StatusFuncionarioPill status={funcionario.status} dataDesligamento={funcionario.dataDesligamento} />
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
        </div>
      </form>

      <div className="bg-panel border border-line rounded-lg p-6">
        <h3 className="text-sm font-bold text-ink mb-1">Situação</h3>
        <p className="text-sm text-muted mb-3">
          Funcionários fora de &quot;Ativo&quot; não aparecem no lançamento diário nem no RDO. O histórico é mantido em
          qualquer situação.
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_FUNCIONARIO.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatusChange(s)}
              disabled={s === funcionario.status}
              className={`text-sm font-semibold rounded-md px-3.5 py-2 border ${
                s === funcionario.status
                  ? "bg-ink text-white border-ink cursor-default"
                  : "border-line hover:border-[#aac0da]"
              }`}
            >
              {STATUS_FUNCIONARIO_LABEL[s]}
            </button>
          ))}
        </div>
        {statusError && <p className="text-sm text-danger mt-3">{statusError}</p>}

        {pendenteDesligar && (
          <div className="mt-4 border-t border-line pt-4">
            <h4 className="text-sm font-bold text-ink mb-2">Confirmar desligamento</h4>
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
                onClick={() => setPendenteDesligar(false)}
                className="border border-line rounded-md px-4 py-2 text-sm font-semibold hover:border-[#aac0da]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
