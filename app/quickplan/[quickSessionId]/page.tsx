"use client";

import { useState, useEffect, useRef } from "react";
import { Loader } from "lucide-react";
import MapComponent from "~/components/map-component";
import ChatInterface from "~/components/chat-interface";
import Footer from "~/components/footer";
import type { Place } from "~/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types / Interfaces
// ─────────────────────────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string };
interface ServerMessage { type: string; [k: string]: any }

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SOCKET_PATH = "wss://neat-ray-relevant.ngrok-free.app";

// ─────────────────────────────────────────────────────────────────────────────
// Home Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  // ─── State ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatResponse, setChatResponse] = useState("");
  const [isMapVisible, setIsMapVisible] = useState(false); // mobile overlay toggle
  const [userSessionId, setUserSessionId] = useState("");
  const [searchSessionId, setSearchSessionId] = useState("");

  const socketRef = useRef<WebSocket | null>(null);
  const mapRef = useRef<any>(null);

  // ─── WebSocket init ──────────────────────────────────────────────────────
  useEffect(() => {
    if (socketRef.current) return;
    const socket = new WebSocket(SOCKET_PATH);

    socket.onopen = () => console.log("WS connected");

    socket.onmessage = (evt) => {
      const msg: ServerMessage = JSON.parse(evt.data);
      try {
        if (msg.type === "userSessionCreated") {
          setUserSessionId(msg.sessionId);
        } else if (msg.type === "searchSessionCreated") {
          const { session } = msg;
          const col = session.userSessionIds.indexOf(userSessionId);
          const mapped: Place[] = session.places.map((p: any, idx: number) => ({
            id: p.id,
            name: p.displayName,
            lat: p.location.latitude,
            lng: p.location.longitude,
            type: p.primaryType,
            relevancy: session.relevanceMatrix[col][idx],
            rating: p.rating,
            url: p.googleMapsUri,
            websiteUrl: p.websiteUri,
          }));
          mapped.sort((a, b) => (b.relevancy ?? 0) - (a.relevancy ?? 0));
          setPlaces(mapped.slice(0, 3));
          setSearchSessionId(session.id);
        } else if (msg.type === "assistantReply") {
          // hypothetical backend event with assistant message content
          setChatHistory((h) => [...h, { role: "assistant", content: msg.content }]);
          setChatResponse(msg.content);
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    socket.onclose = () => (socketRef.current = null);
    socket.onerror = (err) => console.error("WS error", err);
    socketRef.current = socket;
  }, [userSessionId]);

  const sendWS = (payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  // ─── Loader timer ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // ─── Chat handler ────────────────────────────────────────────────────────
  const handleChatMessage = (prompt: string) => {
    setChatHistory((h) => [...h, { role: "user", content: prompt }]);
    if (!searchSessionId) {
      sendWS({ type: "NEW_SEARCH_SESSION", query: prompt });
    } else {
      sendWS({ type: "ADJUST_SEARCH_SESSION", searchSessionId, prompt });
    }
  };

  // ─── Place select ─────────────────────────────────────────────────────────
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    mapRef.current?.flyTo(place);
    setIsMapVisible(true); // open overlay on mobile
  };

  // ─── Shared map element loader (desktop sidebar) ─────────────────────────
  const DesktopMap = (
    <div className="hidden lg:block relative h-full w-3/5">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/70">
          <Loader className="h-8 w-8 animate-spin text-slate-700" />
        </div>
      )}
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
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/70">
            <Loader className="h-8 w-8 animate-spin text-slate-700" />
          </div>
        )}
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
            <ChatInterface
            onSendMessage={handleChatMessage}
            places={places}
            onPlaceSelect={handlePlaceSelect}
            selectedPlace={selectedPlace}
            isLoading={loading}
            chatHistory={chatHistory}
            chatResponse={chatResponse}
            handleExit={() => setIsMapVisible(false)}
            isMapVisible={isMapVisible}
            handleMapToggle={() => setIsMapVisible((prev) => !prev)}
            />
            <Footer/>
        </div>
        {/* Footer pinned to bottom */}
      </div>

      {MobileOverlay}
    </main>
  );
}
