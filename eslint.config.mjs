import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

// Sem travessão ("\u2014") no texto que o leitor vê: mensagens de erro e qualquer string
// em src/. Comentários internos ficam livres. scripts/verificar-travessao.ts cobre README,
// CHANGELOG, a descrição do pacote, JSDoc publicado e entidades HTML no texto do código.
// O escape unicode evita o caractere neste arquivo.
const SEM_TRAVESSAO = [
  "Literal[value=/\\u2014/]",
  "TemplateElement[value.cooked=/\\u2014/]",
].map((selector) => ({
  selector,
  message:
    "Sem travessão em texto para o usuário. Use ponto, vírgula, dois-pontos ou parênteses.",
}));

export default [
  {
    // Arquivos gerados pelo script de dados não são lintados (são enormes e
    // a tipagem deles é responsabilidade do gerador, não do lint).
    ignores: ["dist/**", "node_modules/**", "**/*.gerado.ts"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      // O TypeScript já checa referências indefinidas; no-undef gera falsos
      // positivos com globais de ambiente (recomendação do typescript-eslint).
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      // Tipos de retorno são garantidos pela interface ApiMunicipios e pelo
      // strict mode; anotações explícitas seriam apenas ruído nos métodos.
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "prefer-const": "error",
      "no-var": "error",
      "no-restricted-syntax": ["error", ...SEM_TRAVESSAO],
    },
  },
  {
    files: [
      "scripts/**/*.ts",
      "tests/**/*.ts",
      "vite.config.ts",
      "eslint.config.mjs",
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        __dirname: "readonly",
        process: "readonly",
        global: "readonly",
        Buffer: "readonly",
        console: "readonly",
        fetch: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      "no-undef": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
];
