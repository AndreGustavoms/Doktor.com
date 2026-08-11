/*
 * Diff linha-a-linha simples (LCS), sem dependência externa — suficiente
 * para o propósito de "mostrar o que mudou antes de commitar" (prompt
 * original §4.13). Não é um diff de qualidade de produção (não detecta
 * movimentação de blocos), mas é honesto sobre isso: adição/remoção
 * linha a linha é claro o bastante para revisar antes de confirmar.
 */
export type DiffLine =
  | { type: "unchanged"; text: string }
  | { type: "added"; text: string }
  | { type: "removed"; text: string };

export function lineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  // Tabela LCS clássica — O(n*m), aceitável para arquivos de texto
  // típicos (README, código-fonte); não usado para arquivos grandes.
  const lcs: number[][] = Array.from({ length: oldLines.length + 1 }, () =>
    new Array(newLines.length + 1).fill(0),
  );

  for (let i = oldLines.length - 1; i >= 0; i--) {
    for (let j = newLines.length - 1; j >= 0; j--) {
      lcs[i]![j] =
        oldLines[i] === newLines[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: "unchanged", text: oldLines[i]! });
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      result.push({ type: "removed", text: oldLines[i]! });
      i++;
    } else {
      result.push({ type: "added", text: newLines[j]! });
      j++;
    }
  }
  while (i < oldLines.length) {
    result.push({ type: "removed", text: oldLines[i]! });
    i++;
  }
  while (j < newLines.length) {
    result.push({ type: "added", text: newLines[j]! });
    j++;
  }

  return result;
}
