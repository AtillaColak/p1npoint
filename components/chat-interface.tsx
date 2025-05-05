"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, MapPin, CheckCircle } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { ScrollArea } from "~/components/ui/scroll-area"
import type { Place } from "~/lib/types"
import { useRouter } from "next/navigation"

// Define Message types
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UIMessage {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void
  places: Place[]
  onPlaceSelect: (place: Place) => void
  selectedPlace: Place | null
  isLoading: boolean
  chatResponse: string
  chatHistory: ChatMessage[] // Add the chat history prop
  handleExit: () => void
}

export default function ChatInterface({
  onSendMessage,
  places,
  onPlaceSelect,
  selectedPlace,
  isLoading,
  chatResponse,
  chatHistory,
  handleExit
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: "welcome",
      content:
        "Hello! I can help you find places. Try asking for restaurants, parks, or other locations.",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()


  // Sync chat history with UI messages
  useEffect(() => {
    if (chatHistory.length > 0) {
      // Convert chat history to UI messages format
      const historyMessages = chatHistory.map((msg, index) => ({
        id: `history-${index}`,
        content: msg.content,
        sender: msg.role as "user" | "assistant",
        timestamp: new Date(), // Since we don't have actual timestamps in the history
      }));
      
      // Only update if there's a change to avoid infinite loops
      if (historyMessages.length > messages.length - 1) { // -1 for welcome message
        // Keep the welcome message and add the history
        setMessages([messages[0], ...historyMessages]);
      }
    }
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Send the message to the parent component
    onSendMessage(input)
    setInput("")
    
    // No need to update messages here as they will come from chatHistory
  }

  // Update the last assistant message with streaming data if needed
  useEffect(() => {
    if (chatResponse !== "" && isLoading) {
      // Find the last assistant message or create a temporary one for streaming
      const lastAssistantIndex = [...messages].reverse().findIndex(
        msg => msg.sender === "assistant" && msg.id !== "welcome"
      );
      
      if (lastAssistantIndex !== -1) {
        // Update the last assistant message with the streaming content
        const actualIndex = messages.length - 1 - lastAssistantIndex;
        setMessages(prev => {
          const updated = [...prev];
          updated[actualIndex] = {
            ...updated[actualIndex],
            content: chatResponse
          };
          return updated;
        });
      } else {
        // Add a temporary streaming message if none exists
        const tempMessage: UIMessage = {
          id: `streaming-${Date.now()}`,
          content: chatResponse,
          sender: "assistant",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, tempMessage]);
      }
    }
  }, [chatResponse, isLoading]);

  // When places are received, add a results message if not already there
  useEffect(() => {
    if (places.length > 0) {
      // Check if we already have a results message to avoid duplicates
      const hasResultsMessage = messages.some(msg => 
        msg.content.includes(`I found ${places.length} places`) ||
        msg.content.includes("places that match your criteria")
      );
      
      if (!hasResultsMessage) {
        const resultsMessage: UIMessage = {
          id: `results-${Date.now()}`,
          content: `I found ${places.length} places that match your criteria:`,
          sender: "assistant",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, resultsMessage]);
      }
    }
  }, [places, messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
        <div className="flex flex-row">
        <div className="p-4 border-b flex-col border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 cursor-pointer" onClick={() => router.push('/')}>P!nPoint</h2>
            <p className="text-sm text-slate-500">Your Taste, Best Place</p>
        </div>
        <div className="flex items-center mr-4">
          <Button
            onClick={handleExit}
            className="bg-gradient-to-r from-gray-700 to-black hover:from-gray-900 hover:to-black transition-all duration-400 px-6 py-4 flex items-center"
          >
            <span>Finalize Selection</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.sender === "user"
                    ? "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {places.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg p-3 bg-slate-100 text-slate-800">
                <div className="space-y-2">
                  {places.map((place) => (
                    <div
                      key={place.id}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        selectedPlace?.id === place.id
                          ? "bg-slate-200"
                          : "hover:bg-slate-200"
                      }`}
                      onClick={() => onPlaceSelect(place)}
                    >
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mt-1 mr-2 flex-shrink-0 text-slate-500" />
                        <div>
                          <p className="font-medium text-sm">{place.name}</p>
                          <p className="text-xs text-slate-500">{place.type}</p>
                          {place.url && (
                            <p className="text-xs mt-1">
                              <a href={place.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
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

      <div className="p-4 border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Find me a place..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}