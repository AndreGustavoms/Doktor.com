"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ThemeToggle } from "./ThemeToggle";

/*
 * Só rotas que já existem entram aqui — prs/actions chegam em fases
 * futuras (7 do prompt original). Um link para uma rota inexistente é
 * pior que a ausência do link: gera 404 confuso sem indicar que "ainda
 * não existe" é o estado esperado.
 *
 * `curto` é o rótulo da barra inferior no celular, onde seis itens
 * dividem a largura da tela: "Repositórios" não cabe, "Repos" cabe.
 */
const NAV_ITEMS = [
  { href: "/", label: "Painel", curto: "Painel", icone: "▦" },
  { href: "/repos", label: "Repositórios", curto: "Repos", icone: "◧" },
  { href: "/issues", label: "Issues", curto: "Issues", icone: "◔" },
  { href: "/notes", label: "Notas", curto: "Notas", icone: "▤" },
  { href: "/portfolio", label: "Portfólio", curto: "Portfólio", icone: "◈" },
  { href: "/settings", label: "Ajustes", curto: "Ajustes", icone: "◐" },
] as const;

function estaAtivo(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/*
 * Duas formas da mesma navegação, trocadas por breakpoint — o prompt
 * original §8 pedia que a sidebar colapsasse abaixo de 1100px, e ela
 * nunca colapsou: numa tela de 390px os 240px fixos comiam 62% da
 * largura e o conteúdo ficava cortado ao meio (medido: 676px de rolagem
 * horizontal no dashboard).
 *
 * No celular a navegação vai para uma barra inferior — polegar alcança,
 * e não rouba largura de leitura. De `md` para cima volta a sidebar
 * lateral, que é onde ela funciona bem.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar lateral — tablet e desktop */}
      <nav
        aria-label="Navegação principal"
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-700 bg-ink-600 px-3 py-5 md:flex"
      >
        <p className="mb-6 px-3 text-[15px] font-semibold tracking-tight text-chalk">
          Painel GitHub
        </p>
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const ativo = estaAtivo(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={clsx(
                    "block rounded-md px-3 py-1.5 text-sm transition-colors",
                    ativo
                      ? "bg-ink-800 font-medium text-chalk shadow-[0_1px_2px_rgba(28,27,25,0.06)]"
                      : "text-chalk-dim hover:bg-ink-700/40 hover:text-chalk",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Fica no rodapé da sidebar: é ajuste de aparência, não navegação
            — não deve competir com os destinos do painel. */}
        <div className="mt-auto px-1 pt-4">
          <ThemeToggle />
        </div>
      </nav>

      {/* Barra inferior — celular */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-700 bg-ink-600 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const ativo = estaAtivo(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                ativo ? "font-medium text-blueprint" : "text-chalk-dim",
              )}
            >
              <span aria-hidden className="text-base leading-none">
                {item.icone}
              </span>
              {item.curto}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
