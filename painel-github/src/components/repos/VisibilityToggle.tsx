"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDestructive } from "@/components/feedback/ConfirmDestructive";
import { apiPut, ApiError } from "@/lib/api-client";

/**
 * Alternar visibilidade — ação destrutiva, exige ALLOW_DESTRUCTIVE=true
 * (checado no servidor) e o nome completo digitado (ConfirmDestructive).
 * Ver prompt original §4.13/§7.5.
 */
export function VisibilityToggle({
  owner,
  name,
  isPrivate,
  destructiveAllowed,
}: {
  owner: string;
  name: string;
  isPrivate: boolean;
  destructiveAllowed: boolean;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextState = !isPrivate;
  const actionLabel = nextState ? "Tornar privado" : "Tornar público";
  const fullName = `${owner}/${name}`;

  async function handleConfirm() {
    setError(null);
    try {
      await apiPut(`/api/repos/${owner}/${name}/visibility`, {
        isPrivate: nextState,
        confirmRepoName: fullName,
      });
      setShowConfirm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao alterar visibilidade.");
    }
  }

  return (
    <div className="rounded border border-coral/30 bg-ink-800 p-4">
      <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.08em] text-coral">
        Zona de risco
      </h2>
      <p className="mb-3 text-sm text-chalk-dim">
        Repositório atualmente <strong>{isPrivate ? "privado" : "público"}</strong>.
      </p>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="rounded border border-coral/40 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-coral hover:bg-coral/10"
      >
        {actionLabel}
      </button>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}

      {showConfirm && (
        <ConfirmDestructive
          repoFullName={fullName}
          actionLabel={actionLabel}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          disabled={!destructiveAllowed}
        />
      )}
    </div>
  );
}
