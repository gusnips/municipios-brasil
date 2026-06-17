// ⚠️  Arquivo GERADO por scripts/atualizar-dados.ts — não edite à mão.

export interface MetaDados {
  /** URLs de origem dos dados. */
  fonte: { estados: string; municipios: string };
  /** Data/hora ISO da captura. */
  dataCaptura: string;
  /** Quantidade de registros por categoria. */
  contagens: { estados: number; municipios: number; capitais: number };
}

export const meta: MetaDados = {
  fonte: {
    estados: "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/refs/heads/main/json/estados.json",
    municipios: "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/refs/heads/main/json/municipios.json",
  },
  dataCaptura: "2026-06-17T13:45:44.982Z",
  contagens: { estados: 27, municipios: 5571, capitais: 27 },
};
