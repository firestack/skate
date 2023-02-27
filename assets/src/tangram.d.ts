
declare module 'tangram' {
  import { GridLayer } from "leaflet";
  export function leafletLayer(props: { scene: string}): GridLayer
}
