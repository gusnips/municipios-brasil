const colator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

/** Marcas diacríticas combinantes (acentos) — bloco Unicode U+0300–U+036F. */
const ACENTOS = /[̀-ͯ]/g;

/**
 * Compara duas strings na ordem alfabética do português brasileiro,
 * de forma acento-insensível (útil para ordenar nomes de cidades/estados).
 *
 * @example
 * ["Áurea", "Areia"].sort(compararPtBr) // ["Areia", "Áurea"]
 */
export function compararPtBr(a: string, b: string): number {
  return colator.compare(a, b);
}

/**
 * Normaliza um texto para busca acento-insensível: remove acentos (NFD),
 * converte para minúsculas, apara as pontas e colapsa espaços internos.
 *
 * Use quando precisar comparar entradas do usuário com nomes de localidades.
 *
 * @example
 * normalizarTexto("São   Paulo ") // "sao paulo"
 */
export function normalizarTexto(texto: string): string {
  return texto.normalize("NFD").replace(ACENTOS, "").toLowerCase().trim().replace(/\s+/g, " ");
}
