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

export default function OrderChat({ orderId, currentUserId }: { orderId: string; currentUserId: string }) {
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
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 80);
  }, []);

  useEffect(() => {
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

    // Mark messages as read
    supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("order_id", orderId)
      .neq("sender_id", currentUserId)
      .then(() => {});

    // Realtime subscription
    const channel = supabase
      .channel(`chat_room_${orderId}`)
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

        // Auto-mark as read if from other person
        if (payload.new.sender_id !== currentUserId) {
          supabase.from("chat_messages").update({ is_read: true }).eq("id", payload.new.id).then(() => {});
        }
      })
      .subscribe((status) => {
        setIsOnline(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, currentUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert([{
      order_id: orderId,
      sender_id: currentUserId,
      message_text: text,
    }]);

    if (error) {
      setNewMessage(text); // restore on error
    }
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

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== date) grouped.push({ date, msgs: [msg] });
    else last.msgs.push(msg);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5 flex items-center justify-between">
        <div>
          <h2 className="font-bold font-outfit text-primary text-base">Order Chat</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Direct line with your digitizer</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Circle className={`w-2 h-2 fill-current ${isOnline ? "text-green-500" : "text-gray-300"}`} />
          <span className={isOnline ? "text-green-600 font-medium" : "text-muted-foreground"}>
            {isOnline ? "Live" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-0.5">Start the conversation below!</p>
            </div>
          </div>
        ) : (
          grouped.map(({ date, msgs }) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium px-2">{date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                {msgs.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  const isAdmin = msg.profiles?.role === "admin";
                  const senderName = isAdmin ? "Digitizer" : (msg.profiles?.full_name || "Customer");

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && (
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 ml-1">
                          {senderName}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl max-w-[82%] text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-primary text-white rounded-br-sm"
                            : isAdmin
                            ? "bg-gradient-to-br from-secondary/15 to-secondary/5 text-foreground border border-secondary/20 rounded-bl-sm"
                            : "bg-accent text-foreground rounded-bl-sm"
                        }`}
                      >
                        {msg.message_text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-border bg-accent/5">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 text-sm transition-all"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-primary text-white w-10 h-10 rounded-full hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
