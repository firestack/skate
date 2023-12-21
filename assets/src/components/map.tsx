import Leaflet, { LatLng, Map as LeafletMap } from "leaflet"

import "leaflet-defaulticon-compatibility" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import "leaflet.fullscreen"
import React, {
  ComponentProps,
  ComponentPropsWithRef,
  MutableRefObject,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  AttributionControl,
  Pane,
  TileLayer,
  useMapEvents,
  ZoomControl,
} from "react-leaflet"
import { createControlComponent } from "@react-leaflet/core"

import { joinClasses } from "../helpers/dom"
import { TrainVehicle, Vehicle, VehicleId } from "../realtime.d"
import { Shape, Stop } from "../schedule"
import inTestGroup, { TestGroups } from "../userInTestGroup"
import {
  GarageMarkers,
  RouteShape,
  RouteStopMarkers,
  StationMarker,
  TrainVehicleMarker,
  VehicleMarker,
} from "./mapMarkers"
import ZoomLevelProvider, { ZoomLevel, useZoomLevel } from "./ZoomLevelWrapper"
import { StreetViewControl } from "./map/controls/StreetViewSwitch"
import StreetViewModeEnabledContext from "../contexts/streetViewModeEnabledContext"
import { TileType } from "../tilesetUrls"
import { TileTypeContext } from "../contexts/tileTypeContext"
import {
  useInteractiveFollowerState,
  RecenterControlWithInterruptibleFollower,
  usePickerContainerFollowerFn,
} from "./map/follower"
import {
  MapDefaults,
  SkateAttributionControl,
  SkateTileLayer,
} from "./MapDefaults"

export interface Props {
  reactLeafletRef?: MutableRefObject<LeafletMap | null>
  children?: ReactElement | ReactElement[]
  tileType?: TileType
  stateClasses?: string

  onPrimaryVehicleSelect?: (vehicle: Vehicle) => void
  selectedVehicleId?: VehicleId
  vehicles: Vehicle[]
  // secondaryVehicles are smaller, deemphasized, and don't affect follower in `MapFollowingPrimaryVehicles`
  secondaryVehicles?: Vehicle[]
  // trainVehicles are white, don't get a label, and don't affect follower in `MapFollowingPrimaryVehicles`
  trainVehicles?: TrainVehicle[]
  shapes?: Shape[]
  allowStreetView?: boolean
  streetViewInitiallyEnabled?: boolean
  allowFullscreen?: boolean
  includeStopCard?: boolean
  stations?: Stop[] | null
}

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const [streetViewEnabled, setStreetViewEnabled] = useState<boolean>(
    props.streetViewInitiallyEnabled || false
  )

  const { allowFullscreen = true } = props

  return (
    <>
      <MapDefaults ref={props.reactLeafletRef}>
        <MapVehicles.All
          primaryVehicles={props.vehicles}
          secondaryVehicles={props.secondaryVehicles ?? []}
          onPrimaryVehicleSelect={props.onPrimaryVehicleSelect}
          selectedVehicleId={props.selectedVehicleId}
        />

        <RouteShapes shapes={props.shapes ?? []} />
        <MapTrainVehicles trainVehicles={props.trainVehicles ?? []} />

        <SkateTileLayer tileType={props.tileType}>
          <ZoomLevel.Provider>
            <ZoomLevel.Consumer>
              {(zoomLevel) => (
                <>
                  <ShapesStops
                    shapes={props.shapes ?? []}
                    zoomLevel={zoomLevel}
                  />
                  <Pane
                    name="notableLocationMarkers"
                    pane="markerPane"
                    style={{ zIndex: 410 }}
                  >
                    <MapStations

                      zoomLevel={zoomLevel}
                      stations={props.stations ?? []}
                    />
                    {zoomLevel >= 15 && (
                      <MapStations

                        zoomLevel={zoomLevel}
                        stations={props.stations ?? []}
                      />
                    )}
                    {zoomLevel >= 15 && <GarageMarkers zoomLevel={zoomLevel} />}
                  </Pane>
                </>
              )}
            </ZoomLevel.Consumer>

            <StreetViewModeEnabledContext.Provider value={streetViewEnabled}>
              {props.children}
            </StreetViewModeEnabledContext.Provider>
          </ZoomLevel.Provider>
        </SkateTileLayer>

        <EventAdder />

        {props.allowStreetView && (
          <StreetViewControl
            position="topright"
            streetViewEnabled={streetViewEnabled}
            setStreetViewEnabled={setStreetViewEnabled}
          />
        )}

        <ZoomControl position="topright" />

        {allowFullscreen && <FullscreenControl position="topright" />}

        <SkateAttributionControl />
      </MapDefaults>
    </>
  )
}

export default Map

export const FullscreenControl = createControlComponent(
  Leaflet.control.fullscreen
)

const EventAdder = (): ReactElement => {
  useMapEvents({
    popupopen: (e) => setTimeout(() => (e.popup.options.autoPan = false), 100),

    popupclose: (e) => (e.popup.options.autoPan = true),
  })
  return <></>
}

export const vehicleToLeafletLatLng = ({
  latitude,
  longitude,
}: Vehicle): Leaflet.LatLng => Leaflet.latLng(latitude, longitude)

export const MapFollowingPrimaryVehicles = (props: Props) => {
  const state = useInteractiveFollowerState()

  const positions: LatLng[] = props.vehicles.map(vehicleToLeafletLatLng)

  return (
    <Map {...props}>
      <>
        <RecenterControlWithInterruptibleFollower
          positions={positions}
          {...state}
          onUpdate={usePickerContainerFollowerFn()}
        />
        {props.children}
      </>
    </Map>
  )
}

export const MapFollowingSelectionKey = (
  props: Props & { selectionKey?: string }
) => {
  const state = useInteractiveFollowerState(),
    { setShouldFollow } = state

  const positions: LatLng[] = props.vehicles.map(vehicleToLeafletLatLng)

  useEffect(() => setShouldFollow(true), [props.selectionKey, setShouldFollow])

  return (
    <Map {...props}>
      <>
        <RecenterControlWithInterruptibleFollower
          positions={positions}
          {...state}
          onUpdate={usePickerContainerFollowerFn()}
        />
        {props.children}
      </>
    </Map>
  )
}


interface MapVehiclesProps {
  vehicles: Vehicle[]
  selectedVehicleId?: VehicleId
  onSelect?: (vehicle: Vehicle) => void

  variant?: MapVehiclesVariant

  zIndex?: number
}

enum MapVehiclesVariant {
  Primary,
  Secondary,
}

const MapVehicles = ({
  vehicles,
  selectedVehicleId,
  onSelect,
  variant,
  zIndex,
}: MapVehiclesProps) => {
  return (
    <Pane
      name={
        variant == MapVehiclesVariant.Primary
          ? "primaryVehicles"
          : "secondaryVehicles"
      }
      pane="markerPane"
      style={{ zIndex }}
    >
      {vehicles.map((vehicle: Vehicle) => (
        <VehicleMarker
          key={vehicle.id}
          vehicle={vehicle}
          isPrimary={true}
          isSelected={selectedVehicleId === vehicle.id}
          onSelect={onSelect}
        />
      ))}
    </Pane>
  )
}

type PartialBy<
  T,
  KPartial extends keyof T,
  KOmit extends keyof T = KPartial
> = Partial<Pick<T, KPartial>> & Omit<T, KPartial | KOmit>

type VehicleVariantProps = PartialBy<
  ComponentPropsWithRef<typeof MapVehicles>,
  "zIndex",
  "variant"
>

const Primary = (props: VehicleVariantProps) => (
  <MapVehicles zIndex={490} {...props} variant={MapVehiclesVariant.Primary} />
)

const Secondary = (props: VehicleVariantProps) => (
  <MapVehicles zIndex={400} {...props} variant={MapVehiclesVariant.Secondary} />
)

MapVehicles.Primary = Primary
MapVehicles.Secondary = Secondary

type AllVehiclesProps = Omit<
  VehicleVariantProps,
  "onSelect" | "vehicles" | "zIndex"
> & {
  primaryVehicles: VehicleVariantProps["vehicles"]
  secondaryVehicles: VehicleVariantProps["vehicles"]
  onPrimaryVehicleSelect?: VehicleVariantProps["onSelect"]
  onSecondaryVehicleSelect?: VehicleVariantProps["onSelect"]
}

const MapVehiclesAll = ({
  primaryVehicles,
  secondaryVehicles,
  selectedVehicleId,
  onPrimaryVehicleSelect,
  onSecondaryVehicleSelect,
}: AllVehiclesProps) => (
  <>
    <MapVehicles.Primary
      vehicles={primaryVehicles}
      selectedVehicleId={selectedVehicleId}
      onSelect={onPrimaryVehicleSelect}
    />
    <MapVehicles.Secondary
      vehicles={secondaryVehicles}
      selectedVehicleId={selectedVehicleId}
      onSelect={onSecondaryVehicleSelect}
    />
  </>
)

MapVehicles.All = MapVehiclesAll

const MapTrainVehicles = ({
  trainVehicles,
}: {
  trainVehicles: TrainVehicle[]
}) => (
  <>
    {(trainVehicles || []).map((trainVehicle) => (
      <TrainVehicleMarker key={trainVehicle.id} trainVehicle={trainVehicle} />
    ))}
  </>
)

const RouteShapes = ({ shapes }: { shapes: Shape[] }) => (
  <>
    {(shapes || []).map((shape) => (
      <RouteShape key={shape.id} shape={shape} />
    ))}
  </>
)

const MapStations = ({
  stations,
  zoomLevel,
}: {
  stations: Stop[]
  zoomLevel: number
}) => (
  <>
    {stations.map((station) => (
      <StationMarker key={station.id} station={station} zoomLevel={zoomLevel} />
    ))}
  </>
)

const RouteStops = ({
  stops,
  zoomLevel,
  zIndex = 450,
  includeStopCard = false,
}: {
  stops: Stop[]
  zoomLevel: number | (() => number)
  zIndex?: number
  includeStopCard?: boolean
}) => (
  <>
    <Pane
      name="routeStopMarkers"
      pane="markerPane"
      style={{ zIndex }} // should be above other non-interactive elements
    >
      <RouteStopMarkers
        stops={stops}
        zoomLevel={typeof zoomLevel === "function" ? zoomLevel() : zoomLevel }
        includeStopCard={includeStopCard && inTestGroup(TestGroups.MapBeta)}
      />
    </Pane>
  </>
)

type RouteStopsZoomLevelContextProps = PartialBy<
  ComponentProps<typeof RouteStops>,
  "zoomLevel"
>
const RouteStopsZoomLevelContext = (props: RouteStopsZoomLevelContextProps) => (
  <RouteStops zoomLevel={useZoomLevel()} {...props} />
)
RouteStops.FromZoomContext = RouteStopsZoomLevelContext

type ShapesStopsProps = Omit<ComponentProps<typeof RouteStops>, "stops"> & {
  shapes: Shape[]
}
export const ShapesStops = (props: ShapesStopsProps) => (
  <RouteStops
    {...props}
    stops={(props.shapes || []).flatMap((shape) => shape.stops || [])}
  />
)

// export const ShapesStopsZoomLevelContext = ()
