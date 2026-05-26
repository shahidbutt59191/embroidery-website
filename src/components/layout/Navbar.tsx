import Link from "next/link";
import { Search, ShoppingCart, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-secondary font-bold text-xl leading-none">S</span>
            </div>
            <span className="font-bold text-2xl tracking-tight text-primary">StitchMarket</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#services" className="text-sm font-medium hover:text-secondary transition-colors">
            Our Services
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:text-secondary transition-colors">
            Dashboard
          </Link>
          <Link href="/login" className="text-sm font-medium hover:text-secondary transition-colors">
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors"
          >
            Join Now
          </Link>
        </nav>
        
        <div className="md:hidden flex items-center gap-4">
          <button className="text-primary p-2">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
