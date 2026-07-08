"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Obra = { id: string; nome: string };
type Membro = { id: string; nome: string; funcao: string };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function RdoPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState("");
  const [data, setData] = useState(todayStr());
  const [atividades, setAtividades] = useState("");
  const [equipe, setEquipe] = useState<Membro[]>([]);
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
      const res: { atividades: string; equipe: Membro[] } = await fetch(
        `/api/rdo?obraId=${obraId}&data=${data}`
      ).then((r) => r.json());
      if (cancelled) return;
      setAtividades(res.atividades);
      setEquipe(res.equipe);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [obraId, data]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/rdo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obraId, data, atividades }),
    });
    setSaving(false);
    setMessage(response.ok ? "RDO salvo com sucesso." : "Não foi possível salvar o RDO.");
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-ink">RDO — Relatório Diário de Obra</h1>
          <p className="text-sm text-muted mt-1">O que vai ser executado no dia e qual a equipe</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !obraId}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md px-3.5 py-2 disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar RDO do dia"}
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

      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : (
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-5">
          <div className="bg-panel border border-line rounded-lg p-5">
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-2">
              O que vai ser executado no dia
            </label>
            <textarea
              value={atividades}
              onChange={(e) => setAtividades(e.target.value)}
              rows={12}
              placeholder="Ex: concretagem da laje do 2º pavimento, instalação elétrica no bloco B..."
              className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent resize-y"
            />
          </div>

          <div className="bg-panel border border-line rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Equipe do dia</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success">
                {equipe.length}
              </span>
            </div>
            {equipe.length === 0 ? (
              <p className="text-sm text-muted">
                Nenhum funcionário marcado como presente nesta data ainda. Vá em{" "}
                <Link href="/lancamento" className="text-accent hover:underline">
                  Lançamento diário
                </Link>{" "}
                para marcar a presença — a equipe do RDO é preenchida automaticamente a partir de lá.
              </p>
            ) : (
              <ul className="divide-y divide-[#e6edf5]">
                {equipe.map((m) => (
                  <li key={m.id} className="py-2 text-sm">
                    {m.nome} <span className="text-muted">— {m.funcao}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
