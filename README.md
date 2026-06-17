# municipios-brasil

> Estados, cidades e capitais do Brasil em TypeScript — busca/autocomplete, filtro por estado e proximidade geográfica. **DX 100% em pt-br**, com tipos precisos e erros que dizem o que houve, por quê e como resolver.

- 🇧🇷 **27 estados, 27 capitais e 5.571 municípios** (fonte IBGE), com tipos literais para `UF`, `Regiao` e `FusoHorario`.
- ⚡ **Estados, capitais, regiões, geo e formatação são síncronos** (dados embutidos, ~1 KB gzip) — funcionam sem `await`.
- 📦 **Municípios sob demanda:** `carregarMunicipios()` faz um `import()` dinâmico; o bundler separa os ~147 KB (gzip) em um **chunk próprio**, fora do bundle inicial. Depois disso, tudo é **síncrono** (ideal para autocomplete a cada tecla).
- 🔎 **Autocomplete acento-insensível** (algoritmo puro, sem UI) com desambiguação por UF.
- 🧭 **Cidades próximas por raio**, cidade mais próxima de uma coordenada e distância entre cidades (Haversine).
- 0️⃣ **Zero dependências de runtime.** ESM + CJS, tipos válidos em todos os modos de resolução.

```bash
bun add municipios-brasil
# ou: npm i municipios-brasil · pnpm add municipios-brasil · yarn add municipios-brasil
```

## Início rápido

```ts
import { listarEstados, obterEstado, carregarMunicipios } from "municipios-brasil";

// Estados são síncronos — sem await:
listarEstados().length;          // 27
obterEstado("sp").nome;          // "São Paulo"  (aceita "SP", "sp" ou o código 35)

// Municípios carregam sob demanda e devolvem uma API síncrona:
const municipios = await carregarMunicipios();

municipios.total;                              // 5571
municipios.buscar("são pau", { uf: "SP" });    // [São Paulo, ...]  (autocomplete)
municipios.porEstado("RJ");                    // todos os municípios do RJ
municipios.proximas(3550308, 50);              // vizinhos de São Paulo num raio de 50 km
```

## Uso no React (autocomplete)

O pacote **não inclui componentes** — só o algoritmo. Carregue uma vez e busque de forma síncrona a cada tecla:

```tsx
import { useEffect, useState } from "react";
import { carregarMunicipios, type ApiMunicipios, type Municipio } from "municipios-brasil";

export function useMunicipios() {
  const [api, setApi] = useState<ApiMunicipios | null>(null);
  useEffect(() => {
    // Dispara o download do chunk (uma vez; memoizado e seguro sob StrictMode).
    carregarMunicipios().then(setApi);
  }, []);
  return api;
}

function SeletorDeCidade() {
  const api = useMunicipios();
  const [termo, setTermo] = useState("");
  // Busca síncrona por tecla — sem rede, sem debounce de Promise:
  const sugestoes: Municipio[] = api ? api.buscar(termo, { uf: "SP", limite: 8 }) : [];

  return (
    <>
      <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Cidade…" />
      <ul>{sugestoes.map((c) => <li key={c.codigoIbge}>{c.nome}/{c.uf}</li>)}</ul>
    </>
  );
}
```

## API

### Estados, regiões e capitais — síncrono

| Função | Retorno | Descrição |
| --- | --- | --- |
| `listarEstados()` | `Estado[]` | Os 27 estados (com DF). |
| `obterEstado(uf \| codigoUf)` | `Estado` | Por sigla (aceita minúsculas) ou código. Lança se inválido. |
| `buscarEstados(termo, { limite? })` | `Estado[]` | Busca por nome ou sigla, ranqueada e acento-insensível. |
| `listarRegioes()` | `Regiao[]` | As 5 regiões. |
| `listarEstadosPorRegiao(regiao)` | `Estado[]` | Estados de uma região. |
| `listarCapitais()` | `Municipio[]` | As 27 capitais (sem precisar carregar municípios). |
| `obterCapital(uf)` | `Municipio` | Capital de um estado. |
| `ehUf(v)` / `ehRegiao(v)` / `ehFusoHorario(v)` | type guard | Validação sem lançar erro. |

### `carregarMunicipios(): Promise<ApiMunicipios>`

Carrega os municípios (chunk sob demanda, memoizado) e devolve uma API **síncrona**:

| Método | Descrição |
| --- | --- |
| `listar()` · `total` | Todos os municípios / a contagem. |
| `obter(codigoIbge)` | Um município pelo código IBGE (lança se não existir). |
| `obterPorCodigoReceitaFederal(codigo)` | Um município pelo código TOM/SIAFI da Receita Federal (aceita `"0643"` ou `643`). Útil para dados de CNPJ. |
| `buscar(termo, { limite?, uf?, somenteCapitais? })` | Autocomplete ranqueado e acento-insensível. Use `uf` para desambiguar (há 232 nomes repetidos entre estados). |
| `porEstado(uf \| codigoUf)` | Municípios de um estado. |
| `porDdd(ddd)` · `porFuso(fuso)` | Filtra por DDD ou fuso horário. |
| `obterEstadoDaCidade(codigoIbge)` | O estado de um município. |
| `ehCapital(codigoIbge)` | Se é capital (não lança). |
| `proximas(origem, raioKm, { limite?, incluirOrigem?, uf? })` | Cidades num raio (origem = código IBGE **ou** coordenada), ordenadas por distância. |
| `maisProxima(coordenada, { uf? })` | A cidade mais próxima de uma coordenada. |
| `distanciaEntre(ibgeA, ibgeB)` | Distância em km entre dois municípios. |

### Código da Receita Federal (TOM/SIAFI)

Cada município traz `codigoReceitaFederal`: o **código TOM** (*Tabela de Órgãos e Municípios*), idêntico ao código SIAFI, como **string de 4 dígitos com zero à esquerda**. É o código que a Receita Federal usa — por exemplo, no campo `municipio` dos **dados abertos de CNPJ** (que **não** usam o código IBGE).

```ts
const m = await carregarMunicipios();
m.obter(3550308).codigoReceitaFederal;             // "7107"  (São Paulo)
// mapeia o código de um registro de CNPJ de volta ao município (aceita "0643" ou 643):
m.obterPorCodigoReceitaFederal("0643").nome;        // "Acrelândia"
```

> Para **NF-e e SPED**, use o código IBGE (`codigoIbge`), não o TOM. Fontes oficiais: [Receita Federal — Órgãos e Municípios](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/orgaos-e-municipios) · [Tesouro/SIAFI](https://www.tesourotransparente.gov.br/ckan/dataset/lista-de-municipios-do-siafi).

### Geo, texto e formatação — síncrono (sem dados)

```ts
import { distanciaKm, normalizarTexto, formatarCidadeUf } from "municipios-brasil";

distanciaKm({ latitude: -23.55, longitude: -46.63 }, { latitude: -22.91, longitude: -43.2 }); // ~358
normalizarTexto("São   Paulo");        // "sao paulo"
formatarCidadeUf(cidade);              // "São Paulo/SP"  (separador configurável)
```

### Constantes e tipos

```ts
import {
  UFS, REGIOES, FUSOS_HORARIOS, CODIGO_UF_POR_SIGLA,
  type Estado, type Municipio, type Coordenada, type UF, type Regiao, type FusoHorario,
} from "municipios-brasil";
```

### Subpath `municipios-brasil/dados` — acesso síncrono aos dados crus

Para scripts Node, SSR ou etapas de build que querem os arrays **sem** `await` (importar este caminho inclui o dataset de municípios no seu bundle, de propósito):

```ts
import { estados, capitais, municipios, meta } from "municipios-brasil/dados";
import { criarApiMunicipios } from "municipios-brasil";

const api = criarApiMunicipios(municipios); // mesma ApiMunicipios, 100% síncrona
```

## Erros — o que / por quê / como resolver

Todo erro é uma subclasse de `ErroMunicipiosBr` e traz `codigo` (estável, para tratamento programático), além de mensagem explicativa e, quando possível, uma sugestão ("você quis dizer?").

```ts
import { obterEstado, ErroMunicipiosBr, UfInvalidaError, CodigoErro } from "municipios-brasil";

try {
  obterEstado("XX");
} catch (e) {
  if (e instanceof UfInvalidaError) console.log(e.codigo); // "UF_INVALIDA"
  if (e instanceof ErroMunicipiosBr) console.log(e.message);
}
/*
A UF "XX" é inválida.

• Motivo: "XX" não corresponde a nenhuma das 27 unidades federativas do Brasil.
• Como resolver: use a sigla de 2 letras em maiúsculas (ex.: "SP", "RJ"). Para procurar por nome, use buscarEstados("..."). UFs válidas: AC, AL, ...
*/
```

Catálogo: `UfInvalidaError`, `EstadoNaoEncontradoError`, `CidadeNaoEncontradaError`, `RegiaoInvalidaError`, `CoordenadaInvalidaError`, `RaioInvalidoError`, `DddInvalidoError`, `FusoInvalidoError`.

## Desempenho e bundle

- **Bundle inicial enxuto:** o entry principal tem ~5 KB gzip; os municípios (~147 KB gzip) só são baixados quando você chama `carregarMunicipios()`, em um chunk separado e cacheável.
- **Busca síncrona:** os índices (por código, UF, DDD, fuso + nomes normalizados) são montados uma vez no carregamento; cada busca é uma varredura em memória.
- **Consumidores CJS:** funcionam normalmente (em Node, `carregarMunicipios()` resolve via `import()` dinâmico). Note que o **code-splitting do chunk só acontece para consumidores ESM** (Vite/webpack modernos); em um bundle CJS o dataset é incluído junto. Comportamento esperado.

## Atualização dos dados (mantenedores)

Os arquivos `src/**/*.gerado.ts` são gerados — **não edite à mão**. Para atualizar a partir da fonte:

```bash
bun run dados:atualizar   # baixa, valida, transforma e regenera + imprime o diff
bun run build             # reconstrói JS (ESM+CJS) e tipos
bun run verificar:build   # garante que os municípios saíram em chunk separado
```

## Créditos

Dados de [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros) (base IBGE). A data de captura e as contagens ficam em `meta` (subpath `/dados`).

## Licença

[MIT](./LICENSE) © Gustavo Salomé (gusnips)
