import { Factory } from "fishery"
import { LocationType } from "../../src/models/stopData"
import { Stop } from "../../src/schedule"
import { localGeoCoordinateFactory } from "./geoCoordinate"

const stopFactory = Factory.define<Stop>(({ sequence }) => ({
  id: `stop${sequence}`,
  name: `Some Stop - ${sequence}`,
  locationType: LocationType.Stop,
  vehicleType: 3,
  routes: undefined,
  ...localGeoCoordinateFactory.build()
}))

export default stopFactory
