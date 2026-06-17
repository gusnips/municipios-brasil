/**
 * `municipios-brasil` — estados, cidades e capitais do Brasil em TypeScript.
 *
 * - **Estados, capitais, regiões, geo puro e formatação são síncronos** (dados
 *   embutidos, ~1 KB gzip) — funcionam sem `await`.
 * - **Os municípios carregam sob demanda** via {@link carregarMunicipios}, que
 *   devolve uma API síncrona pronta para autocomplete (busca, proximidade, filtros).
 *
 * @example
 * import { listarEstados, carregarMunicipios } from "municipios-brasil";
 *
 * listarEstados().length; // 27
 *
 * const municipios = await carregarMunicipios();
 * municipios.buscar("São Pau", { uf: "SP" });
 * municipios.proximas(3550308, 50);
 *
 * @packageDocumentation
 */

// ── Tipos ────────────────────────────────────────────────────────────────
export type {
  Estado,
  Municipio,
  Coordenada,
  UF,
  Regiao,
  FusoHorario,
  OpcoesBuscaEstado,
  OpcoesBuscaCidade,
  OpcoesProximidade,
  ResultadoProximidade,
} from "./tipos/tipos";
export type { ApiMunicipios } from "./municipios/api-municipios";

// ── Constantes ─────────────────────────────────────────────────────────────
export { UFS, REGIOES, FUSOS_HORARIOS, CODIGO_UF_POR_SIGLA } from "./tipos/gerados";

// ── Estados, regiões e capitais (síncrono) ──────────────────────────────────
export {
  listarEstados,
  obterEstado,
  buscarEstados,
  listarRegioes,
  listarEstadosPorRegiao,
  listarCapitais,
  obterCapital,
  ehUf,
  ehRegiao,
  ehFusoHorario,
} from "./estados/estados";

// ── Geo puro, texto e formatação (síncrono, sem dados) ──────────────────────
export { distanciaKm } from "./geo/distancia";
export { normalizarTexto, compararPtBr } from "./busca/normalizar";
export { formatarCidadeUf } from "./formatar";

// ── Municípios (sob demanda) ────────────────────────────────────────────────
export { carregarMunicipios } from "./municipios/carregar";
export { criarApiMunicipios } from "./municipios/api-municipios";

// ── Erros ────────────────────────────────────────────────────────────────
export {
  ErroMunicipiosBr,
  CodigoErro,
  UfInvalidaError,
  EstadoNaoEncontradoError,
  CidadeNaoEncontradaError,
  RegiaoInvalidaError,
  CoordenadaInvalidaError,
  RaioInvalidoError,
  DddInvalidoError,
  FusoInvalidoError,
} from "./erros/erros";
