"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2 } from "lucide-react";

export default function OrderChat({ orderId, currentUserId }: { orderId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // 1. Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select(`*, profiles(full_name, role)`)
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      
      if (data) setMessages(data);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel(`chat_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`
        },
        async (payload) => {
          // Fetch the profile for the new message to get the sender's name/role
          const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', payload.new.sender_id).single();
          const enrichedMessage = { ...payload.new, profiles: profile };
          
          setMessages(prev => [...prev, enrichedMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const { error } = await supabase.from("chat_messages").insert([
      {
        order_id: orderId,
        sender_id: currentUserId,
        message_text: newMessage.trim(),
      }
    ]);

    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border flex flex-col h-[600px] overflow-hidden">
      <div className="p-4 border-b border-border bg-accent/10">
        <h2 className="font-semibold font-outfit text-primary text-lg">Order Chat</h2>
        <p className="text-xs text-muted-foreground">Real-time messaging with your digitizer.</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground mt-10">
            No messages yet. Send a message to start!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const isAdmin = msg.profiles?.role === 'admin';
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-xs text-muted-foreground mb-1 ml-1 mr-1">
                  {isAdmin ? 'Digitizer (Admin)' : msg.profiles?.full_name || 'Customer'}
                </div>
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                  isMe ? 'bg-primary text-white rounded-br-sm' : 
                  isAdmin ? 'bg-secondary/20 text-foreground border border-secondary/30 rounded-bl-sm' :
                  'bg-accent text-foreground rounded-bl-sm'
                }`}>
                  {msg.message_text}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-accent/5 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
        />
        <button 
          type="submit" 
          disabled={sending || !newMessage.trim()}
          className="bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center w-10 h-10"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
