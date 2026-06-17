import { describe, expect, test } from "bun:test";
import { CoordenadaInvalidaError, distanciaKm } from "../src/index.ts";
import type { Municipio } from "../src/index.ts";
import { cidadeMaisProximaDe, cidadesDentroDoRaio } from "../src/geo/proximidade.ts";

function cidade(
  over: Partial<Municipio> & { codigoIbge: number; latitude: number; longitude: number },
): Municipio {
  return {
    nome: "Cidade",
    uf: "SP",
    codigoUf: 35,
    capital: false,
    ddd: 11,
    fusoHorario: "America/Sao_Paulo",
    codigoReceitaFederal: "0000",
    ...over,
  };
}

describe("distanciaKm", () => {
  test("São Paulo <-> Rio de Janeiro ≈ 360 km", () => {
    const d = distanciaKm(
      { latitude: -23.55, longitude: -46.63 },
      { latitude: -22.91, longitude: -43.2 },
    );
    expect(d).toBeGreaterThan(340);
    expect(d).toBeLessThan(380);
  });

  test("distância de um ponto a si mesmo é 0", () => {
    expect(distanciaKm({ latitude: -10, longitude: -50 }, { latitude: -10, longitude: -50 })).toBe(0);
  });

  test("coordenada fora dos limites lança CoordenadaInvalidaError", () => {
    expect(() => distanciaKm({ latitude: 100, longitude: 0 }, { latitude: 0, longitude: 0 })).toThrow(
      CoordenadaInvalidaError,
    );
  });
});

describe("proximidade (funções puras sobre lista)", () => {
  const lista = [
    cidade({ codigoIbge: 1, latitude: 0, longitude: 0 }),
    cidade({ codigoIbge: 2, latitude: 0, longitude: 0.1 }), // ~11 km
    cidade({ codigoIbge: 3, latitude: 0, longitude: 1 }), // ~111 km
  ];

  test("retorna dentro do raio, ordenado, excluindo a origem", () => {
    const resultado = cidadesDentroDoRaio(lista, { latitude: 0, longitude: 0 }, 50, {
      excluirCodigoIbge: 1,
    });
    expect(resultado.map((r) => r.cidade.codigoIbge)).toEqual([2]);
  });

  test("respeita o limite", () => {
    const resultado = cidadesDentroDoRaio(lista, { latitude: 0, longitude: 0 }, 1000, { limite: 1 });
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.cidade.codigoIbge).toBe(1);
  });

  test("cidadeMaisProximaDe encontra a menor distância", () => {
    const resultado = cidadeMaisProximaDe(lista, { latitude: 0, longitude: 0.03 });
    expect(resultado?.cidade.codigoIbge).toBe(1);
  });
});
