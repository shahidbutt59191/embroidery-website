// Root admin layout — intentionally minimal.
// Only the admin login page uses this.
// The sidebar layout lives in (portal)/layout.tsx
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
