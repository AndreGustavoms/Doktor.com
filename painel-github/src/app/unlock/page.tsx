"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api-client";

export default function UnlockPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost("/api/auth/unlock", { password });
      router.push("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao destravar o painel.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-center font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
          Painel bloqueado
        </p>
        <h1 className="mb-8 text-center font-(family-name:--font-display) text-2xl font-bold text-chalk">
          Digite a senha mestra
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-ink-600 bg-ink-900 px-3 py-2.5 text-center text-chalk outline-none focus-visible:border-blueprint"
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="text-center text-sm text-coral">{error}</p>}
          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="rounded bg-blueprint px-4 py-2.5 font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Destravando…" : "Destravar"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-chalk-dim">
          Não existe recuperação de senha. Se você a perdeu, refaça o setup com um token novo.
        </p>
      </div>
    </main>
  );
}
