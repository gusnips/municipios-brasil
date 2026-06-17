import { normalizarTexto } from "./normalizar";

/** Opções de ranqueamento genéricas para a busca/autocomplete. */
export interface OpcoesRanqueamento<T> {
  /** Número máximo de resultados (padrão: 20). */
  limite?: number;
  /**
   * Critério de desempate entre itens com a mesma pontuação.
   * Retorne negativo se `a` deve vir antes de `b`.
   */
  desempate?: (a: T, b: T) => number;
}

/**
 * Pontua o quão bem um nome normalizado casa com o termo normalizado.
 * Menor é melhor; `null` significa "não casa".
 *
 * - `0`: igual exato
 * - `1`: começa com o termo
 * - `2`: alguma palavra interna começa com o termo
 * - `3`: contém o termo em qualquer posição
 */
export function pontuar(nomeNormalizado: string, termoNormalizado: string): number | null {
  if (nomeNormalizado === termoNormalizado) return 0;
  if (nomeNormalizado.startsWith(termoNormalizado)) return 1;
  if (nomeNormalizado.includes(` ${termoNormalizado}`)) return 2;
  if (nomeNormalizado.includes(termoNormalizado)) return 3;
  return null;
}

/**
 * Busca ranqueada e acento-insensível, pronta para autocomplete.
 * Retorna uma lista vazia quando o termo é vazio/em branco.
 *
 * A ordenação é: melhor pontuação primeiro, depois o critério de `desempate`
 * (se houver) e, por fim, a ordem original (estável).
 */
export function buscarRanqueado<T>(
  itens: readonly T[],
  termo: string,
  obterNomeNormalizado: (item: T) => string,
  opcoes: OpcoesRanqueamento<T> = {},
): T[] {
  const termoNormalizado = normalizarTexto(termo);
  if (!termoNormalizado) return [];

  const casados: { item: T; pontos: number; ordem: number }[] = [];
  let ordem = 0;
  for (const item of itens) {
    const pontos = pontuar(obterNomeNormalizado(item), termoNormalizado);
    if (pontos !== null) casados.push({ item, pontos, ordem: ordem++ });
  }

  casados.sort((a, b) => {
    if (a.pontos !== b.pontos) return a.pontos - b.pontos;
    if (opcoes.desempate) {
      const diferenca = opcoes.desempate(a.item, b.item);
      if (diferenca !== 0) return diferenca;
    }
    return a.ordem - b.ordem;
  });

  const limite = opcoes.limite ?? 20;
  return casados.slice(0, limite).map((c) => c.item);
}
