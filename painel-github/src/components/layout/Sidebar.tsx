"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

/*
 * Só rotas que já existem entram aqui — prs/actions/portfolio chegam em
 * fases futuras (6-7 do prompt original). Um link para uma rota
 * inexistente é pior que a ausência do link: gera 404 confuso sem
 * indicar que "ainda não existe" é o estado esperado.
 */
const NAV_ITEMS = [
  { href: "/", label: "Painel" },
  { href: "/repos", label: "Repositórios" },
  { href: "/issues", label: "Issues" },
  { href: "/notes", label: "Notas" },
  { href: "/settings", label: "Ajustes" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-ink-700 bg-ink-900 px-4 py-6"
    >
      <p className="mb-6 px-2 font-(family-name:--font-display) text-lg font-bold text-chalk">
        Painel GitHub
      </p>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "block rounded px-3 py-2 font-mono text-xs uppercase tracking-[0.08em] transition-colors",
                  isActive
                    ? "bg-ink-800 text-blueprint"
                    : "text-chalk-dim hover:bg-ink-800 hover:text-chalk",
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
