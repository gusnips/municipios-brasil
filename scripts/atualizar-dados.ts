/**
 * Atualiza os dados de estados e municípios a partir do repositório
 * kelvins/municipios-brasileiros e regenera os arquivos `*.gerado.ts`.
 *
 * Uso: `bun run dados:atualizar`
 *
 * Gera:
 *  - src/tipos/gerados.ts        (uniões UF | Regiao | FusoHorario + constantes)
 *  - src/dados/estados.gerado.ts (27 estados, inline/síncrono)
 *  - src/dados/capitais.gerado.ts(27 capitais, inline/síncrono)
 *  - src/dados/municipios.gerado.ts (todos os municípios, via JSON.parse)
 *  - src/dados/meta.gerado.ts    (proveniência: fonte, data, contagens)
 */
import { resolve } from "path";

const URL_ESTADOS =
  "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/refs/heads/main/json/estados.json";
const URL_MUNICIPIOS =
  "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/refs/heads/main/json/municipios.json";

const RAIZ = resolve(import.meta.dir, "..");
const DIR_DADOS = resolve(RAIZ, "src/dados");
const DIR_TIPOS = resolve(RAIZ, "src/tipos");

const AVISO = "// ⚠️  Arquivo GERADO por scripts/atualizar-dados.ts — não edite à mão.\n";

interface EstadoFonte {
  codigo_uf: number;
  uf: string;
  nome: string;
  latitude: number;
  longitude: number;
  regiao: string;
}

interface MunicipioFonte {
  codigo_ibge: number;
  nome: string;
  latitude: number;
  longitude: number;
  capital: number;
  codigo_uf: number;
  siafi_id: number;
  ddd: number;
  fuso_horario: string;
}

async function baixarJson<T>(url: string, oQue: string): Promise<T[]> {
  let resposta: Response;
  try {
    resposta = await fetch(url);
  } catch (causa) {
    throw new Error(
      `Falha ao baixar ${oQue}.\n` +
        `• Motivo: a requisição de rede para ${url} falhou (${String(causa)}).\n` +
        `• Como resolver: verifique sua conexão e se a URL ainda existe no repositório de origem.`,
    );
  }
  if (!resposta.ok) {
    throw new Error(
      `Falha ao baixar ${oQue}.\n` +
        `• Motivo: o servidor respondeu ${resposta.status} ${resposta.statusText} para ${url}.\n` +
        `• Como resolver: confirme a URL no repositório kelvins/municipios-brasileiros (a branch/arquivo podem ter mudado).`,
    );
  }
  const dados = (await resposta.json()) as T[];
  if (!Array.isArray(dados) || dados.length === 0) {
    throw new Error(
      `Dados inválidos para ${oQue}.\n` +
        `• Motivo: o JSON baixado não é um array com itens.\n` +
        `• Como resolver: a estrutura da fonte pode ter mudado; ajuste o parser em scripts/atualizar-dados.ts.`,
    );
  }
  return dados;
}

function validarCampos(item: object, campos: string[], oQue: string): void {
  for (const campo of campos) {
    if (!(campo in item)) {
      throw new Error(
        `Campo ausente em ${oQue}.\n` +
          `• Motivo: o campo "${campo}" não existe no primeiro registro recebido.\n` +
          `• Como resolver: a estrutura da fonte mudou; atualize as interfaces *Fonte em scripts/atualizar-dados.ts.`,
      );
    }
  }
}

/** Serializa um valor como código TS legível (chaves sem aspas quando possível). */
function comoLiteral(valor: unknown): string {
  return JSON.stringify(valor).replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, "$1:");
}

function unicosOrdenados(valores: string[]): string[] {
  return [...new Set(valores)].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

async function principal(): Promise<void> {
  console.log("⬇️  Baixando estados e municípios da fonte...");
  const [estadosFonte, municipiosFonte] = await Promise.all([
    baixarJson<EstadoFonte>(URL_ESTADOS, "estados"),
    baixarJson<MunicipioFonte>(URL_MUNICIPIOS, "municípios"),
  ]);

  validarCampos(estadosFonte[0]!, ["codigo_uf", "uf", "nome", "latitude", "longitude", "regiao"], "estados");
  validarCampos(
    municipiosFonte[0]!,
    ["codigo_ibge", "nome", "latitude", "longitude", "capital", "codigo_uf", "ddd", "fuso_horario", "siafi_id"],
    "municípios",
  );

  // Mapa codigo_uf -> sigla, usado para derivar `uf` em cada município.
  const ufPorCodigo = new Map<number, string>();
  for (const e of estadosFonte) ufPorCodigo.set(e.codigo_uf, e.uf);

  // --- Transformações (snake_case -> camelCase, capital 0/1 -> boolean) ---
  const estados = [...estadosFonte]
    .sort((a, b) => a.codigo_uf - b.codigo_uf)
    .map((e) => ({
      codigoUf: e.codigo_uf,
      uf: e.uf,
      nome: e.nome,
      latitude: e.latitude,
      longitude: e.longitude,
      regiao: e.regiao,
    }));

  const municipios = [...municipiosFonte]
    .map((m) => {
      const uf = ufPorCodigo.get(m.codigo_uf);
      if (!uf) {
        throw new Error(
          `Município sem estado correspondente.\n` +
            `• Motivo: o município "${m.nome}" (codigo_ibge ${m.codigo_ibge}) tem codigo_uf ${m.codigo_uf}, que não existe na lista de estados.\n` +
            `• Como resolver: os dois arquivos da fonte podem estar dessincronizados; rode novamente ou reporte no repositório de origem.`,
        );
      }
      return {
        codigoIbge: m.codigo_ibge,
        nome: m.nome,
        uf,
        codigoUf: m.codigo_uf,
        latitude: m.latitude,
        longitude: m.longitude,
        capital: m.capital === 1,
        ddd: m.ddd,
        fusoHorario: m.fuso_horario,
        // Código TOM/SIAFI = código da Receita Federal, 4 dígitos com zero à esquerda.
        codigoReceitaFederal: String(m.siafi_id).padStart(4, "0"),
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.uf.localeCompare(b.uf, "pt-BR"));

  const capitais = municipios
    .filter((m) => m.capital)
    .sort((a, b) => a.uf.localeCompare(b.uf, "pt-BR"));

  // --- Conjuntos para os tipos literais ---
  const ufs = unicosOrdenados(estados.map((e) => e.uf));
  const regioes = unicosOrdenados(estados.map((e) => e.regiao));
  const fusos = unicosOrdenados(municipios.map((m) => m.fusoHorario));
  const codigoUfPorSigla = Object.fromEntries(estados.map((e) => [e.uf, e.codigoUf]));

  // --- Diff vs. execução anterior ---
  const caminhoMeta = resolve(DIR_DADOS, "meta.gerado.ts");
  let anterior: { estados: number; municipios: number; capitais: number } | undefined;
  try {
    const modulo = (await import(caminhoMeta)) as { meta?: { contagens?: typeof anterior } };
    anterior = modulo.meta?.contagens;
  } catch {
    anterior = undefined;
  }

  // --- Geração dos arquivos ---
  const uniao = (valores: string[]): string => valores.map((v) => `"${v}"`).join(" | ");

  const tiposGerados =
    AVISO +
    `\n/** Siglas das 27 unidades federativas do Brasil. */\n` +
    `export type UF = ${uniao(ufs)};\n\n` +
    `/** Regiões do Brasil. */\n` +
    `export type Regiao = ${uniao(regioes)};\n\n` +
    `/** Fusos horários (IANA) presentes nos municípios brasileiros. */\n` +
    `export type FusoHorario = ${uniao(fusos)};\n\n` +
    `/** Todas as UFs, em ordem alfabética. */\n` +
    `export const UFS: readonly UF[] = ${comoLiteral(ufs)};\n\n` +
    `/** Todas as regiões, em ordem alfabética. */\n` +
    `export const REGIOES: readonly Regiao[] = ${comoLiteral(regioes)};\n\n` +
    `/** Todos os fusos horários, em ordem alfabética. */\n` +
    `export const FUSOS_HORARIOS: readonly FusoHorario[] = ${comoLiteral(fusos)};\n\n` +
    `/** Mapa sigla da UF -> código numérico do IBGE (codigoUf). */\n` +
    `export const CODIGO_UF_POR_SIGLA: Readonly<Record<UF, number>> = ${comoLiteral(codigoUfPorSigla)};\n`;

  const estadosGerado =
    AVISO +
    `import type { Estado } from "../tipos/tipos";\n\n` +
    `export const estados: Estado[] = [\n` +
    estados.map((e) => `  ${comoLiteral(e)},`).join("\n") +
    `\n];\n`;

  const capitaisGerado =
    AVISO +
    `import type { Municipio } from "../tipos/tipos";\n\n` +
    `export const capitais: Municipio[] = [\n` +
    capitais.map((c) => `  ${comoLiteral(c)},`).join("\n") +
    `\n];\n`;

  // Municípios: array grande embutido como string + JSON.parse (parse ~1.7x
  // mais rápido no V8 que um literal de array e amigável a bundlers/minificadores).
  const municipiosJson = JSON.stringify(municipios);
  const municipiosGerado =
    AVISO +
    `import type { Municipio } from "../tipos/tipos";\n\n` +
    `/* eslint-disable */\n` +
    `export const municipios: Municipio[] = JSON.parse(\n  ${JSON.stringify(municipiosJson)},\n) as Municipio[];\n`;

  const metaGerado =
    AVISO +
    `\nexport interface MetaDados {\n` +
    `  /** URLs de origem dos dados. */\n` +
    `  fonte: { estados: string; municipios: string };\n` +
    `  /** Data/hora ISO da captura. */\n` +
    `  dataCaptura: string;\n` +
    `  /** Quantidade de registros por categoria. */\n` +
    `  contagens: { estados: number; municipios: number; capitais: number };\n` +
    `}\n\n` +
    `export const meta: MetaDados = {\n` +
    `  fonte: {\n    estados: ${JSON.stringify(URL_ESTADOS)},\n    municipios: ${JSON.stringify(URL_MUNICIPIOS)},\n  },\n` +
    `  dataCaptura: ${JSON.stringify(new Date().toISOString())},\n` +
    `  contagens: { estados: ${estados.length}, municipios: ${municipios.length}, capitais: ${capitais.length} },\n` +
    `};\n`;

  await Promise.all([
    Bun.write(resolve(DIR_TIPOS, "gerados.ts"), tiposGerados),
    Bun.write(resolve(DIR_DADOS, "estados.gerado.ts"), estadosGerado),
    Bun.write(resolve(DIR_DADOS, "capitais.gerado.ts"), capitaisGerado),
    Bun.write(resolve(DIR_DADOS, "municipios.gerado.ts"), municipiosGerado),
    Bun.write(caminhoMeta, metaGerado),
  ]);

  // --- Relatório ---
  const tamanhoChunk = (municipiosJson.length / 1024).toFixed(0);
  console.log("\n✅ Dados atualizados:");
  console.log(`   estados:    ${estados.length}${delta(anterior?.estados, estados.length)}`);
  console.log(`   municípios: ${municipios.length}${delta(anterior?.municipios, municipios.length)}`);
  console.log(`   capitais:   ${capitais.length}${delta(anterior?.capitais, capitais.length)}`);
  console.log(`   UFs: ${ufs.length} · regiões: ${regioes.length} · fusos: ${fusos.length}`);
  console.log(`   tamanho do dataset de municípios: ~${tamanhoChunk} KB (JSON minificado)`);
  if (!anterior) console.log("   (primeira geração — sem diff anterior para comparar)");
}

function delta(antes: number | undefined, agora: number): string {
  if (antes === undefined || antes === agora) return "";
  const d = agora - antes;
  return ` (${d > 0 ? "+" : ""}${d})`;
}

await principal();
