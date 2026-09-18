import type {
  Estado,
  FusoHorario,
  Municipio,
  OpcoesBuscaEstado,
  OpcoesListaEstados,
  OrdemEstados,
  Regiao,
  UF,
} from "../tipos/tipos";
import { estados as DADOS_ESTADOS } from "../dados/estados.gerado";
import { capitais as DADOS_CAPITAIS } from "../dados/capitais.gerado";
import { FUSOS_HORARIOS, REGIOES, UFS } from "../tipos/gerados";
import { EstadoNaoEncontradoError, RegiaoInvalidaError, UfInvalidaError } from "../erros/erros";
import { buscarRanqueado } from "../busca/autocomplete";
import { compararPtBr, normalizarTexto } from "../busca/normalizar";

/**
 * Ordena uma lista de estados. `"ibge"` devolve a lista como ela veio — os
 * dados já estão na ordem da tabela do IBGE.
 */
function ordenar(estados: Estado[], ordem: OrdemEstados = "nome"): Estado[] {
  if (ordem === "ibge") return estados;
  if (ordem === "sigla") return estados.sort((a, b) => compararPtBr(a.uf, b.uf));
  return estados.sort((a, b) => compararPtBr(a.nome, b.nome));
}

/**
 * Lista os 27 estados (UFs) do Brasil, incluindo o Distrito Federal, em ordem
 * alfabética de nome — a ordem de um seletor de estado.
 *
 * @example
 * listarEstados().length              // 27
 * listarEstados()[0].nome             // "Acre"
 * listarEstados({ ordem: "sigla" })   // AC, AL, AM, AP…
 * listarEstados({ ordem: "ibge" })    // a tabela do IBGE: RO, AC, AM, RR…
 */
export function listarEstados(opcoes: OpcoesListaEstados = {}): Estado[] {
  return ordenar([...DADOS_ESTADOS], opcoes.ordem);
}

/**
 * Verifica se um valor é uma sigla de UF válida (type guard).
 * Dentro de um `if (ehUf(x))`, o TypeScript passa a tratar `x` como `UF`.
 *
 * @example
 * ehUf("SP") // true
 * ehUf("xx") // false
 */
export function ehUf(valor: unknown): valor is UF {
  return typeof valor === "string" && UFS.some((uf) => uf === valor);
}

/** Verifica se um valor é uma região válida (type guard). */
export function ehRegiao(valor: unknown): valor is Regiao {
  return typeof valor === "string" && REGIOES.some((regiao) => regiao === valor);
}

/** Verifica se um valor é um fuso horário válido (type guard). */
export function ehFusoHorario(valor: unknown): valor is FusoHorario {
  return typeof valor === "string" && FUSOS_HORARIOS.some((fuso) => fuso === valor);
}

/**
 * Obtém um estado pela sigla da UF (sem diferenciar maiúsculas/minúsculas)
 * ou pelo `codigoUf` numérico. Lança erro explicativo se não existir.
 *
 * @throws {UfInvalidaError} quando a sigla não é uma UF válida.
 * @throws {EstadoNaoEncontradoError} quando o código numérico não existe.
 *
 * @example
 * obterEstado("sp").nome   // "São Paulo"
 * obterEstado(33).uf       // "RJ"
 */
export function obterEstado(ufOuCodigo: UF | number): Estado {
  if (typeof ufOuCodigo === "number") {
    const estado = DADOS_ESTADOS.find((e) => e.codigoUf === ufOuCodigo);
    if (!estado) throw new EstadoNaoEncontradoError(ufOuCodigo);
    return estado;
  }
  const sigla = ufOuCodigo.toUpperCase();
  if (!ehUf(sigla)) throw new UfInvalidaError(ufOuCodigo, UFS);
  const estado = DADOS_ESTADOS.find((e) => e.uf === sigla);
  if (!estado) throw new EstadoNaoEncontradoError(sigla);
  return estado;
}

/**
 * Busca estados por nome ou sigla, ordenada por relevância e ignorando acentos
 * (pronta para usar em autocomplete). Retorna lista vazia se o termo for vazio.
 *
 * @example
 * buscarEstados("rio")  // [Rio de Janeiro, Rio Grande do Norte, Rio Grande do Sul]
 * buscarEstados("sp")   // [São Paulo]
 */
export function buscarEstados(termo: string, opcoes: OpcoesBuscaEstado = {}): Estado[] {
  return buscarRanqueado(DADOS_ESTADOS, termo, (e) => `${normalizarTexto(e.nome)} ${e.uf.toLowerCase()}`, {
    limite: opcoes.limite,
    desempate: (a, b) => compararPtBr(a.nome, b.nome),
  });
}

/**
 * Lista as 5 regiões do Brasil.
 *
 * @example
 * listarRegioes() // ["Centro-Oeste", "Nordeste", "Norte", "Sudeste", "Sul"]
 */
export function listarRegioes(): Regiao[] {
  return [...REGIOES];
}

/**
 * Lista os estados de uma região, em ordem alfabética de nome.
 *
 * @throws {RegiaoInvalidaError} quando a região não existe.
 *
 * @example
 * listarEstadosPorRegiao("Sul") // [Paraná, Rio Grande do Sul, Santa Catarina]
 */
export function listarEstadosPorRegiao(regiao: Regiao, opcoes: OpcoesListaEstados = {}): Estado[] {
  if (!ehRegiao(regiao)) throw new RegiaoInvalidaError(regiao, REGIOES);
  return ordenar(
    DADOS_ESTADOS.filter((e) => e.regiao === regiao),
    opcoes.ordem,
  );
}

/**
 * Lista as 27 capitais do Brasil, em ordem alfabética de nome. Disponível de
 * forma síncrona, sem precisar de {@link carregarMunicipios} (as capitais já
 * vêm embutidas no pacote).
 *
 * @example
 * listarCapitais().length  // 27
 * listarCapitais()[0].nome // "Aracaju"
 */
export function listarCapitais(): Municipio[] {
  return [...DADOS_CAPITAIS].sort((a, b) => compararPtBr(a.nome, b.nome));
}

/**
 * Obtém a capital de um estado pela sigla da UF (sem diferenciar maiúsculas de minúsculas).
 *
 * @throws {UfInvalidaError} quando a sigla não é uma UF válida.
 *
 * @example
 * obterCapital("BA").nome // "Salvador"
 */
export function obterCapital(uf: UF): Municipio {
  const sigla = uf.toUpperCase();
  if (!ehUf(sigla)) throw new UfInvalidaError(uf, UFS);
  const capital = DADOS_CAPITAIS.find((c) => c.uf === sigla);
  if (!capital) throw new EstadoNaoEncontradoError(sigla);
  return capital;
}
