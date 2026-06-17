import type { UF, Regiao, FusoHorario } from "./gerados";

export type { UF, Regiao, FusoHorario } from "./gerados";

/**
 * Uma unidade federativa (estado ou Distrito Federal) do Brasil.
 */
export interface Estado {
  /** Código numérico do IBGE para a UF (ex.: 35 para SP). */
  codigoUf: number;
  /** Sigla de duas letras (ex.: `"SP"`). */
  uf: UF;
  /** Nome por extenso (ex.: `"São Paulo"`). */
  nome: string;
  /** Latitude do centro aproximado do estado. */
  latitude: number;
  /** Longitude do centro aproximado do estado. */
  longitude: number;
  /** Região (ex.: `"Sudeste"`). */
  regiao: Regiao;
}

/**
 * Um município brasileiro.
 */
export interface Municipio {
  /** Código IBGE de 7 dígitos, único por município (ex.: 3550308). */
  codigoIbge: number;
  /** Nome do município (ex.: `"São Paulo"`). */
  nome: string;
  /** Sigla da UF a que o município pertence (ex.: `"SP"`). Derivado de {@link codigoUf}. */
  uf: UF;
  /** Código numérico do IBGE da UF a que o município pertence. */
  codigoUf: number;
  /** Latitude do município. */
  latitude: number;
  /** Longitude do município. */
  longitude: number;
  /** `true` se o município é a capital do seu estado. */
  capital: boolean;
  /** Código DDD principal (ex.: 11). */
  ddd: number;
  /** Fuso horário IANA (ex.: `"America/Sao_Paulo"`). */
  fusoHorario: FusoHorario;
  /**
   * Código do município na **Receita Federal** — o código **TOM** (Tabela de
   * Órgãos e Municípios), idêntico ao código SIAFI. String de 4 dígitos com zero
   * à esquerda (ex.: `"7107"` para São Paulo, `"0643"` para Acrelândia). É o
   * código usado nos dados abertos de CNPJ da Receita Federal.
   *
   * Atenção: NF-e e SPED usam o código IBGE ({@link codigoIbge}), não este.
   */
  codigoReceitaFederal: string;
}

/**
 * Par de coordenadas geográficas em graus decimais.
 */
export interface Coordenada {
  /** Latitude em graus decimais, entre -90 e 90. */
  latitude: number;
  /** Longitude em graus decimais, entre -180 e 180. */
  longitude: number;
}

/** Opções para {@link buscarEstados}. */
export interface OpcoesBuscaEstado {
  /** Número máximo de resultados (padrão: 20). */
  limite?: number;
}

/** Opções para a busca de cidades (`municipios.buscar`). */
export interface OpcoesBuscaCidade {
  /** Número máximo de resultados (padrão: 20). */
  limite?: number;
  /** Restringe a busca a uma ou mais UFs (ótimo para desambiguar nomes repetidos). */
  uf?: UF | UF[];
  /** Quando `true`, busca apenas entre as capitais. */
  somenteCapitais?: boolean;
}

/** Opções para `municipios.proximas`. */
export interface OpcoesProximidade {
  /** Número máximo de resultados; se omitido, retorna todas dentro do raio. */
  limite?: number;
  /** Quando `true`, inclui a própria cidade de origem no resultado (padrão: `false`). */
  incluirOrigem?: boolean;
  /** Restringe a vizinhança a uma ou mais UFs. */
  uf?: UF | UF[];
}

/** Resultado de uma busca por proximidade: a cidade e sua distância até a origem. */
export interface ResultadoProximidade {
  /** O município encontrado. */
  cidade: Municipio;
  /** Distância em quilômetros até a origem, arredondada a 3 casas. */
  distanciaKm: number;
}
