import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import type { Place } from "~/lib/types";
import { PlaceIcon } from "~/lib/places-icons";
import ReactDOMServer from "react-dom/server";
import config from "~/config.json";

interface SimpleGlobeProps {
  places: Place[];
  selectedPlace: Place | null;
}

// Define the imperative handle type for ref operations
interface MapRefHandle {
  flyTo: (place: Place) => void;
  zoomToAllPlaces: () => void;
}

const MOBILE_BREAKPOINT = 768; // px

const SimpleGlobe = forwardRef<MapRefHandle, SimpleGlobeProps>(
  ({ places, selectedPlace }, ref) => {
    /**
     * ────────────────────────────────────────────────────────────────────────────────
     *  REFS & STATE
     * ────────────────────────────────────────────────────────────────────────────────
     */
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const map3DRef = useRef<any>(null); // Map3DElement
    const map2DRef = useRef<any>(null); // google.maps.Map
    const markersRef = useRef<Map<string, any>>(new Map());

    // Detect viewport size – re‑evaluate on resize
    const [isMobile, setIsMobile] = useState<boolean>(() =>
      typeof window !== "undefined"
        ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
        : false
    );

    useEffect(() => {
      const handler = () =>
        setIsMobile(
          window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
        );
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }, []);

    /**
     * ────────────────────────────────────────────────────────────────────────────────
     *  IMPERATIVE HANDLE (flyTo, zoomToAllPlaces)
     * ────────────────────────────────────────────────────────────────────────────────
     */
    useImperativeHandle(ref, () => ({
      flyTo(place: Place) {
        if (isMobile && map2DRef.current) {
          map2DRef.current.panTo({ lat: place.lat, lng: place.lng });
          map2DRef.current.setZoom(8);
        } else if (!isMobile && map3DRef.current) {
          map3DRef.current.flyCameraTo({
            endCamera: {
              center: { lat: place.lat, lng: place.lng, altitude: 75 },
              tilt: 65,
              range: 500,
              heading: 0,
            },
            durationMillis: 2000,
          });
        }
      },
      zoomToAllPlaces() {
        if (!places.length) return;
        const bounds = calculateBounds(places);
        if (isMobile && map2DRef.current) {
          map2DRef.current.fitBounds(bounds, 50);
        } else if (!isMobile && map3DRef.current) {
          zoomToBounds(bounds);
        }
      },
    }));

    /**
     * ────────────────────────────────────────────────────────────────────────────────
     *  UTILS (weighted center, bounds)
     * ────────────────────────────────────────────────────────────────────────────────
     */
    const calculateWeightedCenter = (places: Place[]) => {
      if (!places.length) return { lat: 46.717, lng: 7.075 };
      const total = places.reduce((acc, p) => acc + (p.relevancy || 1), 0);
      const lat = places.reduce((s, p) => s + p.lat * (p.relevancy || 1), 0) / total;
      const lng = places.reduce((s, p) => s + p.lng * (p.relevancy || 1), 0) / total;
      return { lat, lng };
    };

    const calculateBounds = (places: Place[]) => {
      const bounds = new window.google.maps.LatLngBounds();
      places.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      return bounds;
    };

    const zoomToBounds = (bounds: any) => {
      if (!map3DRef.current) return;
      const center = {
        lat: (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2,
        lng: (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2,
        altitude: 2175.13,
      };
      const latSpan = bounds.toSpan().lat();
      const lngSpan = bounds.toSpan().lng();
      const maxSpan = Math.max(latSpan, lngSpan);
      const range = Math.max(1000, maxSpan * 111000 * 2.5);
      map3DRef.current.flyCameraTo({
        endCamera: {
          center,
          tilt: 33,
          range,
          heading: 4.36,
        },
        durationMillis: 2000,
      });
    };

    /**
     * ────────────────────────────────────────────────────────────────────────────────
     *  INITIALISE GOOGLE MAPS (2D or 3D)
     * ────────────────────────────────────────────────────────────────────────────────
     */
    useEffect(() => {
      // Load Google Maps JS API once – same loader for both views
      (function loadGoogleMapsAPI(g: Record<string, string>) {
        let h: Promise<void> | undefined;
        const p = "The Google Maps JavaScript API";
        const c = "google";
        const l = "importLibrary";
        const q = "__ib__";
        const m = document;
        let b: any = window as any;
        b = b[c] || (b[c] = {});
        const d = b.maps || (b.maps = {});
        const r = new Set<string>();
        const e = new URLSearchParams();
        const u = () =>
          h || (h = new Promise((f, n) => {
            const a = m.createElement("script");
            e.set("libraries", [...r] + "");
            for (const k in g) {
              e.set(k.replace(/[A-Z]/g, (t) => "_" + t.toLowerCase()), g[k]);
            }
            e.set("callback", c + ".maps." + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e.toString();
            d[q] = f;
            a.onerror = () => (h = n(Error(p + " could not load.")));
            m.head.appendChild(a);
          }));
        if (d[l]) return; // already initialised
        d[l] = (f: any, ...n: any[]) => r.add(f) && u().then(() => d[l](f, ...n));
      })({ key: config.key, v: "beta" });

      // Clean up previous map instances when switching between modes
      const cleanupMaps = () => {
        markersRef.current.clear();
        map3DRef.current = null;
        map2DRef.current = null;
        if (mapContainerRef.current) mapContainerRef.current.innerHTML = "";
      };

      async function init() {
        if (!window.google || !window.google.maps || !window.google.maps.importLibrary) return;
        cleanupMaps();

        if (isMobile) {
          /**
           * ───────────────────────── 2D MAP (MOBILE) ─────────────────────────
           */
          const { Map, Marker, InfoWindow } = await window.google.maps.importLibrary(
            "maps"
          );

          const center = calculateWeightedCenter(places);

          const map = new Map(mapContainerRef.current!, {
            center,
            zoom: 4,
            mapTypeId: "roadmap",
            gestureHandling: "greedy",
          });
          map2DRef.current = map;

          // Add markers & listeners
          places.forEach((place) => {
            const iconSvg = ReactDOMServer.renderToStaticMarkup(
              <PlaceIcon place={place} className="marker-icon" />
            );
            const marker = new Marker({
              position: { lat: place.lat, lng: place.lng },
              map,
              title: place.name,
              icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`,
                scaledSize: new window.google.maps.Size(30, 30),
              },
            });
            markersRef.current.set(place.name, marker);

            const info = new InfoWindow({
              content: `<div style="max-width:250px"><h3 style="margin:0">${place.name}</h3>$${
                place.type ? `<p>Type: ${place.type}</p>` : ""
              }${place.relevancy ? `<p>Relevancy: ${place.relevancy}</p>` : ""}$${
                place.websiteUrl
                  ? `<a href='${place.websiteUrl}' target='_blank'>Visit Website</a>`
                  : ""
              }</div>`.
                replace(/\$/g, ""),
            });

            marker.addListener("click", () => {
              info.open({ anchor: marker, map });
              map.panTo(marker.getPosition()!);
              map.setZoom(8);
            });
          });

          // Zoom to fit all places initially
          if (places.length) {
            const bounds = calculateBounds(places);
            map.fitBounds(bounds, 50);
          }
        } else {
          /**
           * ───────────────────────── 3D MAP (DESKTOP) ─────────────────────────
           */
          const { Map3DElement, MapMode, Marker3DInteractiveElement } =
            await window.google.maps.importLibrary("maps3d");

          const center = calculateWeightedCenter(places);

          const map3D = new Map3DElement({
            center: { ...center, altitude: 2175.13 },
            range: 5814650,
            tilt: 33,
            heading: 4.36,
            mode: MapMode.SATELLITE,
          });
          map3DRef.current = map3D;
          mapContainerRef.current!.appendChild(map3D);

          // Add markers (3D)
          places.forEach((place, index) => {
            const iconSvg = ReactDOMServer.renderToStaticMarkup(
              <PlaceIcon place={place} className="marker-icon" />
            );
            const marker = new Marker3DInteractiveElement({
              position: { lat: place.lat, lng: place.lng, altitude: 75 },
              label: place.name,
              altitudeMode: "ABSOLUTE",
              extruded: true,
              icon: iconSvg,
            });
            // scale markers – slightly larger for earlier items to keep variety
            marker.style.scale = 0.7 + 0.3 / (index + 1);

            marker.addEventListener("gmp-click", () => {
              map3D.flyCameraTo({
                endCamera: {
                  center: marker.position,
                  tilt: 65,
                  range: 500,
                  heading: 0,
                },
                durationMillis: 2000,
              });
            });
            map3D.append(marker);
            markersRef.current.set(place.name, marker);
          });

          // Zoom to fit all places once markers are added
          if (places.length) {
            const bounds = calculateBounds(places);
            setTimeout(() => zoomToBounds(bounds), 500);
          }
        }
      }

      const interval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.importLibrary) {
          clearInterval(interval);
          init();
        }
      }, 100);

      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [places, isMobile]);

    /**
     * ────────────────────────────────────────────────────────────────────────────────
     *  UPDATE SELECTED PLACE HIGHLIGHT (DESKTOP ONLY)
     * ────────────────────────────────────────────────────────────────────────────────
     */
    useEffect(() => {
      if (isMobile || !selectedPlace) return;
      const selectedMarker: any = markersRef.current.get(selectedPlace.name);
      markersRef.current.forEach((marker) => {
        marker.style.color = "#FFFFFF";
        marker.style.scale = 1;
      });
      if (selectedMarker) {
        selectedMarker.style.color = "#FFD700";
        selectedMarker.style.scale = 1.5;
      }
    }, [selectedPlace, isMobile]);

    /**
     * ────────────────────────────────────────────────────────────────────────────────
     *  RENDER
     * ────────────────────────────────────────────────────────────────────────────────
     */
    return (
      <div
        ref={mapContainerRef}
        style={{ height: isMobile ? "80vh" : "100vh", margin: 0 }}
      />
    );
  }
);

export default SimpleGlobe;
