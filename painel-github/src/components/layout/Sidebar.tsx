"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

/*
 * Só rotas que já existem entram aqui — prs/actions chegam em fases
 * futuras (7 do prompt original). Um link para uma rota inexistente é
 * pior que a ausência do link: gera 404 confuso sem indicar que "ainda
 * não existe" é o estado esperado.
 */
const NAV_ITEMS = [
  { href: "/", label: "Painel" },
  { href: "/repos", label: "Repositórios" },
  { href: "/issues", label: "Issues" },
  { href: "/notes", label: "Notas" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/settings", label: "Ajustes" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-ink-700 bg-ink-600 px-3 py-5"
    >
      <p className="mb-6 px-3 text-[15px] font-semibold tracking-tight text-chalk">
        Painel GitHub
      </p>
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "block rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
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
    </nav>
  );
}
