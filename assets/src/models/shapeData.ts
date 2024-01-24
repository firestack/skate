import { array, Infer, number, optional, string, type } from "superstruct"
import { Shape } from "../schedule"
import { StopData, stopsFromData } from "./stopData"
import { latLonToCoordinate } from "../util/geographicCoordinate"

export const ShapeData = type({
  id: string(),
  points: array(
    type({
      shape_id: string(),
      sequence: number(),
      lat: number(),
      lon: number(),
    })
  ),
  stops: optional(array(StopData)),
})
export type ShapeData = Infer<typeof ShapeData>

export const shapeFromData = (shapeData: ShapeData): Shape => ({
  id: shapeData.id,
  points: shapeData.points.map(latLonToCoordinate),
  stops: shapeData.stops ? stopsFromData(shapeData.stops) : undefined,
})

export const shapesFromData = (shapesData: ShapeData[]): Shape[] =>
  shapesData.map((shapeData) => shapeFromData(shapeData))
