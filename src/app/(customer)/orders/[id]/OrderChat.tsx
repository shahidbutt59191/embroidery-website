"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, Circle, Paperclip, FileText, X, ZoomIn } from "lucide-react";
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
  is_read: boolean;
  profiles?: { full_name: string; role: string } | null;
}

export default function OrderChat({ orderId, currentUserId }: { orderId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string; type: "image" | "file" } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

    // Mark as read
    supabase.from("chat_messages")
      .update({ is_read: true })
      .eq("order_id", orderId)
      .neq("sender_id", currentUserId)
      .then(() => {});

    // Real-time
    const channel = supabase
      .channel(`chat_room_${orderId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `order_id=eq.${orderId}`,
      }, async (payload: any) => {
        const { data: profile } = await supabase
          .from("profiles").select("full_name, role").eq("id", payload.new.sender_id).single();

        const enriched = { ...payload.new, profiles: profile } as Message;
        setMessages((prev) => {
          if (prev.find((m) => m.id === enriched.id)) return prev;
          return [...prev, enriched];
        });
        scrollToBottom();
        if (payload.new.sender_id !== currentUserId) {
          supabase.from("chat_messages").update({ is_read: true }).eq("id", payload.new.id).then(() => {});
        }
      })
      .subscribe((status) => setIsOnline(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [orderId, currentUserId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImg = file.type.startsWith("image/");
    setPendingFile({ file, preview: isImg ? URL.createObjectURL(file) : "", type: isImg ? "image" : "file" });
    e.target.value = "";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || uploading) return;
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
      order_id: orderId,
      sender_id: currentUserId,
      message_text: text || null,
      attachment_url,
      attachment_type,
      attachment_name,
    }]);

    if (error && text) setNewMessage(text);
    setSending(false);
    inputRef.current?.focus();
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

  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== date) grouped.push({ date, msgs: [msg] });
    else last.msgs.push(msg);
  });

  return (
    <>
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />

      <div className="bg-white rounded-2xl shadow-sm border border-border flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5 flex items-center justify-between flex-shrink-0">
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
                        <div className={`max-w-[82%] rounded-2xl shadow-sm overflow-hidden text-sm ${
                          isMe
                            ? "bg-primary text-white rounded-br-sm"
                            : isAdmin
                            ? "bg-gradient-to-br from-secondary/15 to-secondary/5 text-foreground border border-secondary/20 rounded-bl-sm"
                            : "bg-accent text-foreground rounded-bl-sm border border-border"
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
                                className="w-full max-h-52 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                              </div>
                            </button>
                          )}
                          {/* File attachment */}
                          {msg.attachment_url && msg.attachment_type === "file" && (
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 px-3.5 py-3 hover:opacity-80 transition-opacity ${isMe ? "text-white" : "text-foreground"}`}
                            >
                              <FileText className="w-5 h-5 flex-shrink-0" />
                              <span className="text-xs font-medium truncate">{msg.attachment_name || "Download File"}</span>
                            </a>
                          )}
                          {/* Text */}
                          {msg.message_text && (
                            <p className="px-4 py-2.5 leading-relaxed">{msg.message_text}</p>
                          )}
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

        {/* Pending file preview */}
        {pendingFile && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-accent/50 rounded-xl p-2 border border-border">
              {pendingFile.type === "image" ? (
                <img src={pendingFile.preview} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              )}
              <span className="text-xs font-medium flex-1 truncate">{pendingFile.file.name}</span>
              <button
                onClick={() => { if (pendingFile.preview) URL.revokeObjectURL(pendingFile.preview); setPendingFile(null); }}
                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-border bg-accent/5 flex-shrink-0">
          <div className="flex gap-2 items-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.dst,.emb,.pes,.jef,.vip,.hus,.exp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-accent flex-shrink-0"
              title="Attach image or file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
              placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
              className="flex-1 px-4 py-2.5 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 text-sm transition-all"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={(sending || uploading) || (!newMessage.trim() && !pendingFile)}
              className="bg-primary text-white w-10 h-10 rounded-full hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center justify-center flex-shrink-0 shadow-sm"
            >
              {sending || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
