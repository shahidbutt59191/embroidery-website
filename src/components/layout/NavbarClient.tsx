"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare } from "lucide-react";
import NotificationBell from "@/components/ui/NotificationBell";
import LogoutButton from "@/components/layout/LogoutButton";

export default function NavbarClient() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [inboxUnread, setInboxUnread] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      // Fetch unread inbox count
      supabase
        .from("chat_messages")
        .select("id", { count: "exact" })
        .eq("customer_id", user.id)
        .neq("sender_id", user.id)
        .eq("is_read", false)
        .then(({ count }) => setInboxUnread(count || 0));
    });
  }, []);

  if (!userId) return null;

  return (
    <div className="flex items-center gap-1">
      {/* Inbox */}
      <Link
        href="/inbox"
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title="Inbox"
      >
        <MessageSquare className="w-5 h-5" />
        {inboxUnread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
            {inboxUnread > 9 ? "9+" : inboxUnread}
          </span>
        )}
      </Link>

      {/* Notifications */}
      <NotificationBell userId={userId} variant="light" />

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* Dashboard + Logout */}
      <Link href="/dashboard" className="text-sm font-medium hover:text-secondary transition-colors px-2">
        Dashboard
      </Link>
      <LogoutButton />
    </div>
  );
}
