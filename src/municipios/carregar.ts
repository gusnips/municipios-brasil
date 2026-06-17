import type { ApiMunicipios } from "./api-municipios";
import { criarApiMunicipios } from "./api-municipios";

let cache: ApiMunicipios | undefined;
let carregando: Promise<ApiMunicipios> | undefined;

/**
 * Carrega os municípios sob demanda e devolve uma {@link ApiMunicipios} com
 * todas as operações **síncronas** (busca, proximidade, filtros etc.).
 *
 * Os dados (~147 KB gzip) ficam em um `import()` dinâmico: bundlers como Vite
 * e webpack os separam em um chunk próprio, carregado só quando esta função é
 * chamada — não pesam no bundle inicial do seu app. O resultado é memoizado,
 * então chamar várias vezes (inclusive sob React StrictMode) reaproveita a
 * mesma instância e não recarrega nada.
 *
 * @example
 * const municipios = await carregarMunicipios();
 * municipios.buscar("São Pau", { uf: "SP" });
 * municipios.proximas(3550308, 50);
 */
export async function carregarMunicipios(): Promise<ApiMunicipios> {
  if (cache) return cache;
  if (carregando) return carregando;

  carregando = import("../dados/municipios.gerado")
    .then((modulo) => {
      cache = criarApiMunicipios(modulo.municipios);
      return cache;
    })
    .catch((erro) => {
      // Permite nova tentativa caso o carregamento do chunk falhe.
      carregando = undefined;
      throw erro;
    });

  return carregando;
}
