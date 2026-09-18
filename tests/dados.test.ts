import { describe, expect, test } from "bun:test";
import {
  criarApiMunicipios,
  formatarCidadeUf,
  listarEstados,
  municipios,
  obterCapital,
} from "../src/dados/index.ts";
import * as raiz from "../src/index.ts";

describe("subpath /dados", () => {
  // O Metro (React Native) não resolve o `import()` dinâmico de
  // `carregarMunicipios`, então /dados precisa entregar a API síncrona inteira
  // sem ele — é por aqui que um app RN usa o pacote.
  test("entrega tudo o que a raiz entrega, menos carregarMunicipios", async () => {
    const dados = await import("../src/dados/index.ts");
    const faltando = Object.keys(raiz).filter((chave) => !(chave in dados));
    expect(faltando).toEqual(["carregarMunicipios"]);
  });

  test("a API de municípios funciona a partir dos dados crus", () => {
    const api = criarApiMunicipios(municipios);
    expect(api.porEstado("SP")).toHaveLength(645);
    expect(api.buscar("belem", { limite: 1 })[0]?.uf).toBe("PA");
    expect(formatarCidadeUf(api.obter(3550308))).toBe("São Paulo/SP");
  });

  test("estados e capitais vêm ordenados por nome", () => {
    expect(listarEstados()[0]?.nome).toBe("Acre");
    expect(obterCapital("SP").nome).toBe("São Paulo");
  });
});
