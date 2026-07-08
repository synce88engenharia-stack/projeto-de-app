"use client";

import { useEffect, useState } from "react";

type Obra = { id: string; nome: string };

type Registro = {
  presenca: boolean;
  tipoRefeicao: "EM_ESPECIE" | "DINHEIRO" | null;
  custoRefeicao: number;
  merendaRecebida: boolean;
  custoMerenda: number;
  valorDeslocamento: number;
};

type Linha = {
  funcionarioId: string;
  nome: string;
  funcao: string;
  presenca: boolean;
  tipoRefeicao: "EM_ESPECIE" | "DINHEIRO" | null;
  merendaRecebida: boolean;
  valorDeslocamento: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function LancamentoPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [data, setData] = useState(todayStr());
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/obras?status=ativas")
      .then((r) => r.json())
      .then((list: Obra[]) => {
        setObras(list);
        if (list.length > 0) setObraId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (!obraId || !data) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setMessage(null);
      const res: { linhas: { funcionario: { id: string; nome: string; funcao: string }; registro: Registro | null }[] } =
        await fetch(`/api/lancamentos?obraId=${obraId}&data=${data}`).then((r) => r.json());
      if (cancelled) return;
      setLinhas(
        res.linhas.map(({ funcionario, registro }) => ({
          funcionarioId: funcionario.id,
          nome: funcionario.nome,
          funcao: funcionario.funcao,
          presenca: registro ? registro.presenca : true,
          tipoRefeicao: registro ? registro.tipoRefeicao : null,
          merendaRecebida: registro ? registro.merendaRecebida || registro.valorDeslocamento > 0 : false,
          valorDeslocamento: registro ? String(registro.valorDeslocamento) : "0",
        }))
      );
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [obraId, data]);

  function updateLinha(funcionarioId: string, patch: Partial<Linha>) {
    setLinhas((prev) => prev.map((l) => (l.funcionarioId === funcionarioId ? { ...l, ...patch } : l)));
  }

  function updateDeslocamento(funcionarioId: string, valor: string) {
    const numero = Number(valor.replace(",", ".")) || 0;
    setLinhas((prev) =>
      prev.map((l) =>
        l.funcionarioId === funcionarioId
          ? { ...l, valorDeslocamento: valor, merendaRecebida: numero > 0 ? true : l.merendaRecebida }
          : l
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/lancamentos/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        obraId,
        data,
        registros: linhas.map((l) => ({
          funcionarioId: l.funcionarioId,
          presenca: l.presenca,
          tipoRefeicao: l.tipoRefeicao,
          merendaRecebida: l.merendaRecebida,
          valorDeslocamento: Number(l.valorDeslocamento.replace(",", ".")) || 0,
        })),
      }),
    });
    setSaving(false);
    if (response.ok) {
      setMessage("Lançamentos salvos com sucesso.");
    } else {
      const err = await response.json().catch(() => null);
      setMessage(err?.error ?? "Não foi possível salvar os lançamentos.");
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Lançamento diário</h1>
          <p className="text-sm text-muted mt-1">Presença, refeição, merenda e deslocamento do dia</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || linhas.length === 0}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md px-3.5 py-2 disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar lançamentos do dia"}
        </button>
      </div>

      <div className="flex gap-2.5 mb-4 flex-wrap items-center">
        <select
          value={obraId}
          onChange={(e) => setObraId(e.target.value)}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm bg-panel"
        >
          {obras.length === 0 && <option value="">Nenhuma obra ativa</option>}
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="border border-line rounded-md px-2.5 py-1.5 text-sm font-mono"
        />
        {message && <span className="text-sm text-muted ml-auto">{message}</span>}
      </div>

      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr>
                {["Funcionário", "Presença", "Refeição", "Merenda", "Deslocamento (R$)"].map((h, i) => (
                  <th
                    key={h}
                    className={`text-[11px] uppercase tracking-wide text-muted font-bold px-3.5 py-2.5 border-b border-line whitespace-nowrap ${
                      i === 4 ? "text-right" : "text-left"
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
                  <td colSpan={5} className="px-3.5 py-6 text-center text-muted text-sm">
                    Carregando…
                  </td>
                </tr>
              )}
              {!loading && linhas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3.5 py-6 text-center text-muted text-sm">
                    Nenhum funcionário ativo nesta obra.
                  </td>
                </tr>
              )}
              {linhas.map((l) => (
                <tr key={l.funcionarioId} className="hover:bg-[#f0f5fa]">
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">{l.nome}</td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                    <button
                      onClick={() => updateLinha(l.funcionarioId, { presenca: !l.presenca })}
                      className={`w-[34px] h-5 rounded-full relative transition-colors ${
                        l.presenca ? "bg-success" : "bg-line"
                      }`}
                      aria-pressed={l.presenca}
                      aria-label="Presença"
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          l.presenca ? "left-4" : "left-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                    <div className="inline-flex border border-line rounded-md overflow-hidden">
                      <button
                        type="button"
                        disabled={!l.presenca}
                        onClick={() => updateLinha(l.funcionarioId, { tipoRefeicao: "EM_ESPECIE" })}
                        className={`text-xs font-bold px-2.5 py-1.5 border-r border-line disabled:opacity-40 ${
                          l.tipoRefeicao === "EM_ESPECIE" ? "bg-ink text-white" : "text-muted"
                        }`}
                      >
                        Almoço
                      </button>
                      <button
                        type="button"
                        disabled={!l.presenca}
                        onClick={() => updateLinha(l.funcionarioId, { tipoRefeicao: "DINHEIRO" })}
                        className={`text-xs font-bold px-2.5 py-1.5 disabled:opacity-40 ${
                          l.tipoRefeicao === "DINHEIRO" ? "bg-ink text-white" : "text-muted"
                        }`}
                      >
                        Vale
                      </button>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5]">
                    {(() => {
                      const numero = Number(l.valorDeslocamento.replace(",", ".")) || 0;
                      const travada = l.presenca && numero > 0;
                      return (
                        <button
                          disabled={!l.presenca || travada}
                          title={travada ? "Incluída automaticamente pelo deslocamento" : undefined}
                          onClick={() => updateLinha(l.funcionarioId, { merendaRecebida: !l.merendaRecebida })}
                          className={`w-[34px] h-5 rounded-full relative transition-colors disabled:opacity-70 ${
                            l.merendaRecebida ? "bg-success" : "bg-line"
                          }`}
                          aria-pressed={l.merendaRecebida}
                          aria-label="Merenda recebida"
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                              l.merendaRecebida ? "left-4" : "left-0.5"
                            }`}
                          />
                        </button>
                      );
                    })()}
                  </td>
                  <td className="px-3.5 py-2.5 border-b border-[#e6edf5] text-right">
                    <input
                      disabled={!l.presenca}
                      value={l.valorDeslocamento}
                      onChange={(e) => updateDeslocamento(l.funcionarioId, e.target.value)}
                      className="w-[90px] text-right font-mono tabular-nums border border-line rounded-md px-2 py-1 text-sm bg-[#f6f9fc] disabled:opacity-40"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted px-1 mt-3">
        Marcar falta desativa refeição, merenda e deslocamento automaticamente. Preencher um valor de deslocamento
        marca a merenda como recebida automaticamente, já que ela vem incluída. Clique em &quot;Salvar lançamentos do
        dia&quot; para gravar todas as linhas de uma vez.
      </p>
    </div>
  );
}
