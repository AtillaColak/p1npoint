"use client"; 

import { useState, useRef } from "react";
import MapComponent from "~/components/map-component";
import Footer from "~/components/footer";
import type { Place } from "~/lib/types";
import { api } from "~/convex/_generated/api";
import SessionPage from "~/components/session";
import { Preloaded } from "convex/react";

export default function QuickInterface({ chatSession, chatMessages }: 
  { chatSession: Preloaded<typeof api.myFunctions.getSession>; chatMessages: Preloaded<typeof api.myFunctions.getMessages>; }) {
  // ─── State ───────────────────────────────────────────────────────────────
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false); // mobile overlay toggle
  const mapRef = useRef<any>(null);


  // ─── Place select ─────────────────────────────────────────────────────────
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    mapRef.current?.flyTo(place);
    setIsMapVisible(true); // open overlay on mobile
  };

  // ─── Shared map element loader (desktop sidebar) ─────────────────────────
  const DesktopMap = (
    <div className="hidden lg:block relative h-full w-3/5">
      <MapComponent ref={mapRef} places={places} selectedPlace={selectedPlace} />
    </div>
  );

  // ─── Mobile overlay ───────────────────────────────────────────────────────
  const MobileOverlay = isMapVisible ? (
    <div className="fixed inset-0 z-20 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => setIsMapVisible(false)}
      />
      {/* Map */}
      <div className="absolute inset-0">
        <MapComponent ref={mapRef} places={places} selectedPlace={selectedPlace} />
      </div>
    </div>
  ) : null;

  return (
    <main className="flex h-screen w-full flex-col lg:flex-row overflow-y-auto overflow-x-hidden bg-slate-50">
      {/* Map sidebar (desktop) */}
      
      {DesktopMap}

      {/* Chat column with sticky footer */}
      <div className="relative flex-1 lg:w-2/5 border-l border-slate-200 flex flex-col">
        {/* Scrollable chat area */}
        <div className="flex-1 overflow-y-auto">
            <SessionPage
                places={places}
                onPlaceSelect={handlePlaceSelect}
                selectedPlace={selectedPlace}
                handleExit={() => setIsMapVisible(false)}
                isMapVisible={isMapVisible}
                handleMapToggle={() => setIsMapVisible((prev) => !prev)}
                chatSession={chatSession}
                chatMessages={chatMessages}
            />
            <Footer/>
        </div>
      </div>

      {MobileOverlay}
    </main>
  );
}
