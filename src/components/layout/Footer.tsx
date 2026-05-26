import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8 border-t border-border/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-primary font-bold text-xl leading-none">S</span>
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">StitchMarket</span>
            </div>
            <p className="text-primary-foreground/70 mb-6 leading-relaxed">
              The premier marketplace for premium embroidery digitizing and design services.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Categories</h4>
            <ul className="space-y-3 text-primary-foreground/70">
              <li><Link href="/categories/logo" className="hover:text-secondary transition-colors">Logo Embroidery</Link></li>
              <li><Link href="/categories/cap" className="hover:text-secondary transition-colors">Cap Embroidery</Link></li>
              <li><Link href="/categories/jacket" className="hover:text-secondary transition-colors">Jacket Back</Link></li>
              <li><Link href="/categories/digitizing" className="hover:text-secondary transition-colors">Embroidery Digitizing</Link></li>
              <li><Link href="/categories/patch" className="hover:text-secondary transition-colors">Patch Embroidery</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">About</h4>
            <ul className="space-y-3 text-primary-foreground/70">
              <li><Link href="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
              <li><Link href="/how-it-works" className="hover:text-secondary transition-colors">How It Works</Link></li>
              <li><Link href="/trust-safety" className="hover:text-secondary transition-colors">Trust & Safety</Link></li>
              <li><Link href="/seller" className="hover:text-secondary transition-colors">Selling on StitchMarket</Link></li>
              <li><Link href="/buyer" className="hover:text-secondary transition-colors">Buying on StitchMarket</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Support</h4>
            <ul className="space-y-3 text-primary-foreground/70">
              <li><Link href="/help" className="hover:text-secondary transition-colors">Help & Support</Link></li>
              <li><Link href="/terms" className="hover:text-secondary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-secondary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-secondary transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} StitchMarket Ltd. All Rights Reserved.
          </p>
          <div className="flex gap-4 text-sm text-primary-foreground/60">
            <span>English</span>
            <span>$ USD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
