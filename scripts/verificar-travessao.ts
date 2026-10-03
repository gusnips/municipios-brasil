// Verifica documentos públicos, JSDoc publicado e texto decodificado do código.
// Comentários internos, expressões regulares e arquivos gerados não são texto para o usuário.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const TRAVESSAO = /—|\\u2014|\\u\{2014\}|&mdash;|&#(?:0*8212|x0*2014);/i;
const arquivos = ["README.md", "CHANGELOG.md", "package.json"];
const problemas = new Set<string>();

function verificarLinhas(
  arquivo: string,
  texto: string,
  primeiraLinha = 0,
): void {
  texto.split("\n").forEach((linha, i) => {
    if (TRAVESSAO.test(linha))
      problemas.add(`${arquivo}:${primeiraLinha + i + 1}: ${linha.trim()}`);
  });
}

function comentariosJSDoc(codigo: ts.SourceFile): Map<string, ts.CommentRange> {
  const comentarios = new Map<string, ts.CommentRange>();
  function visitar(no: ts.Node): void {
    // O rollup descarta a documentação de imports e reexports ao juntar as declarações.
    if (ts.isImportDeclaration(no) || ts.isExportDeclaration(no)) return;
    if (
      no.kind !== ts.SyntaxKind.SourceFile &&
      no.kind !== ts.SyntaxKind.SyntaxList
    ) {
      for (const intervalo of ts.getLeadingCommentRanges(codigo.text, no.pos) ??
        []) {
        const comentario = codigo.text.slice(intervalo.pos, intervalo.end);
        if (comentario.startsWith("/**")) {
          comentarios.set(
            comentario
              .replace(/^\s*\* ?/gm, "")
              .replace(/\s+/g, " ")
              .trim(),
            intervalo,
          );
        }
      }
    }
    for (const filho of no.getChildren(codigo)) visitar(filho);
  }
  visitar(codigo);
  return comentarios;
}

function textoIsento(no: ts.Node, codigo: ts.SourceFile): boolean {
  // Reutiliza as exceções explícitas do ESLint para dados e marcadores de arquivos gerados.
  for (let atual = no; !ts.isSourceFile(atual); atual = atual.parent) {
    if (
      (ts.getLeadingCommentRanges(codigo.text, atual.pos) ?? []).some(
        (intervalo) =>
          /eslint-disable-next-line\s+no-restricted-syntax\b/.test(
            codigo.text.slice(intervalo.pos, intervalo.end),
          ),
      )
    )
      return true;
  }
  return false;
}

function verificarCodigo(arquivo: string): void {
  const texto = readFileSync(arquivo, "utf8");
  const codigo = ts.createSourceFile(
    arquivo,
    texto,
    ts.ScriptTarget.Latest,
    true,
  );
  // A emissão por sintaxe remove os corpos das funções e o JSDoc interno.
  const declaracao = ts.createSourceFile(
    arquivo,
    ts.transpileDeclaration(texto, { fileName: arquivo }).outputText,
    ts.ScriptTarget.Latest,
    true,
  );
  const comentarios = comentariosJSDoc(codigo);
  for (const comentario of comentariosJSDoc(declaracao).keys()) {
    const intervalo = comentarios.get(comentario);
    if (intervalo) {
      verificarLinhas(
        arquivo,
        texto.slice(intervalo.pos, intervalo.end),
        codigo.getLineAndCharacterOfPosition(intervalo.pos).line,
      );
    }
  }
  function visitar(no: ts.Node): void {
    if (ts.isJSDoc(no)) return;
    if (
      (ts.isStringLiteralLike(no) ||
        ts.isTemplateLiteralToken(no) ||
        ts.isJsxText(no)) &&
      !textoIsento(no, codigo)
    ) {
      verificarLinhas(
        arquivo,
        no.text,
        codigo.getLineAndCharacterOfPosition(no.getStart(codigo)).line,
      );
    }
    for (const filho of no.getChildren(codigo)) visitar(filho);
  }
  visitar(codigo);
}

for (const arquivo of arquivos)
  verificarLinhas(arquivo, readFileSync(arquivo, "utf8"));
for (const arquivo of readdirSync("src", {
  recursive: true,
  encoding: "utf8",
})) {
  if (
    /\.(?:test|spec|d|gerado)\.tsx?$/.test(arquivo) ||
    !/\.tsx?$/.test(arquivo)
  )
    continue;
  verificarCodigo(join("src", arquivo));
}

if (problemas.size > 0) {
  console.error(
    `Travessão em ${problemas.size} linha(s) de texto para o usuário. Use ponto, vírgula, dois-pontos ou parênteses:\n` +
      [...problemas].join("\n"),
  );
  process.exit(1);
}
console.log("sem travessão em texto público ou JSDoc publicado");
