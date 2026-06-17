import { describe, expect, test } from "bun:test";
import {
  CidadeNaoEncontradaError,
  CodigoErro,
  ErroMunicipiosBr,
  RaioInvalidoError,
  UFS,
  UfInvalidaError,
} from "../src/index.ts";

describe("erros", () => {
  test("UfInvalidaError traz o que/por que/como resolver + sugestão", () => {
    const erro = new UfInvalidaError("SX", UFS);

    expect(erro).toBeInstanceOf(ErroMunicipiosBr);
    expect(erro).toBeInstanceOf(Error);
    expect(erro.name).toBe("UfInvalidaError");
    expect(erro.codigo).toBe(CodigoErro.UF_INVALIDA);

    expect(erro.oQue.length).toBeGreaterThan(0);
    expect(erro.motivo.length).toBeGreaterThan(0);
    expect(erro.solucao.length).toBeGreaterThan(0);

    expect(erro.sugestao).toBeDefined();
    expect(UFS.some((uf) => uf === erro.sugestao)).toBe(true);

    expect(erro.message).toContain("• Motivo:");
    expect(erro.message).toContain("• Como resolver:");
    expect(erro.message).toContain("• Você quis dizer:");
  });

  test("CidadeNaoEncontradaError inclui o código procurado", () => {
    const erro = new CidadeNaoEncontradaError(9999999);
    expect(erro.codigo).toBe(CodigoErro.CIDADE_NAO_ENCONTRADA);
    expect(erro.message).toContain("9999999");
    expect(erro.name).toBe("CidadeNaoEncontradaError");
  });

  test("RaioInvalidoError", () => {
    const erro = new RaioInvalidoError(-5);
    expect(erro.codigo).toBe(CodigoErro.RAIO_INVALIDO);
    expect(erro.message).toContain("-5");
  });
});
