"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ShieldAlert, Phone, BookOpen, AlertTriangle } from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
  tips?: string[];
  contacts?: { name: string; number: string }[];
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "As-salamu alaykum! I am your Pak-Flood AI Assistant. What flood emergency or safety guidance can I provide?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: textToSend }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.reply,
            tips: data.safety_tips,
            contacts: data.emergency_contacts,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "I couldn't contact the emergency server. Please call Rescue 1122 immediately for urgent assistance.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "A connection error occurred. Keep safe and call Rescue 1122 or NDMA 1189 directly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSendMessage(undefined, q);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/35 transition-all transform hover:scale-105 active:scale-95"
          title="Open AI Disaster Assistant"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] text-white font-bold items-center justify-center">AI</span>
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[550px] rounded-2xl glass-panel border border-white/10 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-900/80 to-slate-900/80 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600/30 p-1.5 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-blue-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Disaster Assistant AI</h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Active Early Responder
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Log area */}
          <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-slate-800/80 text-slate-100 border border-white/5 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Optional Safety Tips Block */}
                {msg.tips && msg.tips.length > 0 && (
                  <div className="mt-2 w-[85%] bg-slate-900/50 border border-amber-500/10 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-bold text-amber-400 flex items-center">
                      <BookOpen className="h-3 w-3 mr-1" />
                      SURVIVAL INSTRUCTIONS
                    </span>
                    <ul className="list-disc pl-3 text-[10px] text-slate-300 space-y-1.5">
                      {msg.tips.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Optional Emergency Contacts Block */}
                {msg.contacts && msg.contacts.length > 0 && (
                  <div className="mt-2 w-[85%] bg-red-950/20 border border-red-500/20 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-bold text-red-400 flex items-center">
                      <Phone className="h-3 w-3 mr-1 animate-bounce" />
                      PAKISTAN HELPLINES
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {msg.contacts.map((c, idx) => (
                        <a
                          key={idx}
                          href={`tel:${c.number}`}
                          className="flex justify-between items-center text-[10px] bg-red-900/20 hover:bg-red-900/40 border border-red-500/10 rounded p-1.5 text-slate-200 transition-colors"
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="font-bold text-red-400">{c.number}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-600 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-gray-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 rounded-full bg-gray-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
          </div>

          {/* Quick Suggestion buttons */}
          <div className="px-4 py-2 border-t border-white/5 bg-slate-900/30 flex gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
            <button
              onClick={() => handleQuickQuestion("Rescue trapped families")}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-gray-300 px-2 py-1 rounded-full border border-white/5"
            >
              Trap Emergency
            </button>
            <button
              onClick={() => handleQuickQuestion("Evacuation safety rules")}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-gray-300 px-2 py-1 rounded-full border border-white/5"
            >
              Evacuate Safe Route
            </button>
            <button
              onClick={() => handleQuickQuestion("First aid during floods")}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-gray-300 px-2 py-1 rounded-full border border-white/5"
            >
              First Aid
            </button>
          </div>

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-slate-950/60 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask safety tips, report info..."
              className="flex-grow bg-slate-800/80 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              className="h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
