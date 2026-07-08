"use client";

import { useEffect, useState } from "react";

export default function ConfiguracoesPage() {
  const [valorRefeicao, setValorRefeicao] = useState("14.00");
  const [valorMerenda, setValorMerenda] = useState("6.00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [corrigindo, setCorrigindo] = useState(false);
  const [resultadoCorrecao, setResultadoCorrecao] = useState<string | null>(null);

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

  async function handleCorrigirAlmoco() {
    setCorrigindo(true);
    setResultadoCorrecao(null);
    const response = await fetch("/api/admin/corrigir-almoco", { method: "POST" });
    setCorrigindo(false);
    if (response.ok) {
      const data: { corrigidos: number; valorAplicado: number } = await response.json();
      setResultadoCorrecao(
        data.corrigidos > 0
          ? `${data.corrigidos} lançamento(s) de almoço corrigido(s) para R$ ${data.valorAplicado.toFixed(2)}.`
          : "Nenhum lançamento pendente de correção — tudo já está certo."
      );
    } else {
      setResultadoCorrecao("Não foi possível corrigir os lançamentos.");
    }
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

      <div className="bg-panel border border-line rounded-lg p-6 mt-5">
        <h3 className="text-sm font-bold text-ink mb-1">Correção pontual: almoço histórico</h3>
        <p className="text-sm text-muted mb-3">
          Lançamentos de &quot;Almoço&quot; salvos antes da mudança que passou a contar R$14 para a empresa (igual ao
          Vale) ficaram com valor R$0. Clique abaixo para corrigir esses lançamentos antigos de uma vez. Seguro de
          rodar mais de uma vez — só corrige o que ainda estiver em R$0.
        </p>
        <button
          onClick={handleCorrigirAlmoco}
          disabled={corrigindo}
          className="border border-line rounded-md px-4 py-2 text-sm font-semibold hover:border-[#aac0da] disabled:opacity-60"
        >
          {corrigindo ? "Corrigindo…" : "Corrigir lançamentos antigos de almoço"}
        </button>
        {resultadoCorrecao && <p className="text-sm text-muted mt-2.5">{resultadoCorrecao}</p>}
      </div>
    </div>
  );
}
