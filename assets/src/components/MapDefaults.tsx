import { LatLngBoundsLiteral, LatLngLiteral, Map as LeafletMap } from "leaflet"
import React, {
  ComponentPropsWithRef,
  PropsWithChildren,
  ReactNode,
  forwardRef,
  useId,
  useMemo,
} from "react"
import { AttributionControl, MapContainer, TileLayer } from "react-leaflet"
import getMapLimits from "../mapLimits"
import { TileType, tilesetUrlForType } from "../tilesetUrls"
import { TileTypeContext } from "../contexts/tileTypeContext"

export const MapDefaults = forwardRef<
  LeafletMap,
  PropsWithChildren<ComponentPropsWithRef<typeof MapContainer>>
>(({ children, ...props }, ref) => (
  <MapContainer
    id={`id-vehicle-map-${useId()}`}
    className="c-vehicle-map"
    maxBounds={useMapLimits()}
    center={defaultCenter}
    zoom={defaultZoom}
    ref={ref}
    zoomControl={false}
    attributionControl={false}
    {...props}
  >
    {children}
  </MapContainer>
))

interface SkateTileLayerProps {
  tileType?: TileType
  children?: ReactNode | undefined
}

export const SkateTileLayer = ({
  children,
  tileType = "base",
}: SkateTileLayerProps) => (
  <>
    <TileLayer
      url={tilesetUrlForType(tileType) ?? ""}
      attribution={
        tileType === "base"
          ? '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          : '<a href="https://www.mass.gov/info-details/massgis-data-2021-aerial-imagery">MassGIS 2021</a>'
      }
    />
    <TileTypeContext.Provider value={tileType}>
      {children}
    </TileTypeContext.Provider>
  </>
)

export const SkateAttributionControl = (
  props: ComponentPropsWithRef<typeof AttributionControl>
) => <AttributionControl position="bottomright" prefix={false} {...props} />

/**
 *
 * @returns mapLimits in Leaflet Literal format
 */
export const useMapLimits = (): LatLngBoundsLiteral | undefined => {
  const mapLimits = getMapLimits()

  return useMemo(() => {
    return mapLimits
      ? [
          [mapLimits.south, mapLimits.west],
          [mapLimits.north, mapLimits.east],
        ]
      : undefined
  }, [mapLimits])
}

export const defaultZoom = 13

export const defaultCenter: LatLngLiteral = {
  lat: 42.360718,
  lng: -71.05891,
}
