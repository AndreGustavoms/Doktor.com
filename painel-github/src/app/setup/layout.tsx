/*
 * force-dynamic — necessário para a CSP com nonce funcionar (ver
 * src/middleware.ts e o comentário em src/app/(authenticated)/layout.tsx
 * para o raciocínio completo). "use client" no lado da page.tsx impede
 * a exportação de `dynamic` funcionar naquele mesmo arquivo — este
 * layout (Server Component) é o jeito correto de forçar isso para a
 * rota /setup sem tocar no componente client. Sem isto, esta página é
 * prerenderizada estaticamente no build e o botão "Continuar" nunca
 * habilita em produção: a hidratação do React falha silenciosamente
 * porque o script de bootstrap do Next é bloqueado pela própria CSP.
 */
export const dynamic = "force-dynamic";

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
