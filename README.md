# municipios-brasil

> Estados, cidades e capitais do Brasil em TypeScript — busca/autocomplete, filtro por estado e proximidade geográfica. **API e documentação em pt-br**, com tipos precisos e erros que dizem o que aconteceu, por quê e como resolver.

- 🇧🇷 **27 estados, 27 capitais e 5.571 municípios** (base IBGE), com tipos literais para `UF`, `Regiao` e `FusoHorario`.
- ⚡ **Estados, capitais, regiões, geo e formatação são síncronos** (dados embutidos, ~1 KB gzip) — funcionam sem `await`.
- 📦 **Municípios sob demanda:** `carregarMunicipios()` faz um `import()` dinâmico; o bundler (Vite/webpack) separa os ~147 KB (gzip) em um arquivo à parte, carregado só quando você precisa — fora do bundle inicial. Depois disso, tudo é **síncrono** (dá pra buscar a cada tecla).
- 🔎 **Autocomplete que ignora acentos e maiúsculas** (só o algoritmo, sem componentes de tela), diferenciando cidades de mesmo nome por UF.
- 🧭 **Cidades dentro de um raio em km**, cidade mais próxima de uma coordenada e distância entre cidades (Haversine).
- 🧾 **Código da Receita Federal (TOM/SIAFI)** de cada município — útil para casar com os dados de CNPJ.
- 0️⃣ **Sem dependências em produção.** ESM + CJS, com tipos que resolvem em qualquer modo (`node10`, `node16` e bundler).

## Instalação

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

O pacote **não traz componentes de tela** — só o algoritmo de busca. A ideia é carregar uma vez e buscar de forma síncrona a cada tecla:

```tsx
import { useEffect, useState } from "react";
import { carregarMunicipios, type ApiMunicipios, type Municipio } from "municipios-brasil";

export function useMunicipios() {
  const [api, setApi] = useState<ApiMunicipios | null>(null);
  useEffect(() => {
    // Baixa os municípios uma vez (fica em cache; seguro no StrictMode do React).
    carregarMunicipios().then(setApi);
  }, []);
  return api;
}

function SeletorDeCidade() {
  const api = useMunicipios();
  const [termo, setTermo] = useState("");
  // Busca síncrona a cada tecla — sem ida à rede, sem await:
  const sugestoes: Municipio[] = api ? api.buscar(termo, { uf: "SP", limite: 8 }) : [];

  return (
    <>
      <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Cidade…" />
      <ul>{sugestoes.map((c) => <li key={c.codigoIbge}>{c.nome}/{c.uf}</li>)}</ul>
    </>
  );
}
```

---

# API

## Estados e regiões (síncrono)

| Função | Retorno | O que faz |
| --- | --- | --- |
| `listarEstados()` | `Estado[]` | Lista os 27 estados (incluindo o DF). |
| `obterEstado(ufOuCodigo)` | `Estado` | Busca um estado pela sigla (aceita minúsculas) ou pelo `codigoUf`. Lança um erro se não existir. |
| `buscarEstados(termo, opcoes?)` | `Estado[]` | Busca por nome ou sigla, ordenada por relevância e ignorando acentos. `opcoes`: `{ limite? }`. |
| `listarRegioes()` | `Regiao[]` | Lista as 5 regiões. |
| `listarEstadosPorRegiao(regiao)` | `Estado[]` | Lista os estados de uma região. |
| `ehUf(valor)` | `valor is UF` | Diz se o valor é uma sigla de UF válida (não lança). |
| `ehRegiao(valor)` | `valor is Regiao` | Diz se o valor é uma região válida (não lança). |
| `ehFusoHorario(valor)` | `valor is FusoHorario` | Diz se o valor é um fuso horário válido (não lança). |

```ts
import { obterEstado, buscarEstados, listarEstadosPorRegiao, ehUf } from "municipios-brasil";

obterEstado("MG").nome;                 // "Minas Gerais"
obterEstado(33).regiao;                 // "Sudeste"   (33 = código do RJ)
buscarEstados("rio");                   // [Rio de Janeiro, Rio Grande do Norte, Rio Grande do Sul]
listarEstadosPorRegiao("Sul").map((e) => e.uf); // ["PR", "RS", "SC"]
ehUf("SP");                             // true
ehUf("xx");                             // false
```

## Capitais (síncrono)

As 27 capitais já vêm embutidas, então não precisam de `carregarMunicipios()`.

| Função | Retorno | O que faz |
| --- | --- | --- |
| `listarCapitais()` | `Municipio[]` | Lista as 27 capitais. |
| `obterCapital(uf)` | `Municipio` | Busca a capital de um estado pela sigla. Lança um erro se a UF for inválida. |

```ts
import { listarCapitais, obterCapital } from "municipios-brasil";

obterCapital("BA").nome;       // "Salvador"
listarCapitais().length;       // 27
```

## Carregando os municípios

| Função | Retorno | O que faz |
| --- | --- | --- |
| `carregarMunicipios()` | `Promise<ApiMunicipios>` | Baixa os municípios (uma vez, fica em cache) e devolve a API síncrona. |
| `criarApiMunicipios(municipios)` | `ApiMunicipios` | Monta a API a partir de uma lista já em memória (uso 100% síncrono — veja o subpath `/dados`). |

```ts
import { carregarMunicipios } from "municipios-brasil";

const municipios = await carregarMunicipios(); // depois disto, tudo é síncrono
```

## Municípios: consultas

Métodos de uma instância de `ApiMunicipios` (todos síncronos):

| Método | Retorno | O que faz |
| --- | --- | --- |
| `total` | `number` | Quantidade de municípios (5.571). |
| `listar()` | `Municipio[]` | Todos os municípios, em ordem alfabética. |
| `obter(codigoIbge)` | `Municipio` | Busca pelo código IBGE. Lança um erro se não existir. |
| `obterPorCodigoReceitaFederal(codigo)` | `Municipio` | Busca pelo código TOM/SIAFI da Receita Federal (aceita `"0643"` ou `643`). Lança um erro se não existir. |
| `porEstado(ufOuCodigo)` | `Municipio[]` | Municípios de um estado (pela sigla ou pelo `codigoUf`). |
| `porDdd(ddd)` | `Municipio[]` | Municípios de um DDD. Lança um erro se o DDD não for um inteiro de 11 a 99. |
| `porFuso(fuso)` | `Municipio[]` | Municípios de um fuso horário. Lança um erro se o fuso for inválido. |
| `obterEstadoDaCidade(codigoIbge)` | `Estado` | O estado a que o município pertence. |
| `ehCapital(codigoIbge)` | `boolean` | Diz se o município é capital (devolve `false` para código desconhecido, sem lançar). |

```ts
municipios.obter(3550308).nome;             // "São Paulo"
municipios.porEstado("SP").length;          // 645
municipios.porDdd(11).length;               // municípios do DDD 11
municipios.obterEstadoDaCidade(3304557).uf; // "RJ"  (3304557 = Rio de Janeiro)
municipios.ehCapital(3550308);              // true
```

## Municípios: busca / autocomplete

| Método | Retorno | O que faz |
| --- | --- | --- |
| `buscar(termo, opcoes?)` | `Municipio[]` | Busca por nome, ordenada por relevância e ignorando acentos. Capitais aparecem primeiro no empate. |

`opcoes`: `{ limite?: number; uf?: UF \| UF[]; somenteCapitais?: boolean }`.

Há **232 nomes de cidade que se repetem entre estados** (ex.: "Bom Jesus" em 5 estados). Por isso, passe `uf` para diferenciá-las:

```ts
municipios.buscar("são pau", { uf: "SP", limite: 5 });   // só cidades de SP que começam com "São Pau"
municipios.buscar("bom jesus");                          // aparece em várias UFs (use .uf de cada uma para diferenciar)
municipios.buscar("flori", { somenteCapitais: true });   // [Florianópolis]
municipios.buscar("rio", { uf: ["RJ", "RS"] });          // só cidades do RJ e do RS
```

## Municípios: geografia

| Método | Retorno | O que faz |
| --- | --- | --- |
| `proximas(origem, raioKm, opcoes?)` | `ResultadoProximidade[]` | Cidades dentro de `raioKm` da origem (um `codigoIbge` **ou** uma coordenada), da mais perto para a mais longe. Lança um erro se o raio não for maior que zero. |
| `maisProxima(coordenada, opcoes?)` | `ResultadoProximidade` | A cidade mais próxima de uma coordenada. |
| `distanciaEntre(origemIbge, destinoIbge)` | `number` | Distância em km entre dois municípios. |

`opcoes` de `proximas`: `{ limite?: number; incluirOrigem?: boolean; uf?: UF \| UF[] }` (por padrão a origem fica de fora). `ResultadoProximidade` é `{ cidade: Municipio; distanciaKm: number }`.

```ts
// vizinhos de São Paulo num raio de 50 km, do mais perto ao mais longe:
municipios.proximas(3550308, 50).slice(0, 3).map((r) => `${r.cidade.nome} (${r.distanciaKm} km)`);

// a partir de uma coordenada (ex.: GPS do usuário):
municipios.maisProxima({ latitude: -23.55, longitude: -46.63 }).cidade.nome; // "São Paulo"

municipios.distanciaEntre(3550308, 3304557); // ~358  (São Paulo ↔ Rio de Janeiro)
```

## Código da Receita Federal (TOM/SIAFI)

Cada município traz `codigoReceitaFederal`: o **código TOM** (*Tabela de Órgãos e Municípios*), idêntico ao código SIAFI, como **texto de 4 dígitos com zero à esquerda**. É o código que a Receita Federal usa — por exemplo, no campo `municipio` dos **dados abertos de CNPJ** (que **não** usam o código IBGE).

```ts
const m = await carregarMunicipios();
m.obter(3550308).codigoReceitaFederal;        // "7107"  (São Paulo)

// casa o código de um registro de CNPJ com o município (aceita "0643" ou 643):
m.obterPorCodigoReceitaFederal("0643").nome;  // "Acrelândia"
```

> Para **NF-e e SPED**, use o código IBGE (`codigoIbge`), não o TOM. Fontes oficiais: [Receita Federal — Órgãos e Municípios](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/orgaos-e-municipios) · [Tesouro / SIAFI](https://www.tesourotransparente.gov.br/ckan/dataset/lista-de-municipios-do-siafi).

## Geo, texto e formatação (síncrono, sem precisar dos dados)

| Função | Retorno | O que faz |
| --- | --- | --- |
| `distanciaKm(a, b)` | `number` | Distância em km entre duas coordenadas (Haversine). |
| `normalizarTexto(texto)` | `string` | Tira acentos, passa para minúsculas e arruma os espaços (ex.: `"São  Paulo"` → `"sao paulo"`). |
| `compararPtBr(a, b)` | `number` | Compara textos na ordem do português (use em `.sort()`). |
| `formatarCidadeUf(cidade, opcoes?)` | `string` | Formata como `"Cidade/UF"` (separador configurável). |

```ts
import { distanciaKm, formatarCidadeUf } from "municipios-brasil";

distanciaKm({ latitude: -23.55, longitude: -46.63 }, { latitude: -22.91, longitude: -43.2 }); // ~358
formatarCidadeUf(cidade);                       // "São Paulo/SP"
formatarCidadeUf(cidade, { separador: " - " }); // "São Paulo - SP"
```

## Tipos

```ts
interface Estado {
  codigoUf: number;     // código IBGE da UF (ex.: 35 = SP)
  uf: UF;               // sigla (ex.: "SP")
  nome: string;
  latitude: number;
  longitude: number;
  regiao: Regiao;
}

interface Municipio {
  codigoIbge: number;          // código IBGE de 7 dígitos (ex.: 3550308)
  nome: string;
  uf: UF;                      // sigla do estado (ex.: "SP")
  codigoUf: number;
  latitude: number;
  longitude: number;
  capital: boolean;
  ddd: number;
  fusoHorario: FusoHorario;    // ex.: "America/Sao_Paulo"
  codigoReceitaFederal: string; // código TOM/SIAFI, 4 dígitos (ex.: "7107")
}

interface Coordenada { latitude: number; longitude: number }
interface ResultadoProximidade { cidade: Municipio; distanciaKm: number }

type UF = "AC" | "AL" | /* … */ | "SP" | "TO";
type Regiao = "Centro-Oeste" | "Nordeste" | "Norte" | "Sudeste" | "Sul";
type FusoHorario = "America/Noronha" | "America/Porto_Velho" | "America/Rio_Branco" | "America/Sao_Paulo";
```

Constantes exportadas: `UFS`, `REGIOES`, `FUSOS_HORARIOS` e `CODIGO_UF_POR_SIGLA` (mapa sigla → `codigoUf`).

## Subpath `municipios-brasil/dados` — dados crus (síncrono)

Para scripts Node, SSR ou etapas de build que querem os arrays **sem** `await` (importar este caminho inclui o dataset de municípios no seu bundle, de propósito):

```ts
import { estados, capitais, municipios, meta } from "municipios-brasil/dados";
import { criarApiMunicipios } from "municipios-brasil";

const api = criarApiMunicipios(municipios); // a mesma ApiMunicipios, 100% síncrona
meta.dataCaptura;                            // quando os dados foram capturados da fonte
```

## Erros — o que aconteceu / por quê / como resolver

Todo erro é uma subclasse de `ErroMunicipiosBr` e traz: `codigo` (estável, para tratar no código), `oQue`, `motivo`, `solucao` e, quando dá, uma `sugestao` ("você quis dizer?"). A `message` junta tudo num texto pronto para mostrar.

```ts
import { obterEstado, ErroMunicipiosBr, UfInvalidaError } from "municipios-brasil";

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

| Erro | `codigo` | Quando acontece |
| --- | --- | --- |
| `UfInvalidaError` | `UF_INVALIDA` | Sigla de UF que não existe. |
| `EstadoNaoEncontradoError` | `ESTADO_NAO_ENCONTRADO` | `codigoUf` numérico inexistente. |
| `CidadeNaoEncontradaError` | `CIDADE_NAO_ENCONTRADA` | Código IBGE (ou da Receita Federal) sem município. |
| `RegiaoInvalidaError` | `REGIAO_INVALIDA` | Região que não existe. |
| `CoordenadaInvalidaError` | `COORDENADA_INVALIDA` | Latitude/longitude fora dos limites. |
| `RaioInvalidoError` | `RAIO_INVALIDO` | Raio ≤ 0 ou não numérico. |
| `DddInvalidoError` | `DDD_INVALIDO` | DDD fora de 11–99. |
| `FusoInvalidoError` | `FUSO_INVALIDO` | Fuso horário inválido. |

## Desempenho e bundle

- **Bundle inicial enxuto:** o ponto de entrada principal tem ~5 KB gzip; os municípios (~147 KB gzip) só são baixados quando você chama `carregarMunicipios()`, num arquivo separado e cacheável.
- **Busca rápida:** ao carregar, o pacote monta uma vez os índices (por código, UF, DDD, fuso e nomes já normalizados); cada busca depois é só uma passada em memória.
- **CJS:** funciona normalmente (no Node, `carregarMunicipios()` resolve via `import()` dinâmico). Só vale lembrar: o arquivo separado de municípios só vira um carregamento à parte em consumidores **ESM** (Vite/webpack modernos); num bundle CJS o dataset entra junto. É o comportamento esperado.

## Atualização dos dados (mantenedores)

Os arquivos `src/**/*.gerado.ts` são gerados — **não edite na mão**. Para atualizar a partir da fonte:

```bash
bun run dados:atualizar   # baixa, valida, transforma e regenera + mostra o que mudou
bun run build             # recompila JS (ESM+CJS) e os tipos
bun run verificar:build   # confere que os municípios saíram num arquivo separado
```

O código da Receita Federal (`codigoReceitaFederal`) é derivado automaticamente do código SIAFI da fonte a cada atualização — não precisa de download extra.

## Créditos

Dados de [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros) (base IBGE). A data de captura e as contagens ficam em `meta` (subpath `/dados`).

## Licença

[MIT](./LICENSE) © Gustavo Salomé (gusnips)
