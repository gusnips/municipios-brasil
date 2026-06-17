/**
 * Gate de verificação pós-build.
 *
 * Garante que o dataset pesado de municípios saiu em um CHUNK SEPARADO e que
 * o entry principal continua enxuto — ou seja, que o `import()` dinâmico não
 * foi inlinado. Se esta verificação falhar, o pacote NÃO deve ser publicado.
 *
 * Uso: `bun run verificar:build` (roda dentro do `prepublishOnly`).
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const DIST = resolve(import.meta.dir, "../dist");
const LIMITE_ENTRY_KB = 60; // entry principal deve ser logic-only (alguns KB)
const MINIMO_CHUNK_KB = 500; // o dataset de municípios é ~1 MB minificado

const problemas: string[] = [];
const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

function exigirArquivo(relativo: string): boolean {
  const existe = existsSync(resolve(DIST, relativo));
  if (!existe) problemas.push(`Arquivo ausente: dist/${relativo}`);
  return existe;
}

// 1) Arquivos esperados nos dois formatos + tipos dos dois subpaths.
for (const arquivo of [
  "index.mjs",
  "index.cjs",
  "index.d.ts",
  "dados/index.mjs",
  "dados/index.cjs",
  "dados/index.d.ts",
]) {
  exigirArquivo(arquivo);
}

// 2) O chunk dos municípios precisa existir separadamente, em ESM e CJS.
const dirChunks = resolve(DIST, "chunks");
const chunks = existsSync(dirChunks) ? readdirSync(dirChunks) : [];
const chunkMjs = chunks.find((c) => c.startsWith("municipios") && c.endsWith(".mjs"));
const chunkCjs = chunks.find((c) => c.startsWith("municipios") && c.endsWith(".cjs"));
if (!chunkMjs) problemas.push("Chunk ESM dos municípios não encontrado em dist/chunks (dados podem ter sido inlinados).");
if (!chunkCjs) problemas.push("Chunk CJS dos municípios não encontrado em dist/chunks.");

// 3) O entry principal NÃO pode conter o dataset (deve ser pequeno).
let tamanhoEntry = 0;
if (existsSync(resolve(DIST, "index.mjs"))) {
  tamanhoEntry = statSync(resolve(DIST, "index.mjs")).size;
  if (tamanhoEntry > LIMITE_ENTRY_KB * 1024) {
    problemas.push(
      `dist/index.mjs tem ${kb(tamanhoEntry)} (esperado < ${LIMITE_ENTRY_KB} KB). Os dados parecem ter sido inlinados no entry.`,
    );
  }
}

// 4) O chunk de municípios deve ser realmente grande (sanidade).
let tamanhoChunk = 0;
if (chunkMjs) {
  tamanhoChunk = statSync(resolve(dirChunks, chunkMjs)).size;
  if (tamanhoChunk < MINIMO_CHUNK_KB * 1024) {
    problemas.push(`Chunk de municípios tem ${kb(tamanhoChunk)} (esperado > ${MINIMO_CHUNK_KB} KB).`);
  }
}

if (problemas.length > 0) {
  console.error("❌ Verificação de build falhou:");
  for (const p of problemas) console.error(`   • ${p}`);
  process.exit(1);
}

console.log("✅ Build verificado:");
console.log(`   • entry principal enxuto: dist/index.mjs = ${kb(tamanhoEntry)}`);
console.log(`   • municípios em chunk separado: dist/chunks/${chunkMjs} = ${kb(tamanhoChunk)}`);
console.log(`   • tipos presentes para "." e "./dados"`);
