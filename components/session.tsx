"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, MapPin } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { ScrollArea } from "~/components/ui/scroll-area"
import type { Place } from "~/lib/types"
import Link from "next/link"
import { Map as MapIcon, X as CloseIcon } from "lucide-react";
import { Preloaded, useMutation, usePreloadedQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { useRouter } from "next/navigation";


interface ChatInterfaceProps {
  places: Place[]
  onPlaceSelect: (place: Place) => void
  selectedPlace: Place | null
  isMapVisible: boolean
  handleExit: () => void
  handleMapToggle?: () => void
  chatSession: Preloaded<typeof api.myFunctions.getSession>;
  chatMessages: Preloaded<typeof api.myFunctions.getMessages>;
}

export default function SessionPage({
  places,
  onPlaceSelect,
  selectedPlace,
  isMapVisible,
  handleExit,
  handleMapToggle,
  chatSession,
  chatMessages
}: ChatInterfaceProps) {
  const session = usePreloadedQuery(chatSession);
  const messages = usePreloadedQuery(chatMessages);
  const username = sessionStorage.getItem("username");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const sendMessage = useMutation(api.myFunctions.sendMessage);

  const handleSubmit = () => {
    if (input.trim() === "") return;

    setIsLoading(true);
    sendMessage({ content: input, author: username!, sessionId: session._id })
      .then(() => {
        setInput("");
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!username) {
      router.push("/");
    }
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, places])

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-slate-800 cursor-pointer" onClick={() => router.push("/")}>
            P!nPoint
          </h2>
        </div>
        <button
          onClick={handleMapToggle}
          className="flex items-center gap-1 rounded-xl bg-blue-600 p-3 text-white shadow-lg lg:hidden cursor-pointer z-30"
        >
          {isMapVisible ? <CloseIcon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {isMapVisible ? "Close map" : "Open map"}
          </span>
        </button>

        <Button
          onClick={handleExit}
          className="bg-gradient-to-r from-gray-700 to-black hover:from-gray-900 hover:to-black transition-all duration-300 px-3 sm:px-6 py-2 cursor-pointer"
        >
          <Link href={"../events/1"} className="flex items-center">
            <span className="hidden sm:inline">Finalize Selection</span>
            <span className="sm:hidden">Finalize</span>
          </Link>
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={messagesEndRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div key={message._id} className={`flex ${message.author === username ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-lg p-3 ${
                  message.author === username ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message._creationTime}
                </p>
              </div>
            </div>
          ))}

          {/* Places Results */}
          {places.length > 0 && (
            <div className="flex justify-start w-full">
              <div className="w-full max-w-[85%] md:max-w-[75%] rounded-lg p-3 bg-slate-100 text-slate-800">
                <div className="space-y-2">
                  {places.map((place) => (
                    <div
                      key={place.id}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        selectedPlace?.id === place.id ? "bg-slate-200 border border-slate-300" : "hover:bg-slate-200"
                      }`}
                      onClick={() => onPlaceSelect(place)}
                    >
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mt-1 mr-2 flex-shrink-0 text-slate-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{place.name}</p>
                          <p className="text-xs text-slate-500 truncate">{place.type}</p>
                          {place.url && (
                            <p className="text-xs mt-1">
                              <a
                                href={place.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View details
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }
        } className="flex items-center gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Find me a place..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading} className="bg-slate-700 hover:bg-slate-800 cursor-pointer">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
