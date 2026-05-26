"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare, X, Send, Loader2, LogIn, UserPlus,
  ChevronDown, Circle, Minimize2
} from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

interface Message {
  id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
  profiles?: { full_name: string; role: string } | null;
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 80);
  }, []);

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch messages and subscribe when user is logged in
  useEffect(() => {
    if (!user) { setMessages([]); setUnreadCount(0); return; }

    setLoading(true);

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*, profiles(full_name, role)")
        .is("order_id", null)
        .eq("sender_id", user.id)
        .order("created_at", { ascending: true });

      // Also fetch admin replies (where sender is admin, targeting this user's thread)
      const { data: adminReplies } = await supabase
        .from("chat_messages")
        .select("*, profiles(full_name, role)")
        .is("order_id", null)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: true });

      const allMessages = [...(data || []), ...(adminReplies || [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Deduplicate
      const seen = new Set();
      const unique = allMessages.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      setMessages(unique as Message[]);
      setLoading(false);

      if (!isOpen) {
        const unread = unique.filter(
          (m) => m.sender_id !== user.id && !(m as any).is_read
        ).length;
        setUnreadCount(unread);
      }

      scrollToBottom();
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`support_chat_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `customer_id=eq.${user.id}`,
      }, async (payload) => {
        if (payload.new.order_id !== null) return; // Only support messages
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

        if (!isOpen) setUnreadCount((c) => c + 1);
        scrollToBottom();
      })
      .subscribe((status) => setIsOnline(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Clear unread when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert([{
      order_id: null,
      customer_id: user.id,
      sender_id: user.id,
      message_text: text,
    }]);

    if (error) setNewMessage(text);
    setSending(false);
    inputRef.current?.focus();
    scrollToBottom();
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (authLoading) return null;

  return (
    <>
      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] bg-white rounded-2xl shadow-2xl border border-border flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ height: "480px" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-t-2xl px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Support Chat</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle className={`w-1.5 h-1.5 fill-current ${isOnline ? "text-green-400" : "text-white/40"}`} />
                <p className="text-white/70 text-xs">
                  {user ? (isOnline ? "Connected · We reply fast" : "Connecting...") : "StitchMarket Support"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {!user ? (
          /* Not logged in — CTA */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">Chat with us!</h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Sign in to your account to chat with our support team and get help with your orders.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 bg-accent text-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-accent/80 transition-colors border border-border"
              >
                <UserPlus className="w-4 h-4" /> Create Account
              </Link>
            </div>
          </div>
        ) : (
          /* Logged in — Chat interface */
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" ref={scrollRef}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                  <p className="font-semibold text-sm">Start the conversation</p>
                  <p className="text-xs mt-1 opacity-70">Ask us anything about your orders or our services.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && (
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1 ml-1">
                          Support
                        </span>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                        isMe
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
            <form onSubmit={handleSend} className="px-3 py-3 border-t border-border bg-accent/5 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-primary text-white w-9 h-9 rounded-full hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0 shadow-sm"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Open support chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
