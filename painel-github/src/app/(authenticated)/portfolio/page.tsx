"use client";

import { useMemo, useState } from "react";
import {
  usePortfolio,
  useUpdatePortfolioConfig,
  useAddPortfolioItem,
  useRemovePortfolioItem,
  useUpdatePortfolioItem,
  useReorderPortfolioItems,
  useExportPortfolio,
} from "@/hooks/usePortfolio";
import { useRepos } from "@/hooks/useRepos";
import { LockButton } from "@/components/layout/LockButton";
import type { PortfolioItemDTO } from "@/lib/types-portfolio";
import type { RepoDTO } from "@/lib/types";

/**
 * Editor + preview + exportação estática do portfólio — prompt original
 * §7.8. A exportação real acontece no servidor (POST /api/portfolio/export);
 * o preview aqui é só uma aproximação visual em React, não o HTML final —
 * ver src/server/portfolio-export.ts para o gerador de verdade.
 */
export default function PortfolioPage() {
  const { data, isLoading } = usePortfolio();
  const { data: reposData } = useRepos();

  const repoById = useMemo(() => {
    const map = new Map<number, RepoDTO>();
    for (const repo of reposData?.repos ?? []) map.set(repo.id, repo);
    return map;
  }, [reposData]);

  return (
    <main className="mx-auto max-w-360 px-4 py-5 sm:px-6 md:px-8 md:py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-chalk">
            Portfólio
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
            Vitrine pública — exportação estática, sem token embutido
          </p>
        </div>
        <LockButton />
      </div>

      {isLoading && <p className="text-sm text-chalk-dim">Carregando…</p>}

      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col gap-4">
            <ConfigCard config={data.config} />
            <ExportCard itemCount={data.items.filter((i) => i.visible).length} />
            <RepoPicker items={data.items} allRepos={reposData?.repos ?? []} />
          </div>
          <PreviewCard config={data.config} items={data.items} repoById={repoById} />
        </div>
      )}
    </main>
  );
}

function ConfigCard({ config }: { config: { headline: string; bio: string; socials: { platform: string; url: string }[]; theme: string } }) {
  const [headline, setHeadline] = useState(config.headline);
  const [bio, setBio] = useState(config.bio);
  const [socials, setSocials] = useState(config.socials);
  const updateConfig = useUpdatePortfolioConfig();

  function updateSocial(index: number, field: "platform" | "url", value: string) {
    setSocials((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSocial() {
    setSocials((prev) => [...prev, { platform: "", url: "" }]);
  }

  function removeSocial(index: number) {
    setSocials((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await updateConfig.mutateAsync({
      headline,
      bio,
      socials: socials.filter((s) => s.platform.trim() && s.url.trim()),
      theme: config.theme,
    });
  }

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
        Perfil
      </h2>
      <form onSubmit={handleSave} className="flex flex-col gap-2">
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline"
          required
          className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
          rows={4}
          className="rounded border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-chalk outline-none focus-visible:border-blueprint"
        />

        <div className="mt-1 flex flex-col gap-1.5">
          {socials.map((social, index) => (
            <div key={index} className="flex gap-1.5">
              <input
                type="text"
                value={social.platform}
                onChange={(e) => updateSocial(index, "platform", e.target.value)}
                placeholder="Plataforma"
                className="w-1/3 rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-chalk outline-none focus-visible:border-blueprint"
              />
              <input
                type="text"
                value={social.url}
                onChange={(e) => updateSocial(index, "url", e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-chalk outline-none focus-visible:border-blueprint"
              />
              <button
                type="button"
                onClick={() => removeSocial(index)}
                className="px-1 font-mono text-xs text-chalk-dim hover:text-coral"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSocial}
            className="self-start font-mono text-xs text-chalk-dim hover:text-chalk"
          >
            + link social
          </button>
        </div>

        <button
          type="submit"
          disabled={updateConfig.isPending}
          className="mt-2 self-start rounded bg-blueprint px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-ink-900 disabled:opacity-40"
        >
          {updateConfig.isPending ? "Salvando…" : "Salvar perfil"}
        </button>
      </form>
    </section>
  );
}

function ExportCard({ itemCount }: { itemCount: number }) {
  const exportPortfolio = useExportPortfolio();
  const [result, setResult] = useState<{ outDir: string; itemCount: number } | null>(null);

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
        Exportar
      </h2>
      <p className="mb-3 text-sm text-chalk-dim">
        Gera <code className="text-chalk">out/portfolio/index.html</code> — HTML e CSS puros, sem
        chamada de rede em runtime e sem token embutido. Abra o arquivo direto no navegador.
      </p>
      <button
        type="button"
        onClick={async () => {
          const res = await exportPortfolio.mutateAsync();
          setResult(res);
        }}
        disabled={exportPortfolio.isPending || itemCount === 0}
        className="rounded border border-ink-600 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim hover:border-blueprint hover:text-chalk disabled:opacity-40"
      >
        {exportPortfolio.isPending ? "Exportando…" : `Exportar ${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
      </button>
      {itemCount === 0 && (
        <p className="mt-2 text-xs text-chalk-dim">Marque ao menos um repositório como visível.</p>
      )}
      {result && (
        <p className="mt-2 text-xs text-jade">
          Exportado: {result.outDir} ({result.itemCount} {result.itemCount === 1 ? "item" : "itens"})
        </p>
      )}
    </section>
  );
}

function RepoPicker({
  items,
  allRepos,
}: {
  items: PortfolioItemDTO[];
  allRepos: RepoDTO[];
}) {
  const addItem = useAddPortfolioItem();
  const selectedIds = useMemo(() => new Set(items.map((i) => i.repoId)), [items]);
  const available = allRepos.filter((r) => !selectedIds.has(r.id));

  return (
    <section className="rounded border border-ink-700 bg-ink-800 p-5">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-chalk-dim">
        Adicionar repositório
      </h2>
      {available.length === 0 && (
        <p className="text-sm text-chalk-dim">Todos os repositórios já foram adicionados.</p>
      )}
      <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {available.map((repo) => (
          <button
            key={repo.id}
            type="button"
            onClick={() => addItem.mutate(repo.id)}
            disabled={addItem.isPending}
            className="flex items-center justify-between rounded px-2 py-1.5 text-left text-sm text-chalk-dim hover:bg-ink-700 hover:text-chalk disabled:opacity-40"
          >
            <span className="truncate">{repo.name}</span>
            <span className="shrink-0 font-mono text-xs">+</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PreviewCard({
  config,
  items,
  repoById,
}: {
  config: { headline: string; bio: string; socials: { platform: string; url: string }[] };
  items: PortfolioItemDTO[];
  repoById: Map<number, RepoDTO>;
}) {
  const removeItem = useRemovePortfolioItem();
  const updateItem = useUpdatePortfolioItem();
  const reorder = useReorderPortfolioItems();

  function move(repoId: number, direction: -1 | 1) {
    const order = items.map((i) => i.repoId);
    const index = order.indexOf(repoId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    const current = order[index]!;
    const swapped = order[target]!;
    order[index] = swapped;
    order[target] = current;
    reorder.mutate(order);
  }

  return (
    <section className="rounded border border-ink-700 bg-ink-900 p-6">
      <div className="mb-6 rounded border border-ink-600/50 bg-ink-800/40 p-6">
        {/*
         * <p>, não <h1>: isto é a PRÉVIA do site exportado dentro do
         * painel, não o título desta página — que já é "Portfólio", lá em
         * cima. Dois <h1> na mesma página confundem leitor de tela sobre
         * qual é o assunto real dela.
         */}
        <p className="font-(family-name:--font-display) text-2xl font-bold text-chalk">
          {config.headline || "Headline"}
        </p>
        {config.bio && <p className="mt-2 max-w-xl text-sm text-chalk-dim">{config.bio}</p>}
        {config.socials.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {config.socials.map((s, i) => (
              <span
                key={i}
                className="rounded border border-ink-600 px-2 py-1 font-mono text-xs uppercase tracking-[0.08em] text-blueprint"
              >
                {s.platform}
              </span>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-chalk-dim">
          Nenhum repositório no portfólio ainda — adicione pela lista ao lado.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item, index) => {
          const repo = repoById.get(item.repoId);
          return (
            <PortfolioItemCard
              key={item.repoId}
              item={item}
              repo={repo}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onMoveUp={() => move(item.repoId, -1)}
              onMoveDown={() => move(item.repoId, 1)}
              onRemove={() => removeItem.mutate(item.repoId)}
              onToggleVisible={() =>
                updateItem.mutate({
                  repoId: item.repoId,
                  customTitle: item.customTitle,
                  customBlurb: item.customBlurb,
                  visible: !item.visible,
                })
              }
              onSaveText={(customTitle, customBlurb) =>
                updateItem.mutate({ repoId: item.repoId, customTitle, customBlurb, visible: item.visible })
              }
            />
          );
        })}
      </div>
    </section>
  );
}

function PortfolioItemCard({
  item,
  repo,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onToggleVisible,
  onSaveText,
}: {
  item: PortfolioItemDTO;
  repo: RepoDTO | undefined;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onToggleVisible: () => void;
  onSaveText: (title: string | null, blurb: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.customTitle ?? "");
  const [blurb, setBlurb] = useState(item.customBlurb ?? "");

  return (
    <div
      className={`flex flex-col gap-2 rounded border p-4 ${
        item.visible ? "border-ink-700 bg-ink-800" : "border-ink-700/50 bg-ink-800/40 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-sm font-medium text-chalk">
          {item.customTitle || repo?.name || `#${item.repoId}`}
        </h3>
        <div className="flex shrink-0 gap-1 font-mono text-xs text-chalk-dim">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="disabled:opacity-30">
            ↑
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="disabled:opacity-30">
            ↓
          </button>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={repo?.name ?? "Título"}
            className="rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-chalk outline-none focus-visible:border-blueprint"
          />
          <textarea
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder={repo?.description ?? "Descrição"}
            rows={2}
            className="rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-chalk outline-none focus-visible:border-blueprint"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onSaveText(title.trim() || null, blurb.trim() || null);
                setEditing(false);
              }}
              className="font-mono text-xs text-blueprint"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-mono text-xs text-chalk-dim"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="line-clamp-2 text-xs text-chalk-dim">
          {item.customBlurb || repo?.description || "Sem descrição"}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-2 text-xs">
        <button
          type="button"
          onClick={onToggleVisible}
          className={`font-mono uppercase tracking-[0.08em] ${item.visible ? "text-jade" : "text-chalk-dim"}`}
        >
          {item.visible ? "Visível" : "Oculto"}
        </button>
        <div className="flex gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-mono text-chalk-dim hover:text-chalk"
            >
              Editar
            </button>
          )}
          <button type="button" onClick={onRemove} className="font-mono text-chalk-dim hover:text-coral">
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}
