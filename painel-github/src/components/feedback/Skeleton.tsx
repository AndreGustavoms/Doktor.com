/*
 * Esqueletos de carregamento. Substituem o "Carregando…" seco: um bloco
 * cinza com a forma aproximada do conteúdo que vem faz a espera parecer
 * mais curta e evita o salto de layout quando os dados chegam.
 *
 * `animate-pulse` respeita prefers-reduced-motion — a regra global em
 * globals.css zera a duração de toda animação nesse modo, então quem
 * pediu menos movimento vê um bloco estático, que continua cumprindo o
 * papel de reservar o espaço.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-ink-600 ${className}`} aria-hidden />;
}

/** Linhas de texto de larguras variadas — parágrafo em carregamento. */
export function SkeletonTexto({ linhas = 3 }: { linhas?: number }) {
  const larguras = ["w-full", "w-11/12", "w-4/5", "w-3/4", "w-2/3"];
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} className={`h-3 ${larguras[i % larguras.length]}`} />
      ))}
    </div>
  );
}

/** Lista de itens com título e metadado à direita. */
export function SkeletonLista({ itens = 3 }: { itens?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: itens }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded border border-ink-700 px-3 py-2.5"
        >
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-16 shrink-0" />
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * Estado vazio com espaço para explicar o que aparece ali e o que fazer
 * para preencher — em vez de uma frase cinza solta, que informa a
 * ausência mas não o caminho.
 */
export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="rounded border border-dashed border-ink-700 px-5 py-8 text-center">
      <p className="mb-1 text-sm font-medium text-chalk">{titulo}</p>
      <p className="mx-auto mb-3 max-w-md text-sm text-chalk-dim">{descricao}</p>
      {acao}
    </div>
  );
}
