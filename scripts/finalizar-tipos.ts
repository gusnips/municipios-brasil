/**
 * Finaliza a geração de tipos após o `rollup-plugin-dts`:
 *  1. cria a variante CommonJS (`.d.cts`) de cada entry, copiando o `.d.ts`
 *     autocontido (evita o aviso "masquerading as ESM" no consumidor CJS);
 *  2. remove o diretório temporário de declarações por-arquivo (dist/_tipos).
 *
 * Uso: roda automaticamente no `build` (passo `build:tipos`).
 */
import { copyFileSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const DIST = resolve(import.meta.dir, "../dist");

const entries: Array<[string, string]> = [
  ["index.d.ts", "index.d.cts"],
  ["dados/index.d.ts", "dados/index.d.cts"],
];

for (const [esm, cjs] of entries) {
  const origem = resolve(DIST, esm);
  if (!existsSync(origem)) {
    console.error(`❌ Não encontrei dist/${esm}. O passo de tipos (tsc + rollup) falhou?`);
    process.exit(1);
  }
  copyFileSync(origem, resolve(DIST, cjs));
  console.log(`   tipos CJS: dist/${cjs}`);
}

rmSync(resolve(DIST, "_tipos"), { recursive: true, force: true });
console.log("   limpeza: dist/_tipos removido");
