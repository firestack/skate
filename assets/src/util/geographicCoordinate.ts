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

export const coordinateToLatLngLiteral = ({
  latitude,
  longitude,
}: GeographicCoordinate): LatLngLiteral => ({ lat: latitude, lng: longitude })

export const coordinate = (
  latitude: number,
  longitude: number
): GeographicCoordinate => ({ latitude, longitude })
