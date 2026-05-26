import { redirect } from "next/navigation";

export default function AdminDashboard() {
  // Redirect to gigs management for now as it's the primary focus
  redirect("/admin/gigs");
}
