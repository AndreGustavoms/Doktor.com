"use client";

import { useSyncExternalStore, useCallback } from "react";
import { clsx } from "clsx";

/*
 * Alternância de tema com três estados — claro, escuro e "sistema".
 * Sistema é o padrão e não grava nada no <html>: sem carimbo, quem
 * decide é a media query prefers-color-scheme (ver globals.css). Uma
 * escolha explícita grava data-theme e passa a vencer a preferência do
 * sistema nos dois sentidos.
 *
 * A preferência vive em localStorage, não no banco: é decisão de
 * aparência por dispositivo, e gravá-la no servidor faria o mesmo vault
 * abrir com temas diferentes conforme a máquina — além de custar uma
 * chamada de rede para algo que precisa valer antes da primeira pintura.
 */
type Tema = "light" | "dark" | "system";

const CHAVE = "painel-tema";

const OPCOES: { valor: Tema; rotulo: string; titulo: string }[] = [
  { valor: "light", rotulo: "☀", titulo: "Tema claro" },
  { valor: "dark", rotulo: "☾", titulo: "Tema escuro" },
  { valor: "system", rotulo: "◐", titulo: "Seguir o sistema" },
];

export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "system") {
    raiz.removeAttribute("data-theme");
  } else {
    raiz.setAttribute("data-theme", tema);
  }
}

/*
 * localStorage é estado externo ao React, então o caminho certo de ler é
 * useSyncExternalStore — não um efeito que chama setState (isso dispara
 * render em cascata, e o React Compiler acusa). De quebra, resolve a
 * hidratação: getServerSnapshot devolve "system", que é o que o HTML do
 * servidor assume, e o valor real entra no primeiro commit no cliente.
 */
const ouvintes = new Set<() => void>();

function inscrever(callback: () => void) {
  ouvintes.add(callback);
  // storage dispara quando OUTRA aba muda a preferência — mantém as
  // janelas abertas em sincronia.
  window.addEventListener("storage", callback);
  return () => {
    ouvintes.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function lerCliente(): Tema {
  return (localStorage.getItem(CHAVE) as Tema | null) ?? "system";
}

function lerServidor(): Tema {
  return "system";
}

export function ThemeToggle() {
  const tema = useSyncExternalStore(inscrever, lerCliente, lerServidor);

  const escolher = useCallback((novo: Tema) => {
    localStorage.setItem(CHAVE, novo);
    aplicarTema(novo);
    // storage não dispara na aba que escreveu; avisamos os inscritos
    // daqui para o botão ativo atualizar imediatamente.
    for (const notificar of ouvintes) notificar();
  }, []);

  return (
    <div
      role="group"
      aria-label="Tema da interface"
      className="flex items-center gap-0.5 rounded-md border border-ink-700 p-0.5"
    >
      {OPCOES.map((opcao) => {
        const ativo = tema === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => escolher(opcao.valor)}
            title={opcao.titulo}
            aria-label={opcao.titulo}
            aria-pressed={ativo}
            className={clsx(
              "rounded px-2 py-1 text-xs leading-none transition-colors",
              ativo
                ? "bg-ink-600 text-chalk"
                : "text-chalk-dim hover:bg-ink-600/60 hover:text-chalk",
            )}
          >
            <span aria-hidden>{opcao.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
