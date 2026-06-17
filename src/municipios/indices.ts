import type { FusoHorario, Municipio } from "../tipos/tipos";
import { normalizarTexto } from "../busca/normalizar";

/** Um município com seu nome já normalizado, para busca rápida. */
export interface ItemBuscavel {
  cidade: Municipio;
  nomeNormalizado: string;
}

/** Índices pré-computados para consultas O(1) e busca síncrona. */
export interface IndiceMunicipios {
  /** Todos os municípios, na ordem original (alfabética). */
  todos: Municipio[];
  porCodigoIbge: Map<number, Municipio>;
  porCodigoReceitaFederal: Map<string, Municipio>;
  porCodigoUf: Map<number, Municipio[]>;
  porDdd: Map<number, Municipio[]>;
  porFuso: Map<FusoHorario, Municipio[]>;
  /** Lista com nomes normalizados, reaproveitada a cada busca. */
  buscaveis: ItemBuscavel[];
}

function agrupar<K>(mapa: Map<K, Municipio[]>, chave: K, cidade: Municipio): void {
  const lista = mapa.get(chave);
  if (lista) lista.push(cidade);
  else mapa.set(chave, [cidade]);
}

/**
 * Monta todos os índices a partir da lista de municípios.
 * Executa uma única vez por carregamento (custo O(n), ~5,5 mil itens).
 */
export function montarIndice(municipios: Municipio[]): IndiceMunicipios {
  const porCodigoIbge = new Map<number, Municipio>();
  const porCodigoReceitaFederal = new Map<string, Municipio>();
  const porCodigoUf = new Map<number, Municipio[]>();
  const porDdd = new Map<number, Municipio[]>();
  const porFuso = new Map<FusoHorario, Municipio[]>();
  const buscaveis: ItemBuscavel[] = [];

  for (const cidade of municipios) {
    porCodigoIbge.set(cidade.codigoIbge, cidade);
    porCodigoReceitaFederal.set(cidade.codigoReceitaFederal, cidade);
    agrupar(porCodigoUf, cidade.codigoUf, cidade);
    agrupar(porDdd, cidade.ddd, cidade);
    agrupar(porFuso, cidade.fusoHorario, cidade);
    buscaveis.push({ cidade, nomeNormalizado: normalizarTexto(cidade.nome) });
  }

  return { todos: municipios, porCodigoIbge, porCodigoReceitaFederal, porCodigoUf, porDdd, porFuso, buscaveis };
}
