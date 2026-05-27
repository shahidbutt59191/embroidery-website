"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  MessageSquare, Send, Package, Headphones, Search,
  ArrowLeft, CheckCheck, Clock, Circle
} from "lucide-react";

interface Conversation {
  id: string;
  type: "order" | "support";
  title: string;
  subtitle: string;
  image: string | null;
  status?: string;
  unread: number;
  amount?: number;
  created_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  message_text: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  profiles?: { full_name: string; role: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_review: "bg-orange-100 text-orange-700",
  in_progress: "bg-purple-100 text-purple-700",
  delivered: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InboxClient({
  conversations: initialConvs,
  supportUnread,
  selectedConvId,
  userId,
  userName,
}: {
  conversations: Conversation[];
  supportUnread: number;
  selectedConvId: string | null;
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [conversations, setConversations] = useState(initialConvs);
  const [selectedId, setSelectedId] = useState<string | null>(selectedConvId);
  const [selectedType, setSelectedType] = useState<"order" | "support">(
    selectedConvId ? "order" : "support"
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 60);
  }, []);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (id: string | null, type: "order" | "support") => {
    setLoadingMsgs(true);
    setMessages([]);

    let query = supabase
      .from("chat_messages")
      .select("*, profiles!chat_messages_sender_id_fkey(full_name, role)")
      .order("created_at", { ascending: true });

    if (type === "order" && id) {
      query = query.eq("order_id", id);
    } else {
      query = query
        .is("order_id", null)
        .or(`sender_id.eq.${userId},customer_id.eq.${userId}`);
    }

    const { data } = await query;
    setMessages(data || []);
    setLoadingMsgs(false);
    scrollToBottom();

    // Mark as read
    if (type === "order" && id) {
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("order_id", id)
        .neq("sender_id", userId);
    }
  }, [userId, supabase, scrollToBottom]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId, selectedType);
    else if (selectedType === "support") loadMessages(null, "support");
  }, [selectedId, selectedType]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("inbox-messages")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
      }, (payload) => {
        const msg = payload.new as any;
        // Only add if it belongs to current conversation
        const isCurrentOrder = selectedType === "order" && msg.order_id === selectedId;
        const isCurrentSupport = selectedType === "support" && !msg.order_id &&
          (msg.sender_id === userId || msg.customer_id === userId);
        if (isCurrentOrder || isCurrentSupport) {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId, selectedType, userId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");

    await supabase.from("chat_messages").insert({
      sender_id: userId,
      customer_id: userId,
      order_id: selectedType === "order" ? selectedId : null,
      message_text: text,
    });

    setSending(false);
    inputRef.current?.focus();
    scrollToBottom();
  };

  const selectConversation = (id: string | null, type: "order" | "support") => {
    setSelectedId(id);
    setSelectedType(type);
    setMobileView("chat");
  };

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-border sticky top-0 z-10 px-4 h-14 flex items-center gap-4">
        {mobileView === "chat" && (
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-accent"
            onClick={() => setMobileView("list")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="font-bold text-lg text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Inbox
        </h1>
        {mobileView === "list" && (
          <span className="ml-auto text-xs text-muted-foreground">
            {conversations.reduce((a, c) => a + c.unread, 0) + supportUnread > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {conversations.reduce((a, c) => a + c.unread, 0) + supportUnread} unread
              </span>
            )}
          </span>
        )}
      </div>

      <div className="max-w-6xl mx-auto flex h-[calc(100vh-3.5rem)] overflow-hidden">

        {/* ── Conversation List ── */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-border flex flex-col ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>

          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Support Chat entry */}
            <div
              onClick={() => selectConversation(null, "support")}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-border/50 ${
                selectedType === "support" && !selectedId
                  ? "bg-primary/8 border-l-[3px] border-l-primary"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-foreground">Support Chat</p>
                  {supportUnread > 0 && (
                    <span className="bg-secondary text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                      {supportUnread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  General questions & support
                </p>
              </div>
            </div>

            {/* Section label */}
            {filteredConvs.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 border-b border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> Order Messages ({filteredConvs.length})
                </p>
              </div>
            )}

            {/* Order conversations */}
            {filteredConvs.length === 0 && search && (
              <div className="p-8 text-center text-muted-foreground text-sm">No conversations found.</div>
            )}
            {filteredConvs.length === 0 && !search && (
              <div className="p-10 text-center">
                <Package className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No orders yet.</p>
                <Link href="/#services" className="text-primary text-xs font-semibold hover:underline mt-1 inline-block">
                  Browse services →
                </Link>
              </div>
            )}

            {filteredConvs.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id, "order")}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-border/40 ${
                  selectedId === conv.id && selectedType === "order"
                    ? "bg-primary/8 border-l-[3px] border-l-primary"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-accent">
                  {conv.image ? (
                    <img src={conv.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-sm text-foreground truncate">{conv.title}</p>
                    {conv.unread > 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${STATUS_COLORS[conv.status ?? "pending"] ?? ""}`}>
                      {conv.status?.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">#{conv.id.split("-")[0].toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat Window ── */}
        <div className={`flex-1 flex flex-col bg-white ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>

          {/* Chat header */}
          {(selectedId || selectedType === "support") ? (
            <>
              <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 bg-white shadow-sm">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-accent flex-shrink-0 flex items-center justify-center">
                  {selectedType === "support" ? (
                    <Headphones className="w-5 h-5 text-secondary" />
                  ) : selectedConv?.image ? (
                    <img src={selectedConv.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {selectedType === "support" ? "Support Chat" : selectedConv?.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    StitchMarket Team · Usually replies within 1 hour
                  </p>
                </div>
                {selectedType === "order" && selectedConv && (
                  <Link
                    href={`/orders/${selectedConv.id}`}
                    className="ml-auto text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    View Order →
                  </Link>
                )}
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
                {loadingMsgs && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!loadingMsgs && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="w-16 h-16 bg-primary/8 rounded-2xl flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="font-semibold text-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Send a message to start the conversation</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.sender_id === userId;
                  const isAdmin = msg.profiles?.role === "admin";
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 mt-auto">
                          SM
                        </div>
                      )}
                      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        {!isMe && (
                          <span className="text-[10px] font-semibold text-muted-foreground ml-1">
                            {msg.profiles?.full_name || "StitchMarket"}
                          </span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-white text-foreground rounded-bl-sm border border-border shadow-sm"
                        }`}>
                          {msg.message_text && <p>{msg.message_text}</p>}
                          {msg.attachment_url && (
                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-2 text-xs mt-1 underline ${isMe ? "text-white/80" : "text-primary"}`}>
                              📎 Attachment
                            </a>
                          )}
                        </div>
                        <span className={`text-[10px] text-muted-foreground flex items-center gap-1 ${isMe ? "justify-end" : ""}`}>
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(msg.created_at)}
                          {isMe && <CheckCheck className="w-3 h-3 text-primary/60" />}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-white">
                <div className="flex items-end gap-3 bg-slate-50 border border-border rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none py-1 max-h-32"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
                  >
                    {sending
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                  Our team typically responds within 1 hour during business hours
                </p>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50">
              <div className="w-24 h-24 bg-white rounded-3xl border-2 border-dashed border-border flex items-center justify-center mb-6 shadow-sm">
                <MessageSquare className="w-10 h-10 text-primary/30" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Your Inbox</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Select a conversation from the left to start messaging. Support Chat is always available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
