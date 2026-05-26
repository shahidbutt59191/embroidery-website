import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-outfit">Ready to elevate your embroidery business?</h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">
          Join thousands of businesses who trust our platform to find the best embroidery digitizing and design services globally.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register" className="bg-secondary text-primary font-bold px-8 py-4 rounded-full hover:bg-white transition-colors shadow-lg text-lg">
            Join as a Buyer
          </Link>
          <Link href="/seller" className="bg-transparent text-white border-2 border-white/30 font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-lg">
            Become a Seller
          </Link>
        </div>
      </div>
    </section>
  );
}
