"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Obra = { id: string; nome: string };

export default function NovoFuncionarioPage() {
  const router = useRouter();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/obras?status=ativas")
      .then((r) => r.json())
      .then((data: Obra[]) => {
        setObras(data);
        if (data.length > 0) setObraId(data[0].id);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const response = await fetch("/api/funcionarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obraId, nome, funcao, dataAdmissao }),
    });

    setSaving(false);

    if (response.ok) {
      router.push("/funcionarios");
      return;
    }

    const data = await response.json().catch(() => null);
    setError(data?.error ?? "Não foi possível salvar o funcionário.");
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/funcionarios" className="text-sm text-muted hover:text-ink">
          ← Funcionários
        </Link>
        <h1 className="text-xl font-extrabold text-ink mt-2">Novo funcionário</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Obra</label>
          <select
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            required
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent bg-panel"
          >
            {obras.length === 0 && <option value="">Nenhuma obra ativa</option>}
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Nome completo"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Função</label>
          <input
            value={funcao}
            onChange={(e) => setFuncao(e.target.value)}
            required
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Ex: Pedreiro, Servente, Eletricista"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Data de admissão</label>
          <input
            type="date"
            value={dataAdmissao}
            onChange={(e) => setDataAdmissao(e.target.value)}
            required
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent font-mono"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2 mt-1">
          <button
            type="submit"
            disabled={saving || obras.length === 0}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar funcionário"}
          </button>
          <Link
            href="/funcionarios"
            className="border border-line rounded-md px-4 py-2 text-sm font-semibold flex items-center hover:border-[#aac0da]"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
