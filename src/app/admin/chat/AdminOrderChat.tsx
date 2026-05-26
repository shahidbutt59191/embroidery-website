"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, Circle } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  profiles?: { full_name: string; role: string } | null;
}

export default function AdminOrderChat({ orderId, adminId, customerName }: { orderId: string; adminId: string; customerName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 80);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setMessages([]);

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*, profiles(full_name, role)")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data as Message[]);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    const channel = supabase
      .channel(`admin_chat_${orderId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `order_id=eq.${orderId}`,
      }, async (payload) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", payload.new.sender_id)
          .single();

        const enriched = { ...payload.new, profiles: profile } as Message;
        setMessages((prev) => {
          if (prev.find((m) => m.id === enriched.id)) return prev;
          return [...prev, enriched];
        });
        scrollToBottom();
      })
      .subscribe((status) => setIsOnline(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !orderId) return;

    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert([{
      order_id: orderId,
      sender_id: adminId,
      message_text: text,
    }]);

    if (error) setNewMessage(text);
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!orderId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Send className="w-12 h-12 opacity-20" />
        <p className="font-medium">Select an order to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="font-bold text-foreground">{customerName}</p>
          <p className="text-xs text-muted-foreground">Order #{orderId.split("-")[0]}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Circle className={`w-2 h-2 fill-current ${isOnline ? "text-green-500" : "text-gray-300"}`} />
          <span className={isOnline ? "text-green-600 font-medium" : "text-muted-foreground"}>
            {isOnline ? "Live" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-medium">No messages yet.</p>
            <p className="text-sm mt-1">Send a message to the customer.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender_id === adminId;
            const isCustomer = !isAdmin;
            return (
              <div key={msg.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                {isCustomer && (
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 ml-1">
                    {msg.profiles?.full_name || "Customer"}
                  </span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl max-w-[82%] text-sm leading-relaxed shadow-sm ${
                  isAdmin
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-accent text-foreground rounded-bl-sm border border-border"
                }`}>
                  {msg.message_text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-border bg-accent/5 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Reply to ${customerName}...`}
            className="flex-1 px-4 py-2.5 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-primary text-white w-10 h-10 rounded-full hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
