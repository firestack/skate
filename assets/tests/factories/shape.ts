import { Factory } from "fishery"
import { Shape } from "../../src/schedule"
import stopFactory from "./stop"

const shapeFactory = Factory.define<Shape>(({ sequence }) => ({
  id: `shape${sequence}`,
  points: [{ latitude: 0, longitude: 0 }],
  stops: [stopFactory.build({ id: `stop${sequence}` })],
}))

export default shapeFactory
