"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/ui/NotificationBell";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default function AdminTopBar() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      // Count all unread messages from customers
      supabase
        .from("chat_messages")
        .select("id", { count: "exact" })
        .neq("sender_id", user.id)
        .eq("is_read", false)
        .then(({ count }) => setTotalUnread(count || 0));
    });
  }, []);

  if (!userId) return null;

  return (
    <div className="flex items-center gap-1">
      {/* Chat/Inbox link */}
      <Link
        href="/admin/chat"
        className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        title="Customer Inbox"
      >
        <MessageSquare className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-secondary text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </Link>

      {/* Notification bell */}
      <NotificationBell userId={userId} variant="dark" />
    </div>
  );
}
