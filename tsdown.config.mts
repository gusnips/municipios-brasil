import { defineConfig, type UserConfig } from "tsdown";

// O Vite escreve o JavaScript (veja vite.config.ts). O tsdown escreve só as declarações, uma por
// entry e autocontida (sem imports relativos internos), para que o .d.ts case com o JS empacotado
// em todos os modos (bundler, node16 ESM e CJS). Um build por entry mantém cada .d.ts independente.
function tipos(entry: Record<string, string>): UserConfig {
  return {
    entry,
    format: "esm",
    outDir: "dist",
    // O dist já tem o JS do Vite: não limpar.
    clean: false,
    sourcemap: false,
    dts: { dtsOnly: true, sourcemap: false },
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  };
}

export default defineConfig([
  tipos({ index: "src/index.ts" }),
  tipos({ "dados/index": "src/dados/index.ts" }),
]);
