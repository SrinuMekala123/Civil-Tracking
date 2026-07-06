"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Sparkles } from "lucide-react";

const rooResponses = [
  "Namaste! I can help you track meetings, officers, and administrative updates. What would you like to know?",
  "I found 12 upcoming meetings this week. Would you like me to show the schedule?",
  "Based on the latest data, the meeting completion rate is at 75%, up 2% from last month!",
  "There are 3 officers currently on leave in your database. Would you like details?",
  "I can help you generate reports, search records, or analyze meeting trends. Just ask!",
];

export function RoboAssistant() {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "नमस्ते! I'm Civil AI, your companion for smarter governance. How can I assist you today?", isUser: false },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { text: input, isUser: true }];
    setMessages(newMessages);
    setInput("");
    setTimeout(() => {
      const randomResponse = rooResponses[Math.floor(Math.random() * rooResponses.length)];
      setMessages([...newMessages, { text: randomResponse, isUser: false }]);
    }, 800);
  };

  return (
    <Card className="glass-card border-0 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg animate-pulse">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-800" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Civil AI</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your AI companion for smarter governance</p>
          </div>
        </div>

        <div className="h-64 overflow-y-auto space-y-3 mb-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-3 rounded-xl text-sm ${
                  msg.isUser
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md"
                    : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask Civil AI anything..."
            className="flex-1 bg-white/60 dark:bg-slate-800/60"
          />
          <Button onClick={sendMessage} className="gradient-button shadow-lg">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-3 text-center">
          <Button variant="link" className="text-xs text-slate-400">
            <Sparkles className="w-3 h-3 mr-1" /> Try asking about meetings, officers, or reports
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
