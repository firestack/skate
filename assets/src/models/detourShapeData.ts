import { array, Infer, number, type } from "superstruct"
import { DetourShape } from "../detour"
import { latLonToCoordinate } from "../util/geographicCoordinate"

export const DetourShapeData = type({
  coordinates: array(
    type({
      lat: number(),
      lon: number(),
    })
  ),
})
export type DetourShapeData = Infer<typeof DetourShapeData>

export const detourShapeFromData = (
  shapeData: DetourShapeData
): DetourShape => ({
  ...shapeData,
  coordinates: shapeData.coordinates.map(latLonToCoordinate),
})
