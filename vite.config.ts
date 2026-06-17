import { defineConfig } from "vite";
import { resolve } from "path";

// Build em dois passos: `BUILD_FORMAT=es` e depois `BUILD_FORMAT=cjs`.
// Um formato por invocação mantém o code-splitting (e a fronteira do
// import() dinâmico dos municípios) independente e previsível por formato.
// As declarações de tipo são geradas à parte (tsc + rollup-plugin-dts),
// para que cada entry tenha um .d.ts autocontido que casa com o JS empacotado.
const formato = (process.env.BUILD_FORMAT as "es" | "cjs") ?? "es";
const ehEs = formato === "es";
const ext = ehEs ? "mjs" : "cjs";

export default defineConfig({
  build: {
    // Só esvazia o dist no passo ES; o passo CJS apenas adiciona os .cjs.
    emptyOutDir: ehEs,
    target: "es2022",
    sourcemap: false,
    minify: false,
    lib: {
      // Forma de objeto-mapa (NÃO o atalho de string): com >1 entrada o Vite
      // nunca força inlineDynamicImports, então o chunk de municípios é preservado.
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "dados/index": resolve(__dirname, "src/dados/index.ts"),
      },
      formats: [formato],
    },
    rollupOptions: {
      treeshake: { moduleSideEffects: false },
      output: {
        entryFileNames: `[name].${ext}`,
        chunkFileNames: `chunks/[name]-[hash].${ext}`,
        assetFileNames: "[name].[ext]",
        exports: "named",
        // Flags que sustentam o code-split do dataset pesado:
        inlineDynamicImports: false,
        dynamicImportInCjs: true,
        // Fixa um nome estável/cacheável para o chunk dos municípios.
        manualChunks(id: string) {
          if (id.includes("/dados/municipios")) return "municipios";
          return undefined;
        },
      },
    },
  },
});
