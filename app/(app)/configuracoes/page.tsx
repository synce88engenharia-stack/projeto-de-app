"use client";

import { useEffect, useState } from "react";

export default function ConfiguracoesPage() {
  const [valorRefeicao, setValorRefeicao] = useState("14.00");
  const [valorMerenda, setValorMerenda] = useState("6.00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data: { valorRefeicao: number; valorMerenda: number }) => {
        setValorRefeicao(data.valorRefeicao.toFixed(2));
        setValorMerenda(data.valorMerenda.toFixed(2));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valorRefeicao: Number(valorRefeicao.replace(",", ".")),
        valorMerenda: Number(valorMerenda.replace(",", ".")),
      }),
    });
    setSaving(false);
    setMessage(response.ok ? "Configurações salvas." : "Não foi possível salvar.");
  }

  return (
    <div className="max-w-md">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-ink">Configurações</h1>
        <p className="text-sm text-muted mt-1">Valores usados nos novos lançamentos diários</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : (
        <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-lg p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
              Valor da refeição (por dia)
            </label>
            <input
              value={valorRefeicao}
              onChange={(e) => setValorRefeicao(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
              Valor da merenda (por dia)
            </label>
            <input
              value={valorMerenda}
              onChange={(e) => setValorMerenda(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-accent"
            />
          </div>

          {message && <p className="text-sm text-muted">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="self-start bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar configurações"}
          </button>

          <p className="text-xs text-muted -mt-1">
            Alterar aqui só afeta lançamentos novos — dias já lançados mantêm o valor da época, para não corrigir
            relatórios de quinzenas fechadas.
          </p>
        </form>
      )}
    </div>
  );
}
