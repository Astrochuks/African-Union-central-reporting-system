"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendChatMessage } from "@/lib/api/chat";
import type { ChatMessage, ChatResponse } from "@/lib/types/api";

const SUGGESTED_QUESTIONS = [
  "What is the continental average for women in parliament?",
  "Which countries have youth unemployment above 30%?",
  "Show me Rwanda's Agenda 2063 scorecard",
  "What are the current critical alerts?",
  "Compare Nigeria, South Africa, and Kenya on GDP",
  "What does the data quality look like across member states?",
  "Which region is leading on gender parity?",
  "What are the key recommendations from the insights engine?",
];

interface DisplayMessage extends ChatMessage {
  suggested_follow_ups?: string[];
  error?: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-au-dark flex items-center justify-center">
        <Bot className="h-4 w-4 text-au-gold" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-sm">
        <span className="w-2 h-2 bg-au-gold rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-au-gold rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-au-gold rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

function DataCard({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-3 py-1.5 bg-au-dark/5 border-b border-gray-200">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-au-dark/60">Data</p>
      </div>
      <div className="divide-y divide-gray-100">
        {entries.slice(0, 10).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between px-3 py-1.5 text-xs">
            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
            <span className="font-medium text-au-dark">
              {typeof value === "number"
                ? value.toLocaleString()
                : typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = useCallback(
    async (messageText?: string) => {
      const text = messageText || input.trim();
      if (!text || isLoading) return;

      const userMessage: DisplayMessage = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      // Build history for the API (exclude UI-only fields)
      const history = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response: ChatResponse = await sendChatMessage(text, history);
        const assistantMessage: DisplayMessage = {
          role: "assistant",
          content: response.response,
          data: response.data,
          suggested_follow_ups: response.suggested_follow_ups,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: DisplayMessage = {
          role: "assistant",
          content:
            "I apologize, but I was unable to process your request at this time. The AI assistant service may be temporarily unavailable. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          error: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 88px)" }}>
      {/* Chat Area */}
      <div className="flex-1 min-h-0">
        {isEmpty ? (
          /* Empty State with Suggestions */
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-au-dark/5 mb-4">
                <Sparkles className="h-8 w-8 text-au-gold" />
              </div>
              <h3 className="text-xl font-semibold text-au-dark">AU Data Intelligence Assistant</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Ask questions about Agenda 2063 progress, gender parity, youth employment, and data across all 55 AU
                member states.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl w-full">
              {SUGGESTED_QUESTIONS.map((question, idx) => (
                <Card
                  key={idx}
                  className="p-3 cursor-pointer hover:border-au-gold hover:shadow-md transition-all group"
                  onClick={() => handleSend(question)}
                >
                  <p className="text-xs text-muted-foreground group-hover:text-au-dark transition-colors leading-relaxed">
                    {question}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 py-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-au-dark flex items-center justify-center mt-1">
                      <Bot className="h-4 w-4 text-au-gold" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                    <div
                      className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-au-green/10 text-au-dark rounded-2xl rounded-tr-sm"
                          : msg.error
                            ? "bg-red-50 text-red-800 rounded-2xl rounded-tl-sm border border-red-200"
                            : "bg-gray-50 text-au-dark rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      {msg.error && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-[10px] font-semibold uppercase text-red-500">Connection Error</span>
                        </div>
                      )}
                      {msg.content}
                    </div>
                    {msg.data && Object.keys(msg.data).length > 0 && <DataCard data={msg.data} />}
                    {msg.suggested_follow_ups && msg.suggested_follow_ups.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.suggested_follow_ups.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleSend(q)}
                            className="text-[11px] px-2.5 py-1 bg-au-gold/10 text-au-dark border border-au-gold/30 rounded-full hover:bg-au-gold/20 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-au-green flex items-center justify-center mt-1">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about AU data, Agenda 2063 goals, gender metrics, or any indicator..."
                className="min-h-[44px] max-h-[120px] resize-none pr-4 text-sm border-gray-300 focus:border-au-gold focus:ring-au-gold/20"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="h-11 w-11 flex-shrink-0 bg-au-green hover:bg-au-green/90 text-white"
              size="icon"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            AI responses are generated from AU development data. Always verify critical figures with official sources.
          </p>
        </div>
      </div>
    </div>
  );
}
