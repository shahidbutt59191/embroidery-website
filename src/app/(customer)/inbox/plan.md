# Inbox + Notifications System — Implementation Plan

## What's being built

### Customer Portal
- **Navbar**: Add Inbox icon (bell + chat) with unread badge — real-time
- **`/inbox`** page: Full inbox showing all conversations (order chats + support chat)
  - Conversation list on left, chat window on right (like Fiverr Messages)
- **Notification bell** in Navbar: Dropdown showing recent notifications

### Admin Portal  
- **Sidebar**: Inbox link with unread count badge
- **`/admin/chat`**: Already exists — enhance with notification badge on sidebar
- **Notification bell** in admin top bar: Real-time notifications for new orders + messages

### Database
- Add `notifications` table (if not exists)
- Notifications auto-created for: new order, new message, order status change

## Files to create/edit
- `src/app/(customer)/inbox/page.tsx` — NEW
- `src/app/(customer)/inbox/InboxClient.tsx` — NEW (real-time client)
- `src/components/layout/Navbar.tsx` — ADD inbox + notification bell
- `src/components/layout/NavbarClient.tsx` — NEW client wrapper for notifications
- `src/app/admin/(portal)/layout.tsx` — ADD notification bell + unread badge on sidebar
- `src/app/admin/(portal)/AdminLayoutClient.tsx` — NEW for real-time admin notifications
- SQL migration for notifications table
