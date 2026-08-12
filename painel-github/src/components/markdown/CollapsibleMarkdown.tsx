"use client";

import { useState, useRef, useEffect } from "react";

/*
 * README colapsado por padrão. Repositórios sérios têm README de mil
 * linhas — o do Contas.exe sozinho empurrava a tela de detalhe para
 * 5.674px de altura, deixando issues, releases e actions abaixo de
 * quatro rolagens.
 *
 * Não toca em MarkdownView, que é o único ponto autorizado a injetar
 * HTML sanitizado (ver docs/SECURITY.md, ameaça A5): recebe o conteúdo
 * já renderizado como children e só controla a altura da caixa. Nenhum
 * HTML passa por aqui.
 *
 * A medição decide se o botão aparece: README curto não ganha um
 * "Mostrar mais" inútil.
 */
const ALTURA_COLAPSADA = 420;

export function CollapsibleMarkdown({ children }: { children: React.ReactNode }) {
  const [expandido, setExpandido] = useState(false);
  const [precisaColapsar, setPrecisaColapsar] = useState(false);
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = alvo.current;
    if (!el) return;

    const medir = () => setPrecisaColapsar(el.scrollHeight > ALTURA_COLAPSADA + 80);
    medir();

    // O conteúdo cresce depois da montagem (imagens do README carregando,
    // fontes trocando), então uma medição única erraria para mais ou para
    // menos dependendo do tempo.
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [children]);

  const colapsado = precisaColapsar && !expandido;

  return (
    <div>
      <div
        ref={alvo}
        className="relative overflow-hidden transition-[max-height] duration-300"
        style={{ maxHeight: colapsado ? ALTURA_COLAPSADA : undefined }}
      >
        {children}
        {colapsado && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-800 to-transparent"
          />
        )}
      </div>

      {precisaColapsar && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="mt-3 rounded-md border border-ink-700 px-3 py-1.5 text-sm text-chalk-dim transition-colors hover:border-blueprint hover:text-chalk"
        >
          {expandido ? "Mostrar menos" : "Mostrar README completo"}
        </button>
      )}
    </div>
  );
}
