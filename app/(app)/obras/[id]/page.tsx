"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StatusFuncionario } from "@/lib/funcionario";
import { StatusFuncionarioPill } from "@/components/StatusFuncionarioPill";

type Funcionario = {
  id: string;
  nome: string;
  funcao: string;
  status: StatusFuncionario;
};

type ObraDetail = {
  id: string;
  nome: string;
  endereco: string | null;
  descricao: string | null;
  ativa: boolean;
  funcionarios: Funcionario[];
};

export default function EditarObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();

  const [obra, setObra] = useState<ObraDetail | null>(null);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/obras/${id}`)
      .then((r) => r.json())
      .then((data: ObraDetail) => {
        setObra(data);
        setNome(data.nome);
        setEndereco(data.endereco ?? "");
        setDescricao(data.descricao ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const response = await fetch(`/api/obras/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, endereco: endereco || null, descricao: descricao || null }),
    });
    setSaving(false);
    if (response.ok) {
      router.push("/obras");
      return;
    }
    const data = await response.json().catch(() => null);
    setError(data?.error ?? "Não foi possível salvar.");
  }

  async function toggleAtiva() {
    if (!obra) return;
    const response = await fetch(`/api/obras/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativa: !obra.ativa }),
    });
    if (response.ok) {
      const updated = await response.json();
      setObra({ ...obra, ativa: updated.ativa });
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Carregando…</p>;
  }

  if (!obra) {
    return <p className="text-sm text-danger">Obra não encontrada.</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/obras" className="text-sm text-muted hover:text-ink">
          ← Obras
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-xl font-extrabold text-ink">{obra.nome}</h1>
          {obra.ativa ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-success-bg text-success">Ativa</span>
          ) : (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#e6edf5] text-muted">Inativa</span>
          )}
        </div>
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
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Endereço</label>
          <input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2 mt-1">
          <button
            type="submit"
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
          <button
            type="button"
            onClick={toggleAtiva}
            className="border border-line rounded-md px-4 py-2 text-sm font-semibold hover:border-[#aac0da]"
          >
            {obra.ativa ? "Desativar obra" : "Reativar obra"}
          </button>
        </div>
      </form>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="text-sm font-bold text-ink">Funcionários desta obra</h3>
          <Link href={`/funcionarios?obra=${obra.id}`} className="text-xs font-semibold text-accent hover:underline">
            Ver todos
          </Link>
        </div>
        {obra.funcionarios.length === 0 ? (
          <p className="text-sm text-muted px-4 py-4">Nenhum funcionário cadastrado nesta obra ainda.</p>
        ) : (
          <ul className="divide-y divide-[#e6edf5]">
            {obra.funcionarios.map((f) => (
              <li key={f.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <span>
                  {f.nome} <span className="text-muted">— {f.funcao}</span>
                </span>
                <StatusFuncionarioPill status={f.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
