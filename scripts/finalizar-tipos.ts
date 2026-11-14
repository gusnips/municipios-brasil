/**
 * Finaliza a geração de tipos após o `tsdown`: cria a variante CommonJS
 * (`.d.cts`) de cada entry, copiando o `.d.ts` autocontido (evita o aviso
 * "masquerading as ESM" no consumidor CJS).
 *
 * Uso: roda automaticamente no `build` (passo `build:tipos`).
 */
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DIST = resolve(import.meta.dir, "../dist");

const entries: Array<[string, string]> = [
  ["index.d.ts", "index.d.cts"],
  ["dados/index.d.ts", "dados/index.d.cts"],
];

for (const [esm, cjs] of entries) {
  const origem = resolve(DIST, esm);
  if (!existsSync(origem)) {
    console.error(`❌ Não encontrei dist/${esm}. O passo de tipos (tsdown) falhou?`);
    process.exit(1);
  }
  copyFileSync(origem, resolve(DIST, cjs));
  console.log(`   tipos CJS: dist/${cjs}`);
}
