import { Sidebar } from "@/components/layout/Sidebar";

/*
 * Route group — aplica a Sidebar só às páginas autenticadas (/, /repos,
 * ...). /setup e /unlock ficam fora deste grupo de propósito: não há
 * nada para navegar antes do painel estar destravado.
 */
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
