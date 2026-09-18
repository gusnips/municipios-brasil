/**
 * Subpath de dados crus + API síncrona: `municipios-brasil/dados`.
 *
 * Exporta os arrays já no formato camelCase (estados, capitais, municípios), os
 * metadados de proveniência e **toda a API da raiz menos {@link carregarMunicipios}**
 * — que é a única função que carrega os municípios por `import()` dinâmico.
 *
 * Importar este módulo inclui o dataset completo de municípios no seu bundle de
 * forma **estática/síncrona**. Use quando isso for desejado: scripts Node, SSR,
 * etapas de build, e **React Native** (o Metro não resolve o chunk dinâmico da
 * raiz). No front-end web, prefira {@link carregarMunicipios} para que os
 * municípios fiquem em um chunk sob demanda.
 *
 * @example
 * import { criarApiMunicipios, municipios } from "municipios-brasil/dados";
 *
 * const api = criarApiMunicipios(municipios);
 * api.buscar("São Pau", { uf: "SP" });
 */

// ── Dados crus ──────────────────────────────────────────────────────────────
export { estados } from "./estados.gerado";
export { capitais } from "./capitais.gerado";
export { municipios } from "./municipios.gerado";
export { meta } from "./meta.gerado";
export type { MetaDados } from "./meta.gerado";

// ── Tipos ───────────────────────────────────────────────────────────────────
export type {
  Estado,
  Municipio,
  Coordenada,
  UF,
  Regiao,
  FusoHorario,
  OpcoesBuscaEstado,
  OpcoesBuscaCidade,
  OpcoesListaEstados,
  OrdemEstados,
  OpcoesProximidade,
  ResultadoProximidade,
} from "../tipos/tipos";
export type { ApiMunicipios } from "../municipios/api-municipios";

// ── Constantes ──────────────────────────────────────────────────────────────
export { UFS, REGIOES, FUSOS_HORARIOS, CODIGO_UF_POR_SIGLA } from "../tipos/gerados";

// ── Estados, regiões e capitais ─────────────────────────────────────────────
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
} from "../estados/estados";

// ── Municípios (sobre os dados que você passar) ─────────────────────────────
export { criarApiMunicipios } from "../municipios/api-municipios";

// ── Geo puro, texto e formatação ────────────────────────────────────────────
export { distanciaKm } from "../geo/distancia";
export { normalizarTexto, compararPtBr } from "../busca/normalizar";
export { formatarCidadeUf } from "../formatar";

// ── Erros ───────────────────────────────────────────────────────────────────
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
} from "../erros/erros";
