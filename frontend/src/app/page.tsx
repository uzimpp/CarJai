import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/global/SearchBar";

export default function Home() {
  const featuredCars = [
    {
      name: "Mercedes-Benz AMG",
      category: "Performance",
      image: "/assets/cars/benz_amg.png",
      price: "฿8,500,000",
    },
    {
      name: "Porsche 911",
      category: "Sports Car",
      image: "/assets/cars/porche.png",
      price: "฿12,900,000",
    },
    {
      name: "Honda Civic",
      category: "Compact",
      image: "/assets/cars/Honda Civic EG Hatch Transparent.png",
      price: "฿850,000",
    },
    {
      name: "Toyota Alphard",
      category: "Family Van",
      image: "/assets/cars/alphard.jpg",
      price: "฿4,200,000",
    },
  ];

  const categories = [
    {
      title: "City & Compact",
      description: "Perfect for urban driving and daily commute",
      image: "/assets/cars/honda_accord.png",
      count: "180+ cars",
      gradient: "from-maroon to-red",
    },
    {
      title: "Luxury & Performance",
      description: "High-end sports cars and luxury vehicles",
      image: "/assets/cars/benz_amg.png",
      count: "120+ cars",
      gradient: "from-gray-900 to-gray-500",
    },
    {
      title: "Family Cars",
      description: "Spacious and comfortable for the whole family",
      image: "/assets/cars/fortuner.png",
      count: "250+ cars",
      gradient: "from-green-900 to-green-700",
    },
  ];

  return (
    <div className="px-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Hero */}
      <section className="relative rounded-4xl shadow-[var(--shadow-lg)] bg-maroon px-(--space-xl) py-(--space-2xl-3xl)">
        <div className="relative z-10 flex flex-col items-center text-center gap-y-(--space-s) pb-(--space-xl) my-(--space-xs) w-full">
          <div>
            <h1 className="text-6 bold text-white line-height-11">
              Looking for a dream car?
            </h1>
            <h2 className="text-1 text-white line-height-12">
              Find your perfect car with CarJai
            </h2>
          </div>
          <div className="flex flex-col items-center gap-y-(--space-s) w-full">
            <div className="w-full max-w-[768px]">
              <SearchBar className="mx-auto" placeholder="City car" />
            </div>
            <div>
              {[
                { label: "Compact Cars", q: "compact" },
                { label: "Family Cars", q: "family" },
                { label: "Performance", q: "sport" },
                { label: "Electric", q: "electric" },
              ].map((c) => (
                <Link
                  key={c.q}
                  href={`/buy?q=${encodeURIComponent(c.q)}`}
                  className="text-white bg-maroon hover:bg-red px-(--space-m) py-(--space-2xs) rounded-full text-0 font-medium transition-all hover:shadow-lg hover:scale-105"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {/* Decorative cars overlay layer (does not affect layout) */}
        <div className="pointer-events-none absolute inset-0 z-0 hidden sm:flex items-end justify-between select-none translate-y-(--space-s-m)">
          <div className="relative basis-[36%] md:basis-[34%] lg:basis-[32%] max-w-[640px] min-w-[240px] aspect-[2.2/1] -translate-x-(--space-xs-s) scale-x-[-1]">
            <Image
              src="/assets/cars/benz_amg.png"
              alt="car-left"
              fill
              quality={100}
              className="object-contain"
              priority
            />
          </div>
          <div className="relative basis-[36%] md:basis-[34%] lg:basis-[32%] max-w-[640px] min-w-[240px] aspect-[2.2/1] translate-x-(--space-s)">
            <Image
              src="/assets/cars/honda_accord.png"
              alt="car-right"
              fill
              quality={100}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      <section>
        <div className="text-center "></div>
      </section>
      {/* Browse by Category */}
      <section>
        <div className="text-center mb-(--space-l)">
          <h2 className="text-4 font-bold text-gray-900 mb-(--space-2xs)">
            Browse by Category
          </h2>
          <p className="text-0 text-gray-600">
            Find the perfect car type for your needs
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-(--space-m)">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={`/buy?category=${encodeURIComponent(cat.title)}`}
              className="group relative shadow-lg rounded-tr-5xl rounded-xl hover:shadow-2xl transition-all duration-300 h-80 hover:-translate-y-2"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br rounded-tr-xl rounded-xl ${cat.gradient} opacity-91 group-hover:opacity-95 transition-opacity`}
              />
              <div className="relative w-full h-full flex flex-col justify-between p-(--space-l)">
                <div>
                  <h3 className="text-3 font-bold text-white mb-2 line-height-12">
                    {cat.title}
                  </h3>
                  <p className="text-0 text-white/90">{cat.description}</p>
                </div>
                <div className="relative w-full h-32">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-(--space-xl) shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-(--space-xl) items-center">
          <div className="space-y-(--space-m)">
            <h2 className="text-4 font-bold text-gray-900">
              Why Choose CarJai?
            </h2>
            <div className="space-y-(--space-s)">
              {[
                {
                  icon: "🔒",
                  title: "Verified Sellers",
                  desc: "Every seller is verified with ID and document checks",
                },
                {
                  icon: "📋",
                  title: "Full History",
                  desc: "Complete vehicle history and maintenance records",
                },
                {
                  icon: "💰",
                  title: "Best Prices",
                  desc: "Competitive pricing with transparent fee structure",
                },
                {
                  icon: "⚡",
                  title: "Quick Process",
                  desc: "Buy or sell your car in just a few simple steps",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-4 p-(--space-s) rounded-xl hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="text-3xl">{feature.icon}</div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text--1 text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[400px] hidden md:block">
            <Image
              src="/assets/cars/benz.png"
              alt="Trust and Safety"
              fill
              className="object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black rounded-3xl shadow-xl p-(--space-xl) border-2 border-maroon/10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-(--space-l)">
          <div className="space-y-(--space-2xs)">
            <h2 className="text-4 font-bold text-white line-height-12">
              Ready to find your perfect car?
            </h2>
            <p className="text-1 text-white/70">
              Join happy customers who found their dream cars on CarJai
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-(--space-s) justify-center">
            <Link
              href="/buy"
              className="px-(--space-l) py-(--space-s) bg-maroon hover:bg-red text-white font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Browse Cars
            </Link>
            <Link
              href="/sell"
              className="px-(--space-l) py-(--space-s) bg-white hover:bg-gray-50 text-maroon font-bold rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Sell Your Car
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
