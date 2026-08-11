/*
 * force-dynamic — mesma razão de src/app/setup/layout.tsx: necessário
 * para a CSP com nonce funcionar (ver src/middleware.ts). Sem isto, o
 * botão "Destravar" nunca reage ao campo de senha em produção.
 */
export const dynamic = "force-dynamic";

export default function UnlockLayout({ children }: { children: React.ReactNode }) {
  return children;
}
