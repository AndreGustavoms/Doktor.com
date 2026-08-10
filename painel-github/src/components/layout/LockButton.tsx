"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api-client";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

/**
 * Botão "Bloquear painel" sempre visível no header + bloqueio automático
 * após 30min de inatividade (ver docs/SECURITY.md §4.4, ameaça A8). O
 * timeout do client é só UX — a verdade de inatividade é sempre
 * recalculada no servidor a partir de lastSeenAt (session.ts), então um
 * client comprometido que ignore este timer não ganha nada: a próxima
 * requisição ao servidor após 30min de silêncio real ainda é rejeitada.
 */
export function LockButton() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(async () => {
    await apiPost("/api/auth/lock", {});
    router.push("/unlock");
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(lock, INACTIVITY_TIMEOUT_MS);
  }, [lock]);

  useEffect(() => {
    resetTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [resetTimer]);

  return (
    <button
      type="button"
      onClick={lock}
      className="rounded border border-ink-600 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim transition-colors hover:border-blueprint hover:text-chalk"
    >
      Bloquear painel
    </button>
  );
}
