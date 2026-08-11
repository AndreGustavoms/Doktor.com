"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api-client";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Senha mestra",
  2: "Token do GitHub",
  3: "Escopo",
  4: "Verificação",
};

function passwordStrength(password: string): { label: string; color: string; ok: boolean } {
  if (password.length < 12) return { label: "Muito curta", color: "text-coral", ok: false };
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  if (password.length >= 16 && variety >= 3) return { label: "Forte", color: "text-jade", ok: true };
  if (password.length >= 12 && variety >= 2) return { label: "Razoável", color: "text-amber", ok: true };
  return { label: "Fraca — adicione variedade", color: "text-amber", ok: true };
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validatedUser, setValidatedUser] = useState<{ login: string; avatarUrl: string } | null>(
    null,
  );

  const strength = passwordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleFinish() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiPost<{ login: string; avatarUrl: string }>("/api/auth/setup", {
        password,
        githubToken,
      });
      setValidatedUser(result);
      setStep(4);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.field === "githubToken") setStep(2);
      } else {
        setError("Erro inesperado ao configurar o painel.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
          Primeiro boot — passo {step} de 4
        </p>
        <h1 className="mt-2 font-(family-name:--font-display) text-3xl font-bold text-chalk">
          {STEP_LABELS[step]}
        </h1>
        <div className="mt-4 flex gap-1">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? "bg-blueprint" : "bg-ink-700"}`}
            />
          ))}
        </div>
      </div>

      <div className="rounded border border-ink-700 bg-ink-800 p-6">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-chalk-dim">
              Esta senha protege o painel localmente — nunca sobe para o GitHub nem sai desta
              máquina.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
                Senha mestra
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded border border-ink-600 bg-ink-900 px-3 py-2 text-chalk outline-none focus-visible:border-blueprint"
                autoFocus
              />
              {password.length > 0 && (
                <span className={`font-mono text-xs ${strength.color}`}>{strength.label}</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
                Confirmar senha
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded border border-ink-600 bg-ink-900 px-3 py-2 text-chalk outline-none focus-visible:border-blueprint"
              />
            </label>
            <div className="rounded border border-amber/30 bg-amber/10 p-3 text-sm text-amber">
              Se você perder essa senha, o vault não é recuperável — você vai precisar refazer o
              setup com um token novo.
            </div>
            <button
              type="button"
              disabled={!strength.ok || !passwordsMatch}
              onClick={() => setStep(2)}
              className="mt-2 rounded bg-blueprint px-4 py-2 font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-chalk-dim">
              Crie um{" "}
              <a
                href="https://github.com/settings/personal-access-tokens/new"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-blueprint underline"
              >
                fine-grained personal access token
              </a>{" "}
              com repositórios selecionados manualmente (nunca &ldquo;todos&rdquo;), validade de
              90 dias, e estas permissões:
            </p>
            <ul className="rounded border border-ink-600 bg-ink-900 p-3 font-mono text-xs text-chalk-dim">
              <li>Metadata — Leitura</li>
              <li>Contents — Leitura e escrita</li>
              <li>Issues — Leitura e escrita</li>
              <li>Pull requests — Leitura e escrita</li>
              <li>Actions — Leitura</li>
              <li>Administration — Leitura e escrita (se for editar visibilidade/topics)</li>
            </ul>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
                Token do GitHub
              </span>
              <div className="flex gap-2">
                <input
                  type={showToken ? "text" : "password"}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="github_pat_..."
                  className="flex-1 rounded border border-ink-600 bg-ink-900 px-3 py-2 font-mono text-sm text-chalk outline-none focus-visible:border-blueprint"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="rounded border border-ink-600 px-3 text-xs text-chalk-dim"
                >
                  {showToken ? "Ocultar" : "Revelar"}
                </button>
              </div>
            </label>
            {error && <p className="text-sm text-coral">{error}</p>}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded border border-ink-600 px-4 py-2 text-chalk-dim"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={githubToken.length === 0}
                onClick={() => setStep(3)}
                className="flex-1 rounded bg-blueprint px-4 py-2 font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-chalk-dim">
              Por padrão, o painel indexa apenas os seus repositórios pessoais. Escolher
              organizações específicas chega numa fase futura — por ora, o token que você criou já
              define o escopo real (os repositórios que você selecionou ao criá-lo).
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded border border-ink-600 px-4 py-2 text-chalk-dim"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinish}
                className="flex-1 rounded bg-blueprint px-4 py-2 font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Validando…" : "Finalizar setup"}
              </button>
            </div>
            {error && <p className="text-sm text-coral">{error}</p>}
          </div>
        )}

        {step === 4 && validatedUser && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- avatar do GitHub, ver política de imagens externas em docs/SECURITY.md */}
              <img
                src={validatedUser.avatarUrl}
                alt=""
                className="h-12 w-12 rounded-full border border-ink-600"
              />
              <div>
                <p className="text-chalk">
                  Conectado como <span className="font-mono">{validatedUser.login}</span>
                </p>
                <p className="text-sm text-jade">Token validado com sucesso</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2 rounded border border-ink-600 bg-ink-900 p-3 text-sm">
              <li className="flex items-center gap-2 text-jade">
                <span>✓</span> Escutando apenas em 127.0.0.1
              </li>
              <li className="flex items-center gap-2 text-jade">
                <span>✓</span> Vault cifrado (AES-256-GCM)
              </li>
              <li className="flex items-center gap-2 text-jade">
                <span>✓</span> Senha mestra configurada
              </li>
              <li className="flex items-center gap-2 text-jade">
                <span>✓</span> Sessão local ativa
              </li>
            </ul>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-2 rounded bg-blueprint px-4 py-2 font-medium text-ink-900"
            >
              Entrar no painel
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
