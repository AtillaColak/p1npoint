/* eslint-disable */
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import type { Place } from "~/lib/types";
import { PlaceIcon } from "~/lib/places-icons";
import ReactDOMServer from "react-dom/server";
import config from "~/config.json"

interface SimpleGlobeProps {
  places: Place[];
  selectedPlace: Place | null;
}

// Define the imperative handle type for ref operations
interface MapRefHandle {
  flyTo: (place: Place) => void;
  zoomToAllPlaces: () => void;
}

const SimpleGlobe = forwardRef<MapRefHandle, SimpleGlobeProps>(
  ({ places, selectedPlace }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const map3DRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());

    // Expose methods to parent component through ref
    useImperativeHandle(ref, () => ({
      flyTo: (place: Place) => {
        if (!map3DRef.current) return;
        
        map3DRef.current.flyCameraTo({
          endCamera: {
            center: { lat: place.lat, lng: place.lng, altitude: 75 },
            tilt: 65,
            range: 500,
            heading: 0,
          },
          durationMillis: 2000,
        });
      },
      zoomToAllPlaces: () => {
        if (!map3DRef.current || places.length === 0) return;
        
        const bounds = calculateBounds(places);
        zoomToBounds(bounds);
      }
    }));

    // Calculate weighted center based on place relevancy
    const calculateWeightedCenter = (places: Place[]) => {
      if (!places || places.length === 0) return { lat: 46.717, lng: 7.075 };
      
      const totalRelevancy = places.reduce((sum, place) => sum + (place.relevancy || 1), 0);
      
      const weightedLat = places.reduce((sum, place) => 
        sum + place.lat * (place.relevancy || 1), 0) / totalRelevancy;
      
      const weightedLng = places.reduce((sum, place) => 
        sum + place.lng * (place.relevancy || 1), 0) / totalRelevancy;
      
      return { lat: weightedLat, lng: weightedLng };
    };

    // Calculate bounds for all places
    const calculateBounds = (places: Place[]) => {
      if (!places || places.length === 0) {
        return { north: 90, south: -90, east: 180, west: -180 };
      }

      let north = -90, south = 90, east = -180, west = 180;
      
      places.forEach(place => {
        north = Math.max(north, place.lat);
        south = Math.min(south, place.lat);
        east = Math.max(east, place.lng);
        west = Math.min(west, place.lng);
      });
      
      // Add padding
      const latPadding = (north - south) * 0.1;
      const lngPadding = (east - west) * 0.1;
      
      return {
        north: Math.min(90, north + latPadding),
        south: Math.max(-90, south - latPadding),
        east: Math.min(180, east + lngPadding),
        west: Math.max(-180, west - lngPadding)
      };
    };

    // Zoom map to fit bounds
    const zoomToBounds = (bounds: any) => {
      if (!map3DRef.current) return;
      
      // Calculate center
      const center = {
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2,
        altitude: 2175.130
      };
      
      // Calculate appropriate range (zoom level)
      const latSpan = bounds.north - bounds.south;
      const lngSpan = bounds.east - bounds.west;
      const maxSpan = Math.max(latSpan, lngSpan);
      
      // Convert degrees to approximate meters (very rough estimate)
      const range = maxSpan * 111000 * 2.5; // 111km per degree of latitude, with extra padding
      
      map3DRef.current.flyCameraTo({
        endCamera: {
          center,
          tilt: 33,
          range: Math.max(1000, range),
          heading: 4.36,
        },
        durationMillis: 2000,
      });
    };

    // Update markers when selected place changes
    useEffect(() => {
      if (!map3DRef.current || !selectedPlace) return;
    
      // Highlight the selected marker
      markersRef.current.forEach((marker, id) => {
        // Reset all markers to default style
        marker.style.color = "#FFFFFF";
        marker.style.scale = 1;
      });
      
      // Find and highlight the selected marker
      const selectedMarker = markersRef.current.get(selectedPlace.name);
      if (selectedMarker) {
        selectedMarker.style.color = "#FFD700"; // Gold color for selected
        selectedMarker.style.scale = 1.5; // Make it slightly larger
      }
    }, [selectedPlace]);

    useEffect(() => {
      // IIFE to load the Google Maps API script
      (function loadGoogleMapsAPI(g: Record<string, any>) {
        let h, a, k;
        const p = "The Google Maps JavaScript API";
        const c = "google";
        const l = "importLibrary";
        const q = "__ib__";
        const m = document;
        let b = window;
        b = b[c] || (b[c] = {});
        const d = b.maps || (b.maps = {});
        const r = new Set();
        const e = new URLSearchParams();
        const u = () =>
          h ||
          (h = new Promise(async (f, n) => {
            a = m.createElement("script");
            e.set("libraries", [...r] + "");
            for (k in g) {
              e.set(
                k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
                g[k]
              );
            }
            e.set("callback", c + ".maps." + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => (h = n(Error(p + " could not load.")));
            a.nonce = m.querySelector("script[nonce]")?.nonce || "";
            m.head.append(a);
          }));
        if (d[l]) {
          console.warn(p + " only loads once. Ignoring:", g);
        } else {
          d[l] = (f: any, ...n: any[]) => r.add(f) && u().then(() => d[l](f, ...n));
        }
      })({
        key: config.key,
        v: "beta",
      });

      async function init() {
        if (
          !window.google ||
          !window.google.maps ||
          !window.google.maps.importLibrary
        ) {
          console.error("Google Maps API is not loaded yet.");
          return;
        }
        const { Map3DElement, MapMode, Marker3DInteractiveElement } = await window.google.maps.importLibrary(
          "maps3d"
        );
        
        // Clear marker references
        markersRef.current.clear();
        
        // Compute the weighted center
        const center = calculateWeightedCenter(places);
        
        const map3D = new Map3DElement({
          center: { ...center, altitude: 2175.130 },
          range: 5814650,
          tilt: 33,
          heading: 4.36,
          mode: MapMode.SATELLITE,
        });
        
        map3DRef.current = map3D;
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = "";
          mapContainerRef.current.appendChild(map3D);
        }

        // Add markers for each place
        if (places && places.length > 0) {
          places.forEach((place, index ) => {
          // Render the appropriate icon to an SVG string
          const iconSvgString = ReactDOMServer.renderToStaticMarkup(
            <PlaceIcon place={place} className="marker-icon" />
          );

          // Create marker with the SVG icon
          const marker = new Marker3DInteractiveElement({
            position: { lat: place.lat, lng: place.lng, altitude: 75 },
            label: place.name,
            altitudeMode: "ABSOLUTE",
            extruded: true,
            icon: iconSvgString, // pass the rendered SVG icon here
          });
            // Scale marker size based on relevancy (if available)
            if (place.relevancy) {
              const scale = 0.7 + (0.3 / index);
              marker.style.scale = scale;
            }
            
            marker.addEventListener("gmp-click", () => {
              // Fly to the clicked marker
              map3D.flyCameraTo({
                endCamera: {
                  center: marker.position,
                  tilt: 65,
                  range: 500,
                  heading: 0,
                },
                durationMillis: 2000,
              });
              
              // Create an info window-like effect
              const info = document.createElement("div");
              info.style.position = "absolute";
              info.style.bottom = "20px";
              info.style.left = "20px";
              info.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              info.style.padding = "10px";
              info.style.borderRadius = "5px";
              info.style.maxWidth = "300px";
              info.style.zIndex = "1000";
              
              const nameElement = document.createElement("h3");
              nameElement.textContent = place.name;
              nameElement.style.margin = "0 0 5px 0";
              info.appendChild(nameElement);
              
              if (place.type) {
                const typeElement = document.createElement("p");
                typeElement.textContent = `Type: ${place.type}`;
                typeElement.style.margin = "0 0 5px 0";
                info.appendChild(typeElement);
              }

              if (place.relevancy) {
                const relevancyElement = document.createElement("p");
                relevancyElement.textContent = `Relevancy: ${place.relevancy}`;
                relevancyElement.style.margin = "0 0 5px 0";
                info.appendChild(relevancyElement);
              }
              
              if (place.websiteUrl) {
                const linkElement = document.createElement("a");
                linkElement.href = place.websiteUrl;
                linkElement.textContent = "Visit Website";
                linkElement.target = "_blank";
                linkElement.style.display = "inline-block";
                linkElement.style.marginTop = "5px";
                linkElement.style.color = "blue";
                info.appendChild(linkElement);
              }
              
              const closeButton = document.createElement("button");
              closeButton.textContent = "×";
              closeButton.style.position = "absolute";
              closeButton.style.top = "5px";
              closeButton.style.right = "5px";
              closeButton.style.border = "none";
              closeButton.style.background = "none";
              closeButton.style.fontSize = "16px";
              closeButton.style.cursor = "pointer";
              closeButton.onclick = () => {
                if (mapContainerRef.current?.contains(info)) {
                  mapContainerRef.current.removeChild(info);
                }
              };
              info.appendChild(closeButton);
              
              // Remove any existing info windows
              const existingInfo = mapContainerRef.current?.querySelector("div[style*='position: absolute']");
              if (existingInfo && mapContainerRef.current?.contains(existingInfo)) {
                mapContainerRef.current.removeChild(existingInfo);
              }
              
              // Add the info window to the map container
              if (mapContainerRef.current) {
                mapContainerRef.current.appendChild(info);
              }
            });
            
            map3D.append(marker);
            markersRef.current.set(place.name, marker);
          });
          
          // Zoom to fit all places after adding them
          const bounds = calculateBounds(places);
          setTimeout(() => zoomToBounds(bounds), 500);
        }
      }

      const interval = setInterval(() => {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.importLibrary
        ) {
          clearInterval(interval);
          init();
        }
      }, 100);

      return () => clearInterval(interval);
    }, [places]);

    return <div style={{ height: "100vh", margin: 0 }} ref={mapContainerRef} />;
  }
);

export default SimpleGlobe;
