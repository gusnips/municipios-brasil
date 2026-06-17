/**
 * Subpath de dados crus: `municipios-brasil/dados`.
 *
 * Exporta os arrays já no formato camelCase (estados, capitais, municípios) e
 * os metadados de proveniência. Importar este módulo inclui o dataset completo
 * de municípios no seu bundle de forma **estática/síncrona** — use quando isso
 * for desejado (scripts Node, SSR, etapas de build). No front-end, prefira
 * {@link carregarMunicipios} para que os municípios fiquem em um chunk sob demanda.
 */
export { estados } from "./estados.gerado";
export { capitais } from "./capitais.gerado";
export { municipios } from "./municipios.gerado";
export { meta } from "./meta.gerado";
export type { MetaDados } from "./meta.gerado";
