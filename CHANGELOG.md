# Changelog

Todas as mudanças relevantes deste pacote são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue o [SemVer](https://semver.org/lang/pt-BR/).

## [0.2.0] - 2026-09-18

### Mudado

- **`listarEstados()` agora devolve os estados em ordem alfabética de nome**
  (Acre, Alagoas, Amapá, Amazonas…). Antes vinha na ordem da tabela do IBGE, que
  agrupa por região (RO, AC, AM, RR…) e lê como aleatória num seletor. Quem
  quiser a ordem antiga pede: `listarEstados({ ordem: "ibge" })`.
- **`listarEstadosPorRegiao(regiao)`** passa a ordenar por nome também — é o que
  a documentação já prometia (`"Sul"` → Paraná, Rio Grande do Sul, Santa
  Catarina) e não era o que o código fazia.
- **`listarCapitais()`** passa a vir em ordem de nome da cidade (Aracaju,
  Belém, Belo Horizonte…). Antes vinha na ordem da sigla da UF.

### Adicionado

- Opção `ordem` em `listarEstados` e `listarEstadosPorRegiao`: `"nome"`
  (padrão), `"sigla"` ou `"ibge"`. Tipos `OpcoesListaEstados` e `OrdemEstados`.
- **O subpath `/dados` passa a exportar a API síncrona inteira** — tudo o que a
  raiz exporta menos `carregarMunicipios`, a única função com `import()`
  dinâmico. É o que faltava para usar o pacote em **React Native**: o Metro não
  resolve o chunk dinâmico da raiz, então um app RN importava os arrays crus e
  reescrevia busca, normalização e ordenação à mão. Agora:
  `import { criarApiMunicipios, municipios } from "municipios-brasil/dados"`.

## [0.1.0] - 2026-06-17

### Adicionado

- **Estados (síncrono):** `listarEstados`, `obterEstado` (por sigla ou código),
  `buscarEstados` (autocomplete que ignora acentos), `listarRegioes`,
  `listarEstadosPorRegiao`.
- **Capitais (síncrono):** `listarCapitais`, `obterCapital`.
- **Municípios sob demanda:** `carregarMunicipios()` (com `import()` dinâmico e
  memoização) devolvendo a API síncrona `ApiMunicipios` — `listar`, `obter`,
  `obterPorCodigoReceitaFederal`, `buscar`, `porEstado`, `porDdd`, `porFuso`,
  `obterEstadoDaCidade`, `ehCapital`, `proximas`, `maisProxima`, `distanciaEntre`.
- **Código da Receita Federal:** cada `Municipio` traz `codigoReceitaFederal` — o
  código TOM/SIAFI (string de 4 dígitos com zero à esquerda, ex.: `"7107"`), usado
  nos dados abertos de CNPJ. Inclui lookup reverso `obterPorCodigoReceitaFederal`.
- **Geo, texto e formatação:** `distanciaKm` (Haversine), `normalizarTexto`,
  `compararPtBr`, `formatarCidadeUf`.
- **Tipos e constantes:** `UF`, `Regiao`, `FusoHorario`, `Estado`, `Municipio`,
  `Coordenada`, `UFS`, `REGIOES`, `FUSOS_HORARIOS`, `CODIGO_UF_POR_SIGLA`.
- **Erros explicativos:** `ErroMunicipiosBr` e subclasses, com `codigo`, motivo,
  solução e sugestão ("você quis dizer?").
- **Subpath `/dados`:** acesso síncrono aos arrays crus (`estados`, `capitais`,
  `municipios`, `meta`) + `criarApiMunicipios` para uso 100% síncrono.
- **Distribuição dual ESM + CJS**, com tipos válidos em todos os modos de
  resolução (node10, node16 CJS/ESM e bundler).
- **Script de manutenção** `dados:atualizar` para baixar/atualizar os dados do
  IBGE (fonte: kelvins/municipios-brasileiros) e regenerar os arquivos.
