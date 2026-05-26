"use client";

import AdminOrderChat from "./AdminOrderChat";

export default function AdminChatClient({
  orderId,
  adminId,
  customerName,
}: {
  orderId: string;
  adminId: string;
  customerName: string;
}) {
  return (
    <AdminOrderChat
      orderId={orderId}
      adminId={adminId}
      customerName={customerName}
    />
  );
}
