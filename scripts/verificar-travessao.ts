// Sem travessão no texto que o consumidor lê. O ESLint cobre toda string em src/
// (eslint.config.mjs, SEM_TRAVESSAO); aqui ficam o que ele não analisa: README, CHANGELOG
// e package.json (a descrição aparece no npm). O travessão entrega texto escrito por IA.

import { readFileSync } from "node:fs";

const TRAVESSAO = /—|\\u2014|\\u\{2014\}|&mdash;|&#(?:0*8212|x0*2014);/i;
const arquivos = ["README.md", "CHANGELOG.md", "package.json"];

const problemas = arquivos.flatMap((arquivo) =>
  readFileSync(arquivo, "utf8")
    .split("\n")
    .flatMap((linha, i) =>
      TRAVESSAO.test(linha) ? [`${arquivo}:${i + 1}: ${linha.trim()}`] : [],
    ),
);

if (problemas.length > 0) {
  console.error(
    `Travessão em ${problemas.length} linha(s) de texto para o usuário. Use ponto, vírgula, dois-pontos ou parênteses:\n` +
      problemas.join("\n"),
  );
  process.exit(1);
}
console.log(
  `sem travessão em ${arquivos.length} arquivos de texto para o usuário`,
);
