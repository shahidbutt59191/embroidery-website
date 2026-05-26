"use client";

import AdminOrderChat from "./AdminOrderChat";

export default function AdminChatClient({
  orderId,
  adminId,
  customerName,
  customerId,
}: {
  orderId: string | null;
  adminId: string;
  customerName: string;
  customerId?: string;
}) {
  return (
    <AdminOrderChat
      orderId={orderId}
      adminId={adminId}
      customerName={customerName}
      customerId={customerId}
    />
  );
}
