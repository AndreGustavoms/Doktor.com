import { Sidebar } from "@/components/layout/Sidebar";

/*
 * Route group — aplica a Sidebar só às páginas autenticadas (/, /repos,
 * ...). /setup e /unlock ficam fora deste grupo de propósito: não há
 * nada para navegar antes do painel estar destravado.
 *
 * force-dynamic aqui se propaga para toda rota filha (/repos, /notes,
 * /issues, /portfolio, /settings) — necessário para a CSP com nonce
 * (ver src/middleware.ts) funcionar nelas: o Next só injeta o nonce em
 * páginas renderizadas por requisição, nunca em páginas estáticas
 * (geradas uma vez, no build, quando nenhum header de requisição existe
 * ainda). Sem isto, todo formulário client-side nessas páginas ficava
 * não-interativo em produção — a hidratação do React falhava
 * silenciosamente (erro #412) porque o script de bootstrap do Next era
 * bloqueado pela própria CSP por não ter o nonce certo. Descoberto ao
 * rodar tests/e2e/full-flow.spec.ts contra `next start` de produção.
 * Aceitável aqui: é um painel local de usuário único, sem CDN, então a
 * otimização estática que se perde não tinha benefício real — todas
 * essas páginas já dependem de sessão/autenticação de qualquer forma.
 */
export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      {/*
       * min-w-0 é o que impede o conteúdo de empurrar o layout: sem ele,
       * um filho largo (tabela, bloco de código, régua de 720px) força a
       * coluna flex a crescer além da viewport e a página inteira ganha
       * rolagem horizontal.
       *
       * pb-20 no celular abre espaço para a barra de navegação fixa no
       * rodapé, que senão cobriria o fim do conteúdo.
       */}
      <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>
    </div>
  );
}
