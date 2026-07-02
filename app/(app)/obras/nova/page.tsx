"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovaObraPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const response = await fetch("/api/obras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, endereco: endereco || null, descricao: descricao || null }),
    });

    setSaving(false);

    if (response.ok) {
      router.push("/obras");
      return;
    }

    const data = await response.json().catch(() => null);
    setError(data?.error ?? "Não foi possível salvar a obra.");
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/obras" className="text-sm text-muted hover:text-ink">
          ← Obras
        </Link>
        <h1 className="text-xl font-extrabold text-ink mt-2">Nova obra</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label htmlFor="nome" className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Nome
          </label>
          <input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Ex: Residencial Vista Verde"
          />
        </div>
        <div>
          <label htmlFor="endereco" className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Endereço
          </label>
          <input
            id="endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Rua, número, bairro"
          />
        </div>
        <div>
          <label htmlFor="descricao" className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Descrição
          </label>
          <textarea
            id="descricao"
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
            {saving ? "Salvando…" : "Salvar obra"}
          </button>
          <Link
            href="/obras"
            className="border border-line rounded-md px-4 py-2 text-sm font-semibold flex items-center hover:border-[#aac0da]"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
