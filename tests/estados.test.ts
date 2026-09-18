import { describe, expect, test } from "bun:test";
import {
  buscarEstados,
  ehFusoHorario,
  ehRegiao,
  ehUf,
  listarCapitais,
  listarEstados,
  listarEstadosPorRegiao,
  listarRegioes,
  obterCapital,
  obterEstado,
} from "../src/index.ts";
import { EstadoNaoEncontradoError, RegiaoInvalidaError, UfInvalidaError } from "../src/index.ts";
import type { UF } from "../src/index.ts";

describe("estados", () => {
  test("lista os 27 estados (com DF)", () => {
    const estados = listarEstados();
    expect(estados).toHaveLength(27);
    expect(estados.some((e) => e.uf === "DF")).toBe(true);
  });

  test("lista em ordem de nome por padrão", () => {
    const nomes = listarEstados().map((e) => e.nome);
    expect(nomes[0]).toBe("Acre");
    expect(nomes.at(-1)).toBe("Tocantins");
    // Ordem de nome não é ordem de sigla: Amapá vem antes de Amazonas.
    expect(listarEstados().map((e) => e.uf).slice(0, 4)).toEqual(["AC", "AL", "AP", "AM"]);
  });

  test("ordem 'sigla' e ordem 'ibge'", () => {
    expect(
      listarEstados({ ordem: "sigla" })
        .map((e) => e.uf)
        .slice(0, 4),
    ).toEqual(["AC", "AL", "AM", "AP"]);
    // A tabela do IBGE agrupa por região — o Norte vem primeiro.
    expect(
      listarEstados({ ordem: "ibge" })
        .map((e) => e.uf)
        .slice(0, 4),
    ).toEqual(["RO", "AC", "AM", "RR"]);
  });

  test("listar não deixa a lista interna ser reordenada por fora", () => {
    listarEstados({ ordem: "sigla" });
    expect(listarEstados({ ordem: "ibge" })[0]?.uf).toBe("RO");
  });

  test("obterEstado aceita sigla e código numérico", () => {
    expect(obterEstado("SP").nome).toBe("São Paulo");
    expect(obterEstado("SP").codigoUf).toBe(35);
    expect(obterEstado(33).uf).toBe("RJ");
  });

  test("obterEstado é tolerante a minúsculas em runtime", () => {
    // O tipo UF é canônico (maiúsculo); em runtime aceitamos minúsculas.
    const minuscula: string = "rj";
    expect(obterEstado(minuscula as UF).uf).toBe("RJ");
  });

  test("obterEstado lança UfInvalidaError para sigla inválida", () => {
    // string -> UF é uma asserção de estreitamento válida (UF ⊆ string).
    const ufInvalida: string = "ZZ";
    expect(() => obterEstado(ufInvalida as UF)).toThrow(UfInvalidaError);
  });

  test("obterEstado lança EstadoNaoEncontradoError para código inexistente", () => {
    expect(() => obterEstado(99)).toThrow(EstadoNaoEncontradoError);
  });

  test("buscarEstados é acento-insensível e ranqueado", () => {
    const porNome = buscarEstados("sao paulo");
    expect(porNome[0]?.uf).toBe("SP");

    const porSigla = buscarEstados("rj");
    expect(porSigla[0]?.uf).toBe("RJ");

    expect(buscarEstados("")).toEqual([]);
  });

  test("regiões: 5 no total e filtro por região", () => {
    expect(listarRegioes()).toHaveLength(5);
    const sul = listarEstadosPorRegiao("Sul");
    // Em ordem de nome: Paraná, Rio Grande do Sul, Santa Catarina.
    expect(sul.map((e) => e.uf)).toEqual(["PR", "RS", "SC"]);
  });

  test("listarEstadosPorRegiao lança RegiaoInvalidaError", () => {
    const regiao: string = "Sudoeste";
    expect(() => listarEstadosPorRegiao(regiao as never)).toThrow(RegiaoInvalidaError);
  });

  test("capitais: 27 no total e obtenção por UF", () => {
    expect(listarCapitais()).toHaveLength(27);
    expect(listarCapitais().every((c) => c.capital)).toBe(true);
    expect(listarCapitais()[0]?.nome).toBe("Aracaju");
    expect(obterCapital("BA").nome).toBe("Salvador");
    expect(obterCapital("SP").nome).toBe("São Paulo");
  });

  test("type guards", () => {
    expect(ehUf("SP")).toBe(true);
    expect(ehUf("xx")).toBe(false);
    expect(ehRegiao("Sul")).toBe(true);
    expect(ehRegiao("Leste")).toBe(false);
    expect(ehFusoHorario("America/Sao_Paulo")).toBe(true);
    expect(ehFusoHorario("America/Manaus")).toBe(false);
  });
});
