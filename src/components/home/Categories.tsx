import { Scissors, Shirt, Move3d, FileText, Image as ImageIcon, Briefcase, Award, Palette } from "lucide-react";
import Link from "next/link";

const categories = [
  { id: 1, name: "Logo Embroidery", icon: Award, href: "/categories/logo-embroidery" },
  { id: 2, name: "Cap Embroidery", icon: Scissors, href: "/categories/cap-embroidery" },
  { id: 3, name: "Jacket Embroidery", icon: Shirt, href: "/categories/jacket-embroidery" },
  { id: 4, name: "Patch Embroidery", icon: Award, href: "/categories/patch-embroidery" },
  { id: 5, name: "Embroidery Digitizing", icon: Move3d, href: "/categories/digitizing" },
  { id: 6, name: "DST/PES Conversion", icon: FileText, href: "/categories/dst-pes" },
  { id: 7, name: "Vector to Embroidery", icon: ImageIcon, href: "/categories/vector-to-embroidery" },
  { id: 8, name: "Uniform Embroidery", icon: Briefcase, href: "/categories/uniform-embroidery" },
];

export default function Categories() {
  return (
    <section className="py-20 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2 font-outfit">Explore by Category</h2>
            <p className="text-muted-foreground text-lg">Find the exact service you need</p>
          </div>
          <Link href="/categories" className="text-primary font-medium hover:text-secondary transition-colors pb-1 border-b-2 border-transparent hover:border-secondary hidden sm:block">
            View all categories &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={category.href}
              className="group bg-white rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-xl hover:border-secondary/30 transition-all duration-300 flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-accent group-hover:bg-primary transition-colors duration-300 flex items-center justify-center">
                <category.icon className="w-8 h-8 text-primary group-hover:text-secondary transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{category.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
