"use client";

import { useState } from "react";

/**
 * A9 — toda ação destrutiva exige digitar o nome completo do
 * repositório no diálogo de confirmação, não um "Confirmar" genérico.
 * Ver prompt original §4.13 e docs/SECURITY.md.
 */
export function ConfirmDestructive({
  repoFullName,
  actionLabel,
  onConfirm,
  onCancel,
  disabled,
  disabledReason,
}: {
  repoFullName: string;
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed === repoFullName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded border border-coral/40 bg-ink-800 p-6">
        <h2 className="font-(family-name:--font-display) text-lg font-bold text-coral">
          {actionLabel}
        </h2>
        <p className="mt-2 text-sm text-chalk-dim">
          Esta ação é destrutiva e pode não ter volta. Para confirmar, digite o nome completo do
          repositório:
        </p>
        <p className="mt-2 rounded border border-ink-600 bg-ink-900 px-2 py-1 font-mono text-sm text-chalk">
          {repoFullName}
        </p>

        {disabled ? (
          <p className="mt-4 rounded border border-amber/30 bg-amber/5 p-3 text-sm text-amber">
            {disabledReason ??
              "Ações destrutivas estão desabilitadas. Defina ALLOW_DESTRUCTIVE=true no .env.local para habilitar."}
          </p>
        ) : (
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={repoFullName}
            className="mt-3 w-full rounded border border-ink-600 bg-ink-900 px-3 py-2 font-mono text-sm text-chalk outline-none focus-visible:border-coral"
            autoFocus
          />
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-ink-600 px-4 py-2 text-sm text-chalk-dim"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled || !matches}
            className="rounded bg-coral px-4 py-2 text-sm font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
