import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";

// Mock data for initial UI
const gigs = [
  {
    id: 1,
    seller: {
      name: "StitchMaster Pro",
      level: "Top Rated Seller",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
    },
    title: "I will do professional 3D puff embroidery digitizing for caps",
    rating: 4.9,
    reviews: 124,
    price: 15,
    image: "https://images.unsplash.com/photo-1596455607563-ad6193f76b19?auto=format&fit=crop&w=600&h=400&q=80"
  },
  {
    id: 2,
    seller: {
      name: "DigitizeExpert",
      level: "Level 2 Seller",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80"
    },
    title: "I will digitize your logo for chest left or jacket back",
    rating: 5.0,
    reviews: 342,
    price: 10,
    image: "https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=600&h=400&q=80"
  },
  {
    id: 3,
    seller: {
      name: "Vector2Stitch",
      level: "Level 2 Seller",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
    },
    title: "I will provide custom patch embroidery digitizing in 2 hours",
    rating: 4.8,
    reviews: 89,
    price: 20,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&h=400&q=80"
  },
  {
    id: 4,
    seller: {
      name: "EliteEmbroidery",
      level: "Top Rated Seller",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
    },
    title: "I will flawlessly convert any complex design to PES/DST",
    rating: 4.9,
    reviews: 512,
    price: 25,
    image: "https://images.unsplash.com/photo-1618221196710-dd8491e0e781?auto=format&fit=crop&w=600&h=400&q=80"
  }
];

export default function FeaturedGigs() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-primary mb-2 font-outfit">Featured Services</h2>
        <p className="text-muted-foreground text-lg mb-10">Premium embroidery digitizing services picked for you</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gigs.map((gig) => (
            <Link key={gig.id} href={`/gig/${gig.id}`} className="group block bg-white rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={gig.image} 
                  alt={gig.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                  <Heart size={18} />
                </button>
              </div>
              
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <img src={gig.seller.avatar} alt={gig.seller.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{gig.seller.name}</h4>
                    <p className="text-xs text-muted-foreground">{gig.seller.level}</p>
                  </div>
                </div>
                
                <h3 className="font-medium text-foreground text-base mb-4 line-clamp-2 group-hover:text-primary transition-colors">
                  {gig.title}
                </h3>
                
                <div className="flex items-center gap-1 mb-4">
                  <Star className="w-4 h-4 fill-secondary text-secondary" />
                  <span className="font-bold text-foreground text-sm">{gig.rating}</span>
                  <span className="text-muted-foreground text-sm">({gig.reviews})</span>
                </div>
              </div>
              
              <div className="px-5 py-4 border-t border-border flex justify-between items-center bg-accent/20">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Starting At</span>
                <span className="font-bold text-lg text-primary">${gig.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
