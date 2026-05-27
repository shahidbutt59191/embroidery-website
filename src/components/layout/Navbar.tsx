import Link from "next/link";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm leading-none">S</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">StitchMarket</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Services
          </Link>
          <Link href="/#portfolio" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Portfolio
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            /* Logged-in: show inbox + bell + dashboard — client component */
            <NavbarClient />
          ) : (
            <>
              <Link href="/login" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <button className="md:hidden p-2 rounded-xl hover:bg-accent transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
