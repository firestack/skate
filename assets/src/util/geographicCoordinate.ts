
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
