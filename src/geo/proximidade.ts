import type { Coordenada, Municipio, ResultadoProximidade } from "../tipos/tipos";
import { haversineKm, validarCoordenada } from "./distancia";

/**
 * Retorna as cidades da lista cujo centro está dentro de `raioKm` da `origem`,
 * ordenadas da mais próxima para a mais distante. Função pura sobre a lista
 * recebida (a validação do raio é responsabilidade de quem chama).
 */
export function cidadesDentroDoRaio(
  cidades: readonly Municipio[],
  origem: Coordenada,
  raioKm: number,
  opcoes: { excluirCodigoIbge?: number; limite?: number } = {},
): ResultadoProximidade[] {
  validarCoordenada(origem);
  const resultados: ResultadoProximidade[] = [];
  for (const cidade of cidades) {
    if (opcoes.excluirCodigoIbge !== undefined && cidade.codigoIbge === opcoes.excluirCodigoIbge) {
      continue;
    }
    const distanciaKm = haversineKm(origem, cidade);
    if (distanciaKm <= raioKm) resultados.push({ cidade, distanciaKm });
  }
  resultados.sort((a, b) => a.distanciaKm - b.distanciaKm);
  return opcoes.limite !== undefined ? resultados.slice(0, opcoes.limite) : resultados;
}

/**
 * Retorna a cidade mais próxima da `origem` dentro da lista, ou `undefined`
 * se a lista estiver vazia. Função pura sobre a lista recebida.
 */
export function cidadeMaisProximaDe(
  cidades: readonly Municipio[],
  origem: Coordenada,
  opcoes: { excluirCodigoIbge?: number } = {},
): ResultadoProximidade | undefined {
  validarCoordenada(origem);
  let melhor: ResultadoProximidade | undefined;
  for (const cidade of cidades) {
    if (opcoes.excluirCodigoIbge !== undefined && cidade.codigoIbge === opcoes.excluirCodigoIbge) {
      continue;
    }
    const distanciaKm = haversineKm(origem, cidade);
    if (!melhor || distanciaKm < melhor.distanciaKm) melhor = { cidade, distanciaKm };
  }
  return melhor;
}
