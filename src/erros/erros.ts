import { normalizarTexto } from "../busca/normalizar";

/**
 * Códigos legíveis por máquina para identificar o tipo de erro
 * sem depender da mensagem (que é em pt-br e pode mudar).
 */
export enum CodigoErro {
  UF_INVALIDA = "UF_INVALIDA",
  ESTADO_NAO_ENCONTRADO = "ESTADO_NAO_ENCONTRADO",
  CIDADE_NAO_ENCONTRADA = "CIDADE_NAO_ENCONTRADA",
  REGIAO_INVALIDA = "REGIAO_INVALIDA",
  COORDENADA_INVALIDA = "COORDENADA_INVALIDA",
  RAIO_INVALIDO = "RAIO_INVALIDO",
  DDD_INVALIDO = "DDD_INVALIDO",
  FUSO_INVALIDO = "FUSO_INVALIDO",
  PARAMETRO_INVALIDO = "PARAMETRO_INVALIDO",
}

interface DetalhesErro {
  codigo: CodigoErro;
  oQue: string;
  motivo: string;
  solucao: string;
  sugestao?: string;
}

/**
 * Erro base do pacote. Toda mensagem explica **o que** aconteceu,
 * **por que** e **como resolver** — e, quando possível, sugere a correção.
 *
 * Capture por `instanceof ErroMunicipiosBr` (ou uma subclasse) e use
 * {@link ErroMunicipiosBr.codigo} para tratamento programático.
 */
export class ErroMunicipiosBr extends Error {
  /** Código estável do erro, para tratamento programático. */
  readonly codigo: CodigoErro;
  /** O que aconteceu. */
  readonly oQue: string;
  /** Por que aconteceu. */
  readonly motivo: string;
  /** Como resolver. */
  readonly solucao: string;
  /** Sugestão de correção ("você quis dizer?"), quando aplicável. */
  readonly sugestao?: string;

  constructor(detalhes: DetalhesErro) {
    const partes = [
      detalhes.oQue,
      "",
      `• Motivo: ${detalhes.motivo}`,
      `• Como resolver: ${detalhes.solucao}`,
    ];
    if (detalhes.sugestao) partes.push(`• Você quis dizer: ${detalhes.sugestao}?`);
    super(partes.join("\n"));

    this.name = "ErroMunicipiosBr";
    this.codigo = detalhes.codigo;
    this.oQue = detalhes.oQue;
    this.motivo = detalhes.motivo;
    this.solucao = detalhes.solucao;
    this.sugestao = detalhes.sugestao;

    // Preserva a cadeia de protótipos correta ao estender Error.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function citar(valor: unknown): string {
  return typeof valor === "string" ? `"${valor}"` : String(valor);
}

/** Distância de edição de Levenshtein entre duas strings. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let anterior: number[] = [];
  for (let j = 0; j <= n; j++) anterior[j] = j;
  for (let i = 1; i <= m; i++) {
    const atual: number[] = [i];
    for (let j = 1; j <= n; j++) {
      const custo = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      const remover = (anterior[j] ?? 0) + 1;
      const inserir = (atual[j - 1] ?? 0) + 1;
      const substituir = (anterior[j - 1] ?? 0) + custo;
      atual[j] = Math.min(remover, inserir, substituir);
    }
    anterior = atual;
  }
  return anterior[n] ?? 0;
}

/**
 * Encontra, entre `candidatos`, o mais parecido com `termo` (acento-insensível).
 * Retorna `undefined` se o melhor candidato estiver além de `limiar` edições.
 */
export function sugerirMaisProximo(
  termo: string,
  candidatos: readonly string[],
  limiar = 2,
): string | undefined {
  const alvo = normalizarTexto(termo);
  if (!alvo) return undefined;
  let melhor: string | undefined;
  let menor = Infinity;
  for (const candidato of candidatos) {
    const distancia = levenshtein(alvo, normalizarTexto(candidato));
    if (distancia < menor) {
      menor = distancia;
      melhor = candidato;
    }
  }
  return menor <= limiar ? melhor : undefined;
}

/** Sigla de UF inválida (ex.: `"XX"`). */
export class UfInvalidaError extends ErroMunicipiosBr {
  constructor(valorRecebido: unknown, ufsValidas: readonly string[]) {
    super({
      codigo: CodigoErro.UF_INVALIDA,
      oQue: `A UF ${citar(valorRecebido)} é inválida.`,
      motivo: `${citar(valorRecebido)} não corresponde a nenhuma das 27 unidades federativas do Brasil.`,
      solucao:
        `Use a sigla de 2 letras em maiúsculas (ex.: "SP", "RJ"). ` +
        `Para procurar por nome, use buscarEstados("..."). UFs válidas: ${ufsValidas.join(", ")}.`,
      sugestao:
        typeof valorRecebido === "string" ? sugerirMaisProximo(valorRecebido, ufsValidas, 1) : undefined,
    });
    this.name = "UfInvalidaError";
  }
}

/** Estado não encontrado para a sigla ou o código informado. */
export class EstadoNaoEncontradoError extends ErroMunicipiosBr {
  constructor(siglaOuCodigo: number | string) {
    super({
      codigo: CodigoErro.ESTADO_NAO_ENCONTRADO,
      oQue: `Nenhum estado encontrado para ${citar(siglaOuCodigo)}.`,
      motivo:
        typeof siglaOuCodigo === "number"
          ? `Não existe estado com codigoUf ${siglaOuCodigo}.`
          : `Não existe estado com a sigla ${citar(siglaOuCodigo)}.`,
      solucao: `Use um codigoUf entre 11 e 53 ou uma sigla de UF válida. Veja listarEstados() para a lista completa.`,
    });
    this.name = "EstadoNaoEncontradoError";
  }
}

/** Município não encontrado para o código IBGE informado. */
export class CidadeNaoEncontradaError extends ErroMunicipiosBr {
  constructor(codigoIbge: number) {
    super({
      codigo: CodigoErro.CIDADE_NAO_ENCONTRADA,
      oQue: `Nenhum município encontrado para o código IBGE ${citar(codigoIbge)}.`,
      motivo: `Não existe município com codigoIbge ${citar(codigoIbge)}.`,
      solucao: `Confira o código IBGE (são 7 dígitos). Para buscar por nome, use (await carregarMunicipios()).buscar("...").`,
    });
    this.name = "CidadeNaoEncontradaError";
  }
}

/** Região inválida (ex.: `"Sudoeste"`). */
export class RegiaoInvalidaError extends ErroMunicipiosBr {
  constructor(valorRecebido: unknown, regioesValidas: readonly string[]) {
    super({
      codigo: CodigoErro.REGIAO_INVALIDA,
      oQue: `A região ${citar(valorRecebido)} é inválida.`,
      motivo: `${citar(valorRecebido)} não é uma das regiões do Brasil.`,
      solucao: `Use uma destas regiões: ${regioesValidas.join(", ")}.`,
      sugestao:
        typeof valorRecebido === "string" ? sugerirMaisProximo(valorRecebido, regioesValidas, 3) : undefined,
    });
    this.name = "RegiaoInvalidaError";
  }
}

/** Coordenada geográfica fora dos limites válidos. */
export class CoordenadaInvalidaError extends ErroMunicipiosBr {
  constructor(detalhe: string) {
    super({
      codigo: CodigoErro.COORDENADA_INVALIDA,
      oQue: `Coordenada geográfica inválida.`,
      motivo: detalhe,
      solucao: `Informe latitude entre -90 e 90 e longitude entre -180 e 180, ambas como números finitos.`,
    });
    this.name = "CoordenadaInvalidaError";
  }
}

/** Raio de busca inválido (zero, negativo ou não numérico). */
export class RaioInvalidoError extends ErroMunicipiosBr {
  constructor(raio: unknown) {
    super({
      codigo: CodigoErro.RAIO_INVALIDO,
      oQue: `Raio inválido: ${citar(raio)}.`,
      motivo: `O raio (em km) precisa ser um número finito maior que zero.`,
      solucao: `Passe um valor positivo em km, como 50. Ex.: proximas(origem, 50).`,
    });
    this.name = "RaioInvalidoError";
  }
}

/** DDD fora do intervalo válido (11–99). */
export class DddInvalidoError extends ErroMunicipiosBr {
  constructor(ddd: unknown) {
    super({
      codigo: CodigoErro.DDD_INVALIDO,
      oQue: `DDD inválido: ${citar(ddd)}.`,
      motivo: `O DDD precisa ser um número inteiro entre 11 e 99.`,
      solucao: `Use um DDD existente, como 11 (São Paulo) ou 21 (Rio de Janeiro).`,
    });
    this.name = "DddInvalidoError";
  }
}

/** Fuso horário inválido. */
export class FusoInvalidoError extends ErroMunicipiosBr {
  constructor(valorRecebido: unknown, fusosValidos: readonly string[]) {
    super({
      codigo: CodigoErro.FUSO_INVALIDO,
      oQue: `O fuso horário ${citar(valorRecebido)} é inválido.`,
      motivo: `${citar(valorRecebido)} não é um dos fusos horários dos municípios brasileiros.`,
      solucao: `Use um destes: ${fusosValidos.join(", ")}.`,
      sugestao:
        typeof valorRecebido === "string" ? sugerirMaisProximo(valorRecebido, fusosValidos, 4) : undefined,
    });
    this.name = "FusoInvalidoError";
  }
}
