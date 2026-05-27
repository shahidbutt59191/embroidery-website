"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, MessageSquare, Package, CheckCheck, X } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  new_message: <MessageSquare className="w-4 h-4 text-blue-500" />,
  new_order: <Package className="w-4 h-4 text-green-500" />,
  order_status: <CheckCheck className="w-4 h-4 text-purple-500" />,
  support_reply: <MessageSquare className="w-4 h-4 text-secondary" />,
};

const TYPE_BG: Record<string, string> = {
  new_message: "bg-blue-50",
  new_order: "bg-green-50",
  order_status: "bg-purple-50",
  support_reply: "bg-secondary/10",
};

export default function NotificationBell({
  userId,
  variant = "light",
}: {
  userId: string;
  variant?: "light" | "dark";
}) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const iconClass = variant === "dark"
    ? "text-white/70 hover:text-white"
    : "text-muted-foreground hover:text-foreground";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        className={`relative p-2 rounded-xl transition-colors ${iconClass} hover:bg-white/10`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-border z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-foreground">Notifications</span>
              {unread > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 && (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; setOpen(false); }}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  n.is_read ? "hover:bg-slate-50" : "bg-blue-50/40 hover:bg-blue-50"
                }`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_BG[n.type] || "bg-slate-100"}`}>
                  {TYPE_ICON[n.type] || <Bell className="w-4 h-4 text-slate-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.is_read ? "text-foreground/80" : "text-foreground font-semibold"}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                </div>

                {!n.is_read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
