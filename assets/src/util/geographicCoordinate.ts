import { LatLngLiteral } from "leaflet"

/**
 * Skate's base type for representing latitude and longitude
 */
export interface GeographicCoordinate {
  latitude: number
  longitude: number
}

export interface Bearing {
  bearing: number
}

export type GeographicCoordinateBearing = GeographicCoordinate &
  Partial<Bearing>

export const latLngToCoordinate = ({
  lat: latitude,
  lng: longitude,
}: {
  lat: number
  lng: number
}): GeographicCoordinate => ({ latitude, longitude })

export const latLonToCoordinate = ({
  lat: latitude,
  lon: longitude,
}: {
  lat: number
  lon: number
}): GeographicCoordinate => ({ latitude, longitude })

export const coordinateToLatLngLiteral = ({
  latitude,
  longitude,
}: GeographicCoordinate): LatLngLiteral => ({ lat: latitude, lng: longitude })

export const coordinate = (
  latitude: number,
  longitude: number
): GeographicCoordinate => ({ latitude, longitude })
