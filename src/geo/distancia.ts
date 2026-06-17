import type { Coordenada } from "../tipos/tipos";
import { CoordenadaInvalidaError } from "../erros/erros";

const RAIO_TERRA_KM = 6371;

function emRadianos(graus: number): number {
  return (graus * Math.PI) / 180;
}

/**
 * Valida um par de coordenadas, lançando {@link CoordenadaInvalidaError}
 * com uma mensagem explicativa quando estiver fora dos limites.
 */
export function validarCoordenada(coordenada: Coordenada): void {
  const { latitude, longitude } = coordenada;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new CoordenadaInvalidaError(
      `latitude (${latitude}) e longitude (${longitude}) precisam ser números finitos.`,
    );
  }
  if (latitude < -90 || latitude > 90) {
    throw new CoordenadaInvalidaError(`a latitude ${latitude} está fora do intervalo [-90, 90].`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new CoordenadaInvalidaError(`a longitude ${longitude} está fora do intervalo [-180, 180].`);
  }
}

/**
 * Distância em km pela fórmula de Haversine, **sem validação** das entradas.
 * Uso interno sobre dados confiáveis. Arredonda a 3 casas decimais.
 */
export function haversineKm(a: Coordenada, b: Coordenada): number {
  const dLat = emRadianos(b.latitude - a.latitude);
  const dLon = emRadianos(b.longitude - a.longitude);
  const lat1 = emRadianos(a.latitude);
  const lat2 = emRadianos(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const km = 2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.round(km * 1000) / 1000;
}

/**
 * Distância em quilômetros entre duas coordenadas, pela fórmula de Haversine.
 * Valida as entradas e arredonda a 3 casas decimais.
 *
 * @example
 * // distância aproximada entre as capitais SP e RJ
 * distanciaKm({ latitude: -23.55, longitude: -46.63 }, { latitude: -22.91, longitude: -43.2 }) // ~360.6
 */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  validarCoordenada(a);
  validarCoordenada(b);
  return haversineKm(a, b);
}
