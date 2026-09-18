/** Acentos e marcas de acentuação (intervalo Unicode U+0300–U+036F). */
const ACENTOS = /[̀-ͯ]/g;

/**
 * O `Intl.Collator`, montado na primeira comparação e guardado.
 *
 * Não é montado na carga do módulo de propósito: em runtimes sem `Intl`
 * completo — Hermes/React Native é o caso real — o construtor pode falhar, e
 * quem só queria importar os dados levaria o app junto. `null` quer dizer "não
 * dá para usar aqui"; a comparação então cai no texto normalizado, que ordena
 * igual para nome de cidade e de estado (os acentos saem dos dois lados).
 */
let colator: Intl.Collator | null | undefined;

function obterColator(): Intl.Collator | null {
  if (colator === undefined) {
    try {
      colator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });
    } catch {
      colator = null;
    }
  }
  return colator;
}

/**
 * Compara dois textos na ordem alfabética do português, ignorando acentos e
 * maiúsculas (útil para ordenar nomes de cidades e estados).
 *
 * @example
 * ["Áurea", "Areia"].sort(compararPtBr) // ["Areia", "Áurea"]
 */
export function compararPtBr(a: string, b: string): number {
  const collator = obterColator();
  if (collator) return collator.compare(a, b);
  const textoA = normalizarTexto(a);
  const textoB = normalizarTexto(b);
  return textoA < textoB ? -1 : textoA > textoB ? 1 : 0;
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
