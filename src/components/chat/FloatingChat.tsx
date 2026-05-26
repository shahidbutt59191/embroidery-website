"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, X, Send, Loader2, LogIn, UserPlus, Circle, Paperclip, Image as ImageIcon, FileText, ZoomIn } from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import ImagePreviewModal from "@/components/ui/ImagePreviewModal";

interface Message {
  id: string;
  sender_id: string;
  message_text: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
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
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string; type: "image" | "file" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 80);
  }, []);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch + subscribe to support messages
  useEffect(() => {
    if (!user) { setMessages([]); setUnreadCount(0); return; }
    setLoading(true);

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*, profiles(full_name, role)")
        .is("order_id", null)
        .or(`sender_id.eq.${user.id},customer_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
        const unread = (data as Message[]).filter(
          (m) => m.sender_id !== user.id
        ).length;
        if (!isOpen) setUnreadCount(unread);
      }
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Real-time: listen for new messages in this customer's support thread
    const channel = supabase
      .channel(`float_support_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `customer_id=eq.${user.id}`,
      }, async (payload: any) => {
        if (payload.new.order_id !== null) return;
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

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImg = file.type.startsWith("image/");
    const preview = isImg ? URL.createObjectURL(file) : "";
    setPendingFile({ file, preview, type: isImg ? "image" : "file" });
    e.target.value = "";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (sending || uploading)) return;
    if (!newMessage.trim() && !pendingFile) return;

    setSending(true);
    let attachment_url: string | null = null;
    let attachment_type: string | null = null;
    let attachment_name: string | null = null;

    if (pendingFile) {
      setUploading(true);
      const result = await uploadToCloudinary(pendingFile.file);
      setUploading(false);
      if (result) {
        attachment_url = result.url;
        attachment_type = result.type;
        attachment_name = result.name;
      }
      if (pendingFile.preview) URL.revokeObjectURL(pendingFile.preview);
      setPendingFile(null);
    }

    const text = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert([{
      order_id: null,
      customer_id: user.id,
      sender_id: user.id,
      message_text: text || null,
      attachment_url,
      attachment_type,
      attachment_name,
    }]);

    if (error) {
      console.error("Send error:", error.message);
      if (text) setNewMessage(text);
    }

    setSending(false);
    scrollToBottom();
    inputRef.current?.focus();
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (authLoading) return null;

  return (
    <>
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] bg-white rounded-2xl shadow-2xl border border-border flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ height: "480px" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-t-2xl px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Support Chat</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle className={`w-1.5 h-1.5 fill-current ${isOnline && user ? "text-green-400" : "text-white/30"}`} />
                <p className="text-white/70 text-xs">
                  {user ? (isOnline ? "Online · Fast replies" : "Connecting...") : "StitchMarket Support"}
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          /* Not logged in */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">Chat with us!</h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Sign in to chat with our support team and get help with your embroidery orders.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link href="/login" onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
              <Link href="/register" onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 bg-accent text-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-accent/80 transition-colors border border-border">
                <UserPlus className="w-4 h-4" /> Create Account
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" ref={scrollRef}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                  <p className="font-semibold text-sm">How can we help?</p>
                  <p className="text-xs mt-1 opacity-70">Ask about your order or services.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && (
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1 ml-1">Support</span>
                      )}
                      <div className={`max-w-[85%] rounded-2xl text-sm shadow-sm overflow-hidden ${
                        isMe ? "bg-primary text-white rounded-br-sm" : "bg-accent text-foreground rounded-bl-sm border border-border"
                      }`}>
                        {/* Image attachment */}
                        {msg.attachment_url && msg.attachment_type === "image" && (
                          <button
                            onClick={() => setPreviewSrc(msg.attachment_url)}
                            className="block w-full relative group"
                          >
                            <img
                              src={msg.attachment_url}
                              alt={msg.attachment_name || "Image"}
                              className="w-full max-h-40 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        )}
                        {/* File attachment */}
                        {msg.attachment_url && msg.attachment_type === "file" && (
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-2 px-3 py-2.5 hover:opacity-80 transition-opacity ${isMe ? "text-white" : "text-foreground"}`}
                          >
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs font-medium truncate">{msg.attachment_name || "File"}</span>
                          </a>
                        )}
                        {/* Text */}
                        {msg.message_text && (
                          <p className="px-3.5 py-2.5 leading-relaxed">{msg.message_text}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pending file preview */}
            {pendingFile && (
              <div className="px-3 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2 bg-accent/50 rounded-xl p-2 border border-border">
                  {pendingFile.type === "image" ? (
                    <img src={pendingFile.preview} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground flex-1 truncate">{pendingFile.file.name}</span>
                  <button onClick={() => { if (pendingFile.preview) URL.revokeObjectURL(pendingFile.preview); setPendingFile(null); }}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="px-3 py-3 border-t border-border bg-accent/5 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <input ref={fileRef} type="file" accept="image/*,.pdf,.dst,.emb,.pes,.jef,.vip,.hus,.exp" className="hidden" onChange={handleFileSelect} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-full hover:bg-accent flex-shrink-0"
                  title="Attach file or image"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                  placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
                  className="flex-1 px-3.5 py-2 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={(sending || uploading) || (!newMessage.trim() && !pendingFile)}
                  className="bg-primary text-white w-9 h-9 rounded-full hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                >
                  {sending || uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </button>
    </>
  );
}
