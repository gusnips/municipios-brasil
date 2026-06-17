import { dts } from "rollup-plugin-dts";

// Agrupa as declarações por-arquivo (emitidas por `tsc` em dist/_tipos) em um
// único .d.ts autocontido por entry — sem imports relativos internos. Assim o
// .d.ts casa com o JS empacotado e resolve corretamente em todos os modos
// (bundler, node16 ESM e CJS).
const entradas = [
  { entrada: "dist/_tipos/index.d.ts", saida: "dist/index.d.ts" },
  { entrada: "dist/_tipos/dados/index.d.ts", saida: "dist/dados/index.d.ts" },
];

export default entradas.map(({ entrada, saida }) => ({
  input: entrada,
  output: { file: saida, format: "es" },
  plugins: [dts({ respectExternal: true })],
}));
