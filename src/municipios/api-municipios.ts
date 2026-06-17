import type {
  Coordenada,
  Estado,
  FusoHorario,
  Municipio,
  OpcoesBuscaCidade,
  OpcoesProximidade,
  ResultadoProximidade,
  UF,
} from "../tipos/tipos";
import { CODIGO_UF_POR_SIGLA, FUSOS_HORARIOS, UFS } from "../tipos/gerados";
import { montarIndice } from "./indices";
import { buscarRanqueado } from "../busca/autocomplete";
import { compararPtBr } from "../busca/normalizar";
import { haversineKm } from "../geo/distancia";
import { cidadeMaisProximaDe, cidadesDentroDoRaio } from "../geo/proximidade";
import { ehFusoHorario, ehUf, obterEstado } from "../estados/estados";
import {
  CidadeNaoEncontradaError,
  CodigoErro,
  DddInvalidoError,
  ErroMunicipiosBr,
  FusoInvalidoError,
  RaioInvalidoError,
  UfInvalidaError,
} from "../erros/erros";

/**
 * Conjunto de operações **síncronas** sobre os municípios, obtido com
 * {@link carregarMunicipios}. Como os dados já estão em memória e indexados,
 * todos os métodos são síncronos e rápidos — ideal para autocomplete que
 * roda a cada tecla.
 */
export interface ApiMunicipios {
  /** Quantidade total de municípios carregados (5.571). */
  readonly total: number;

  /** Lista todos os municípios (ordenados por nome). */
  listar(): Municipio[];

  /**
   * Obtém um município pelo código IBGE.
   * @throws {CidadeNaoEncontradaError} se o código não existir.
   */
  obter(codigoIbge: number): Municipio;

  /**
   * Obtém um município pelo código da Receita Federal (TOM/SIAFI). Aceita string
   * ou número, com ou sem zero à esquerda (`"0643"`, `643`). Ideal para mapear o
   * campo `municipio` dos dados de CNPJ da Receita Federal de volta ao município.
   * @throws {ErroMunicipiosBr} (código `CIDADE_NAO_ENCONTRADA`) se não existir.
   *
   * @example
   * municipios.obterPorCodigoReceitaFederal("7107").nome // "São Paulo"
   */
  obterPorCodigoReceitaFederal(codigo: string | number): Municipio;

  /**
   * Busca municípios por nome, ranqueada e acento-insensível (autocomplete).
   * Use `opcoes.uf` para desambiguar nomes repetidos (há 232 nomes em mais de um estado).
   *
   * @example
   * municipios.buscar("são paulo", { uf: "SP" })
   * municipios.buscar("bom jesus")              // várias UFs; capitais primeiro
   */
  buscar(termo: string, opcoes?: OpcoesBuscaCidade): Municipio[];

  /** Lista os municípios de um estado (pela sigla, sem diferenciar caixa, ou pelo codigoUf). */
  porEstado(ufOuCodigo: UF | number): Municipio[];

  /**
   * Lista os municípios de um DDD.
   * @throws {DddInvalidoError} se o DDD não for um inteiro entre 11 e 99.
   */
  porDdd(ddd: number): Municipio[];

  /**
   * Lista os municípios de um fuso horário.
   * @throws {FusoInvalidoError} se o fuso não for válido.
   */
  porFuso(fuso: FusoHorario): Municipio[];

  /** Retorna o estado a que pertence um município. */
  obterEstadoDaCidade(codigoIbge: number): Estado;

  /** Indica se um município é a capital do seu estado. Retorna `false` para códigos desconhecidos. */
  ehCapital(codigoIbge: number): boolean;

  /**
   * Lista os municípios dentro de um raio (km) de uma origem — um código IBGE
   * ou uma coordenada — ordenados do mais próximo ao mais distante.
   *
   * @throws {RaioInvalidoError} se o raio não for um número > 0.
   * @throws {CidadeNaoEncontradaError} se a origem for um código IBGE inexistente.
   *
   * @example
   * municipios.proximas(3550308, 50)                              // vizinhas de São Paulo em 50 km
   * municipios.proximas({ latitude: -23.5, longitude: -46.6 }, 30)
   */
  proximas(origem: number | Coordenada, raioKm: number, opcoes?: OpcoesProximidade): ResultadoProximidade[];

  /** Retorna o município mais próximo de uma coordenada. */
  maisProxima(coordenada: Coordenada, opcoes?: { uf?: UF | UF[] }): ResultadoProximidade;

  /**
   * Distância em km entre dois municípios (por código IBGE).
   * @throws {CidadeNaoEncontradaError} se algum código não existir.
   */
  distanciaEntre(origemIbge: number, destinoIbge: number): number;
}

/**
 * Cria uma {@link ApiMunicipios} a partir de uma lista de municípios.
 * Útil para uso 100% síncrono combinando com o subpath de dados:
 *
 * @example
 * import { municipios } from "municipios-brasil/dados";
 * import { criarApiMunicipios } from "municipios-brasil";
 * const cidades = criarApiMunicipios(municipios);
 */
export function criarApiMunicipios(municipios: Municipio[]): ApiMunicipios {
  const indice = montarIndice(municipios);

  function obterCidade(codigoIbge: number): Municipio {
    const cidade = indice.porCodigoIbge.get(codigoIbge);
    if (!cidade) throw new CidadeNaoEncontradaError(codigoIbge);
    return cidade;
  }

  function codigosDasUfs(uf: UF | UF[]): number[] {
    const lista = Array.isArray(uf) ? uf : [uf];
    return lista.map((u) => {
      const sigla = typeof u === "string" ? u.toUpperCase() : u;
      if (!ehUf(sigla)) throw new UfInvalidaError(u, UFS);
      return CODIGO_UF_POR_SIGLA[sigla];
    });
  }

  function cidadesNasUfs(uf: UF | UF[]): Municipio[] {
    const reuniao: Municipio[] = [];
    for (const codigo of codigosDasUfs(uf)) {
      reuniao.push(...(indice.porCodigoUf.get(codigo) ?? []));
    }
    return reuniao;
  }

  return {
    total: indice.todos.length,

    listar() {
      return [...indice.todos];
    },

    obter(codigoIbge) {
      return obterCidade(codigoIbge);
    },

    obterPorCodigoReceitaFederal(codigo) {
      const normalizado = String(codigo).trim().padStart(4, "0");
      const cidade = indice.porCodigoReceitaFederal.get(normalizado);
      if (!cidade) {
        throw new ErroMunicipiosBr({
          codigo: CodigoErro.CIDADE_NAO_ENCONTRADA,
          oQue: `Nenhum município encontrado para o código da Receita Federal "${normalizado}".`,
          motivo: `Não existe município com código TOM/SIAFI "${normalizado}".`,
          solucao: `Confira o código (4 dígitos, ex.: "7107"). Lembre-se: os dados de CNPJ da Receita Federal usam este código (TOM), não o código IBGE.`,
        });
      }
      return cidade;
    },

    buscar(termo, opcoes = {}) {
      let candidatos = indice.buscaveis;
      if (opcoes.uf !== undefined) {
        const codigos = new Set(codigosDasUfs(opcoes.uf));
        candidatos = candidatos.filter((b) => codigos.has(b.cidade.codigoUf));
      }
      if (opcoes.somenteCapitais) {
        candidatos = candidatos.filter((b) => b.cidade.capital);
      }
      const encontrados = buscarRanqueado(candidatos, termo, (b) => b.nomeNormalizado, {
        limite: opcoes.limite,
        desempate: (a, b) =>
          Number(b.cidade.capital) - Number(a.cidade.capital) || compararPtBr(a.cidade.nome, b.cidade.nome),
      });
      return encontrados.map((b) => b.cidade);
    },

    porEstado(ufOuCodigo) {
      const estado = obterEstado(ufOuCodigo);
      return [...(indice.porCodigoUf.get(estado.codigoUf) ?? [])];
    },

    porDdd(ddd) {
      if (!Number.isInteger(ddd) || ddd < 11 || ddd > 99) throw new DddInvalidoError(ddd);
      return [...(indice.porDdd.get(ddd) ?? [])];
    },

    porFuso(fuso) {
      if (!ehFusoHorario(fuso)) throw new FusoInvalidoError(fuso, FUSOS_HORARIOS);
      return [...(indice.porFuso.get(fuso) ?? [])];
    },

    obterEstadoDaCidade(codigoIbge) {
      return obterEstado(obterCidade(codigoIbge).codigoUf);
    },

    ehCapital(codigoIbge) {
      return indice.porCodigoIbge.get(codigoIbge)?.capital ?? false;
    },

    proximas(origem, raioKm, opcoes = {}) {
      if (!Number.isFinite(raioKm) || raioKm <= 0) throw new RaioInvalidoError(raioKm);
      let coordenada: Coordenada;
      let excluirCodigoIbge: number | undefined;
      if (typeof origem === "number") {
        const cidade = obterCidade(origem);
        coordenada = { latitude: cidade.latitude, longitude: cidade.longitude };
        excluirCodigoIbge = opcoes.incluirOrigem ? undefined : cidade.codigoIbge;
      } else {
        coordenada = origem;
      }
      const lista = opcoes.uf !== undefined ? cidadesNasUfs(opcoes.uf) : indice.todos;
      return cidadesDentroDoRaio(lista, coordenada, raioKm, {
        excluirCodigoIbge,
        limite: opcoes.limite,
      });
    },

    maisProxima(coordenada, opcoes = {}) {
      const lista = opcoes.uf !== undefined ? cidadesNasUfs(opcoes.uf) : indice.todos;
      const resultado = cidadeMaisProximaDe(lista, coordenada);
      if (!resultado) {
        throw new ErroMunicipiosBr({
          codigo: CodigoErro.PARAMETRO_INVALIDO,
          oQue: "Não há municípios no escopo informado.",
          motivo: "A lista de cidades considerada ficou vazia (verifique o filtro de UF).",
          solucao: "Remova o filtro `uf` ou informe UFs que possuam municípios.",
        });
      }
      return resultado;
    },

    distanciaEntre(origemIbge, destinoIbge) {
      return haversineKm(obterCidade(origemIbge), obterCidade(destinoIbge));
    },
  };
}
