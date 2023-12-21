import React, {
  ReactElement,
  ReactNode,
  createContext,
  useContext,
  useState,
} from "react"
import { useMap, useMapEvents } from "react-leaflet"

export const useZoomLevel = () => {
  const zoomLevel = useContext(ZoomLevelContext)
  if (zoomLevel === undefined) {
    throw Error("useZoomLevel must be used within a ZoomLevel.Provider")
  }
  return zoomLevel
}

const ZoomLevelContext = createContext<number | undefined>(undefined)

export const ZoomLevel = () => undefined

const Provider = ({ children }: { children?: ReactNode }) => {
  const parentContext = useContext(ZoomLevelContext)
  const map = useMap()
  const [zoomLevel, setZoomLevel] = useState(
    () => parentContext ?? map.getZoom()
  )

  useMapEvents(
    parentContext
      ? {}
      : {
          zoomend: (_) => {
            setZoomLevel(map.getZoom())
          },
        }
  )

  return (
    <ZoomLevelContext.Provider value={parentContext ?? zoomLevel}>
      {children}
    </ZoomLevelContext.Provider>
  )
}

ZoomLevel.Provider = Provider

ZoomLevel.Consumer = ({
  children,
}: {
  children: (zoomLevel: number) => ReactNode
}) => <>{children(useZoomLevel())}</>

type ProviderConsumerProps = {
  children: (zoomLevel: number) => ReactNode
}

const ProviderConsumer = ({ children }: ProviderConsumerProps) => (
  <ZoomLevel.Provider>
    <ZoomLevel.Consumer>
      {(zoomLevel) => children(zoomLevel!)}
    </ZoomLevel.Consumer>
  </ZoomLevel.Provider>
)

ZoomLevel.ProviderConsumer = ProviderConsumer
