// ⚠️  Arquivo GERADO por scripts/atualizar-dados.ts — não edite à mão.

/** Siglas das 27 unidades federativas do Brasil. */
export type UF = "AC" | "AL" | "AM" | "AP" | "BA" | "CE" | "DF" | "ES" | "GO" | "MA" | "MG" | "MS" | "MT" | "PA" | "PB" | "PE" | "PI" | "PR" | "RJ" | "RN" | "RO" | "RR" | "RS" | "SC" | "SE" | "SP" | "TO";

/** Regiões do Brasil. */
export type Regiao = "Centro-Oeste" | "Nordeste" | "Norte" | "Sudeste" | "Sul";

/** Fusos horários (IANA) presentes nos municípios brasileiros. */
export type FusoHorario = "America/Noronha" | "America/Porto_Velho" | "America/Rio_Branco" | "America/Sao_Paulo";

/** Todas as UFs, em ordem alfabética. */
export const UFS: readonly UF[] = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

/** Todas as regiões, em ordem alfabética. */
export const REGIOES: readonly Regiao[] = ["Centro-Oeste","Nordeste","Norte","Sudeste","Sul"];

/** Todos os fusos horários, em ordem alfabética. */
export const FUSOS_HORARIOS: readonly FusoHorario[] = ["America/Noronha","America/Porto_Velho","America/Rio_Branco","America/Sao_Paulo"];

/** Mapa sigla da UF -> código numérico do IBGE (codigoUf). */
export const CODIGO_UF_POR_SIGLA: Readonly<Record<UF, number>> = {RO:11,AC:12,AM:13,RR:14,PA:15,AP:16,TO:17,MA:21,PI:22,CE:23,RN:24,PB:25,PE:26,AL:27,SE:28,BA:29,MG:31,ES:32,RJ:33,SP:35,PR:41,SC:42,RS:43,MS:50,MT:51,GO:52,DF:53};
