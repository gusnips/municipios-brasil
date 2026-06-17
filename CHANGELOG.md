# Changelog

Todas as mudanças relevantes deste pacote são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue o [SemVer](https://semver.org/lang/pt-BR/).

## [0.1.0] - 2026-06-17

### Adicionado

- **Estados (síncrono):** `listarEstados`, `obterEstado` (por sigla ou código),
  `buscarEstados` (autocomplete acento-insensível), `listarRegioes`,
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
