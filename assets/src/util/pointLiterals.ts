import { LatLngLiteral } from "leaflet"
import { ShapePoint } from "../schedule"

export const latLngLiteralToShapePoint = ({
  lat: latitude,
  lng: longitude,
}: LatLngLiteral): ShapePoint => ({ latitude, longitude })

export const shapePointToLatLngLiteral = ({
  latitude: lat,
  longitude: lng,
}: ShapePoint): LatLngLiteral => ({ lat, lng })
