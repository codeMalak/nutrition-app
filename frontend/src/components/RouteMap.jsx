import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Plain OpenStreetMap tiles — the only widely-used basemap left that's
// actually usable with no signup/API key (CARTO's free "basemaps.cartocdn.com"
// styles, the more common no-key pick, now watermark every tile "API KEY
// REQUIRED" — confirmed by hitting the endpoint directly). There's no
// key-less dark-tile server either, so dark mode reuses these tiles with a
// CSS invert filter (see `.leaflet-tile-pane` in index.css) instead.
//
// OSM's own tile usage policy asks for reasonable, low-volume use of this
// endpoint — fine for development and a personal-scale app. If this ships to
// the App Store at real traffic, swap this URL for a provider with a paid/
// commercial tier (MapTiler, Mapbox, Stadia Maps, Thunderforest, Jawg all
// have one with a free-tier API key) — this is the only place that needs to
// change.
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Renders (and, in live mode, incrementally redraws) a traced polyline of a
// run's GPS route on a real map. `route` is an array of {lat, lng}; passing
// a longer array each render — even the same array reference mutated in
// place by a live GPS callback — updates the drawn line.
export default function RouteMap({ route, live = false, darkMode = false, heightClass = "h-56" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const didInitialFitRef = useRef(false);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: !live,
      scrollWheelZoom: false, // don't hijack page scroll when embedded in a card
      attributionControl: true,
    }).setView([0, 0], 2);

    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

    polylineRef.current = L.polyline([], {
      color: "#10b981",
      weight: 4,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    startMarkerRef.current = L.circleMarker([0, 0], {
      radius: 6, color: "#fff", weight: 2, fillColor: "#10b981", fillOpacity: 1,
    });
    endMarkerRef.current = L.circleMarker([0, 0], {
      radius: 6, color: "#fff", weight: 2, fillColor: "#ef4444", fillOpacity: 1,
    });

    mapRef.current = map;

    // The container's real size isn't always settled on first paint inside
    // a flex/grid layout — nudge Leaflet to re-measure it.
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw the traced line + start/end markers whenever the route grows.
  // `route?.length` is included alongside `route` because a live run mutates
  // the same array in place (push) — the reference doesn't change, but the
  // length does, and that's what should trigger a redraw here.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route || route.length === 0) return;

    const latlngs = route.map((p) => [p.lat, p.lng]);
    polylineRef.current.setLatLngs(latlngs);

    const start = latlngs[0];
    const end = latlngs[latlngs.length - 1];
    startMarkerRef.current.setLatLng(start).addTo(map);
    endMarkerRef.current.setLatLng(end).addTo(map);

    if (live) {
      if (!didInitialFitRef.current) {
        map.setView(end, 17);
        didInitialFitRef.current = true;
      } else {
        map.panTo(end, { animate: true });
      }
    } else if (latlngs.length > 1) {
      map.fitBounds(polylineRef.current.getBounds(), { padding: [24, 24] });
    } else {
      map.setView(start, 16);
    }
  }, [route, route?.length, live]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${heightClass} rounded-xl overflow-hidden ${darkMode ? "map-dark" : ""}`}
    />
  );
}
