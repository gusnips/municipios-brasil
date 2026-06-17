import type { Municipio } from "./tipos/tipos";

/**
 * Formata um município como `"Cidade/UF"` (padrão) ou com um separador custom.
 *
 * @example
 * formatarCidadeUf(saoPaulo)                       // "São Paulo/SP"
 * formatarCidadeUf(saoPaulo, { separador: " - " }) // "São Paulo - SP"
 */
export function formatarCidadeUf(cidade: Municipio, opcoes: { separador?: string } = {}): string {
  const separador = opcoes.separador ?? "/";
  return `${cidade.nome}${separador}${cidade.uf}`;
}
