// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import { Loader } from "lucide-react";
// import MapComponent from "~/components/map-component";
// import ChatInterface from "~/components/chat-interface";
// import type { Place } from "~/lib/types";
// import { PlacesModal } from "~/components/finishing-modal";


// // Define a Message type for the chat history
// type Message = {
//   role: "user" | "assistant";
//   content: string;
// };


// interface ServerMessage {
//   type: string;
//   [key: string]: any;
// }

// export default function Home() {
//   const [loading, setLoading] = useState(true);
//   const SOCKET_PATH = "wss://neat-ray-relevant.ngrok-free.app"
//   const [places, setPlaces] = useState<Place[]>([]);
//   const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
//   const [chatResponse, setChatResponse] = useState<string>("");
//   const [chatHistory, setChatHistory] = useState<Message[]>([]);
//   const [isOpen, setIsOpen] = useState(false); 
//   const mapRef = useRef<any>(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [searchSessionId, setSearchSessionId] = useState<string>('')
//   const [userSessionId, setUserSessionId] = useState<string>('')
//   const socketRef = useRef<WebSocket | null>(null);

//   useEffect(() => {
//     if (socketRef.current) return;

//     const socket = new WebSocket(SOCKET_PATH);

//     socket.onopen = () => {
//       console.log("WebSocket connected");
//     };

//     socket.onmessage = (event) => {
//       console.log("onmessage", event)
//       const message: ServerMessage = JSON.parse(event.data)
//       try {
//         switch (message.type) {
//           case "userSessionCreated":
//             console.log("Created user", message.sessionId)
//             setUserSessionId(message.sessionId)
//             break;

//           case "searchSessionCreated":
//             const session = message.session
//             console.log('Created search session', session)
//             setSearchSessionId(session.id)
//             console.log("usersessionid", userSessionId, session.userSessionIds)
//             console.log("searchessionid", searchSessionId)
//             const col = session.userSessionIds.indexOf(userSessionId)
//             console.log("col", col)
//             setPlaces(session.places.map((place: any, index: number) => ({
//                 id: place.id,
//                 name: place.displayName,
//                 lat: place.location.latitude,
//                 lng: place.location.longitude,    
//                 type: place.primaryType,
//                 relevancy: session.relevanceMatrix[col][index],
//                 rating: place.rating,
//                 url: place.googleMapsUri, 
//                 websiteUrl: place.websiteUri
//             })))
//             setPlaces(places.sort((a, b) => a.relevancy - b.relevancy).slice(0, 3)); 
//             break;

//           case "searchSessionUpdated":
//             console.log(message)
//             break;
          
//           default:
//             console.log("Unrecognized message type", message)
//         }
        
//       } catch (error) {
//         console.error("Error parsing incoming message:", error);
//       } 
//     };

//     socket.onclose = () => {
//       console.log("WebSocket disconnected");
//       setIsConnected(false);
//       socketRef.current = null;
//     };

//     socket.onerror = (error) => {
//       console.error("WebSocket error:", error);
//     };

//     socketRef.current = socket;
//   }, [])

//     const sendMessage = (message: any) => {
//       if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//         socketRef.current.send(JSON.stringify(message));
//       } else {
//         console.warn("WebSocket not open. Cannot send message:", message);
//       }
//     }

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setLoading(false);
//     }, 2000);
//     return () => clearTimeout(timer);
//   }, []);

//   // Helper to get the current geolocation as a Promise.
//   const getCurrentPosition = (): Promise<{ latitude: number; longitude: number }> => {
//     return new Promise((resolve, reject) => {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) =>
//             resolve({
//               latitude: position.coords.latitude,
//               longitude: position.coords.longitude,
//             }),
//           (error) => reject(error)
//         );
//       } else {
//         reject(new Error("Geolocation is not supported by this browser."));
//       }
//     });
//   };

//   const handleExit = () => {
//       setIsOpen(!isOpen); 
//   }

//   const handleChatMessage = async (message: string) => {
//     setLoading(true);
//     setChatResponse("");
    
//     // Add user message to chat history
//     const userMessage: Message = { role: "user", content: message };
//     const updatedHistory = [...chatHistory, userMessage];
//     setChatHistory(updatedHistory);

//     try {
//       if (searchSessionId == '') {
//         console.log("Creating session")
//         sendMessage({
//           type: 'NEW_SEARCH_SESSION',
//           query: message
//         })
//       }
//         else {
//           console.log("Sending message")
//           sendMessage({
//             type: "ADJUST_SEARCH_SESSION",
//             searchSessionId,
//             prompt: message 
//           })
//         }
//     } catch (error) {
//       console.error("Error in handleChatMessage:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePlaceSelect = (place: Place) => {
//     setSelectedPlace(place);
//     if (mapRef.current) {
//       mapRef.current.flyTo(place);
//     }
//   };


//   return (
//     <main className="flex h-screen w-full overflow-hidden bg-slate-50">
//       <div className="w-4/5 h-full relative">
//         {loading && (
//           <div className="absolute inset-0 flex items-center justify-center bg-slate-50 bg-opacity-70 z-10">
//             <Loader className="h-8 w-8 animate-spin text-slate-700" />
//           </div>
//         )}
//         <MapComponent 
//           ref={mapRef} 
//           places={places} 
//           selectedPlace={selectedPlace} 
//         />
//       </div>
//       <div className="w-1/5 h-full border-l border-slate-200">
//         <ChatInterface
//           onSendMessage={handleChatMessage}
//           places={places}
//           onPlaceSelect={handlePlaceSelect}
//           selectedPlace={selectedPlace}
//           isLoading={loading}
//           chatResponse={chatResponse}
//           chatHistory={chatHistory} // Pass the chat history to the ChatInterface
//           handleExit={handleExit}
//         />
//       </div>
//       <PlacesModal places={places} isOpen={isOpen} onClose={handleExit} title="Journey Set!" description="Now... Where to?"/> 
//     </main>
//   );
// }