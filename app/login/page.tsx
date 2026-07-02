"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (response.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => null);
    setError(data?.error ?? "Não foi possível entrar.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm bg-panel border border-line rounded-lg p-8 text-center">
        <div className="w-11 h-11 bg-accent rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-extrabold">
          CO
        </div>
        <h1 className="text-lg font-extrabold text-ink">Controle de Obra</h1>
        <p className="text-sm text-muted mt-1 mb-6">Acesso restrito à administração</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
          <div>
            <label htmlFor="username" className="sr-only">
              Usuário
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
              required
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-md py-2.5 disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
