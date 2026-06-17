const colator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

/** Acentos e marcas de acentuação (intervalo Unicode U+0300–U+036F). */
const ACENTOS = /[̀-ͯ]/g;

/**
 * Compara dois textos na ordem alfabética do português, ignorando acentos e
 * maiúsculas (útil para ordenar nomes de cidades e estados).
 *
 * @example
 * ["Áurea", "Areia"].sort(compararPtBr) // ["Areia", "Áurea"]
 */
export function compararPtBr(a: string, b: string): number {
  return colator.compare(a, b);
}

/**
 * Deixa um texto pronto para comparação: tira os acentos (NFD), passa tudo para
 * minúsculas, remove os espaços das pontas e junta espaços repetidos num só.
 * Serve para comparar o que a pessoa digitou com os nomes das localidades sem se
 * preocupar com acento ou maiúscula/minúscula.
 *
 * @example
 * normalizarTexto("São   Paulo ") // "sao paulo"
 */
export function normalizarTexto(texto: string): string {
  return texto.normalize("NFD").replace(ACENTOS, "").toLowerCase().trim().replace(/\s+/g, " ");
}
