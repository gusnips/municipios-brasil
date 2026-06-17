import { describe, expect, test } from "bun:test";
import { compararPtBr, normalizarTexto } from "../src/index.ts";
import { buscarRanqueado, pontuar } from "../src/busca/autocomplete.ts";

describe("normalizar", () => {
  test("remove acentos, minimiza e colapsa espaços", () => {
    expect(normalizarTexto("São   Paulo ")).toBe("sao paulo");
    expect(normalizarTexto("Açaí")).toBe("acai");
    expect(normalizarTexto("ÓBIDOS")).toBe("obidos");
  });

  test("compararPtBr ordena de forma acento-insensível", () => {
    expect(["Áurea", "Areia"].sort(compararPtBr)).toEqual(["Areia", "Áurea"]);
  });
});

describe("pontuar", () => {
  test("exato(0) < prefixo(1) < palavra(2) < contém(3) < nada(null)", () => {
    expect(pontuar("sao paulo", "sao paulo")).toBe(0);
    expect(pontuar("sao paulo", "sao")).toBe(1);
    expect(pontuar("santo andre", "andr")).toBe(2);
    expect(pontuar("brasilia", "asil")).toBe(3);
    expect(pontuar("recife", "xyz")).toBeNull();
  });
});

describe("buscarRanqueado", () => {
  const itens = [{ n: "sao paulo" }, { n: "sao goncalo" }, { n: "santos" }, { n: "campinas" }];

  test("termo vazio retorna lista vazia", () => {
    expect(buscarRanqueado(itens, "  ", (x) => x.n)).toEqual([]);
  });

  test("ordena por pontuação e respeita o limite", () => {
    const resultado = buscarRanqueado(itens, "sa", (x) => x.n, { limite: 2 });
    expect(resultado).toHaveLength(2);
    // todos começam com "sa" (pontuação 1); desempate estável mantém a ordem original
    expect(resultado.map((x) => x.n)).toEqual(["sao paulo", "sao goncalo"]);
  });

  test("aplica desempate customizado", () => {
    const resultado = buscarRanqueado(itens, "sa", (x) => x.n, {
      desempate: (a, b) => a.n.localeCompare(b.n),
    });
    expect(resultado[0]?.n).toBe("santos");
  });
});
