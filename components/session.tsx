"use client";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Preloaded, useMutation, usePreloadedQuery } from "convex/react";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "~/convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Props {
  session: Preloaded<typeof api.myFunctions.getSession>;
  messages: Preloaded<typeof api.myFunctions.getMessages>;
}

export default function SessionPage(props: Props) {
  const session = usePreloadedQuery(props.session);
  const messages = usePreloadedQuery(props.messages);
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Session Users:</h2>
        <ul>
          {session.users.map((user) => (
            <li key={user}>
              {session.owner === user ? (
                <span className="font-bold">{user} (Owner)</span>
              ) : (
                user
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-row">
        <div className="p-4 border-b flex-col border-slate-200">
          <h2
            className="text-xl font-bold text-slate-800 cursor-pointer"
            onClick={() => router.push("/")}
          >
            P!nPoint
          </h2>
          <p className="text-sm text-slate-500">Your Taste, Best Place</p>
        </div>
        <div className="flex items-center mr-4">
          <Button
            onClick={() => router.push("/")}
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
              key={message._id}
              className={`flex ${
                message.author === username ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.author === username
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {message.author === username ? (
                  <p className="text-xs opacity-70">You</p>
                ) : (
                  <p className="text-xs opacity-70">{message.author}</p>
                )}
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2"
        >
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
  );
}
