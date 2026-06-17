import { beforeAll, describe, expect, test } from "bun:test";
import {
  carregarMunicipios,
  CidadeNaoEncontradaError,
  ErroMunicipiosBr,
  RaioInvalidoError,
} from "../src/index.ts";
import type { ApiMunicipios } from "../src/index.ts";

const SAO_PAULO = 3550308;
const RIO_DE_JANEIRO = 3304557;

let municipios: ApiMunicipios;

beforeAll(async () => {
  municipios = await carregarMunicipios();
});

describe("carregarMunicipios / ApiMunicipios", () => {
  test("carrega os 5.571 municípios", () => {
    expect(municipios.total).toBe(5571);
    expect(municipios.listar()).toHaveLength(5571);
  });

  test("obter por código IBGE (e erro quando inexistente)", () => {
    expect(municipios.obter(SAO_PAULO).nome).toBe("São Paulo");
    expect(() => municipios.obter(1)).toThrow(CidadeNaoEncontradaError);
  });

  test("buscar com escopo de UF desambigua nomes", () => {
    const resultado = municipios.buscar("são paulo", { uf: "SP" });
    expect(resultado[0]?.codigoIbge).toBe(SAO_PAULO);
  });

  test("buscar nome repetido retorna mais de uma UF", () => {
    const resultado = municipios.buscar("bom jesus");
    expect(new Set(resultado.map((c) => c.uf)).size).toBeGreaterThan(1);
  });

  test("porEstado / porDdd / porFuso", () => {
    const sp = municipios.porEstado("SP");
    expect(sp.length).toBeGreaterThan(600);
    expect(sp.every((c) => c.uf === "SP")).toBe(true);

    expect(municipios.porDdd(11).every((c) => c.ddd === 11)).toBe(true);
    expect(municipios.porFuso("America/Noronha").length).toBeGreaterThan(0);
  });

  test("proximas: dentro do raio, ordenado, exclui a origem por padrão", () => {
    const proximas = municipios.proximas(SAO_PAULO, 50);
    expect(proximas.length).toBeGreaterThan(0);
    expect(proximas.every((p) => p.distanciaKm <= 50)).toBe(true);
    expect(proximas.some((p) => p.cidade.codigoIbge === SAO_PAULO)).toBe(false);
    for (let i = 1; i < proximas.length; i++) {
      expect(proximas[i]!.distanciaKm).toBeGreaterThanOrEqual(proximas[i - 1]!.distanciaKm);
    }
  });

  test("proximas com raio inválido lança RaioInvalidoError", () => {
    expect(() => municipios.proximas(SAO_PAULO, 0)).toThrow(RaioInvalidoError);
  });

  test("maisProxima de uma coordenada", () => {
    const resultado = municipios.maisProxima({ latitude: -23.55, longitude: -46.63 });
    expect(resultado.cidade.uf).toBe("SP");
    expect(resultado.distanciaKm).toBeLessThan(20);
  });

  test("distanciaEntre SP e RJ ≈ 360 km", () => {
    const d = municipios.distanciaEntre(SAO_PAULO, RIO_DE_JANEIRO);
    expect(d).toBeGreaterThan(340);
    expect(d).toBeLessThan(380);
  });

  test("ehCapital e obterEstadoDaCidade", () => {
    expect(municipios.ehCapital(SAO_PAULO)).toBe(true);
    expect(municipios.ehCapital(1)).toBe(false);
    expect(municipios.obterEstadoDaCidade(SAO_PAULO).uf).toBe("SP");
  });

  test("código Receita Federal (TOM/SIAFI) com zero à esquerda e lookup reverso", () => {
    expect(municipios.obter(SAO_PAULO).codigoReceitaFederal).toBe("7107");
    // lookup reverso (útil para dados de CNPJ): aceita string ou número, com/sem zero:
    expect(municipios.obterPorCodigoReceitaFederal("7107").codigoIbge).toBe(SAO_PAULO);
    expect(municipios.obterPorCodigoReceitaFederal(7107).codigoIbge).toBe(SAO_PAULO);
    const acrelandia = municipios.obterPorCodigoReceitaFederal(643); // -> "0643"
    expect(acrelandia.codigoReceitaFederal).toBe("0643");
    expect(acrelandia.nome).toBe("Acrelândia");
    expect(() => municipios.obterPorCodigoReceitaFederal("0000")).toThrow(ErroMunicipiosBr);
  });

  test("é memoizado (mesma instância em chamadas repetidas)", async () => {
    const a = await carregarMunicipios();
    const b = await carregarMunicipios();
    expect(a).toBe(b);
  });
});
