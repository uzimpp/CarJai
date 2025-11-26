import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/search/SearchBar";
import Cta from "@/components/global/Cta";

export default function Home() {
  const categories = [
    {
      title: "City & Compact",
      description: "Perfect for urban driving and daily commute",
      image: "/assets/cars/honda_accord.png",
      count: "180+ cars",
      gradient: "from-maroon to-red/70",
    },
    {
      title: "Luxury & Performance",
      description: "High-end sports cars and luxury vehicles",
      image: "/assets/cars/porsche_stinger.png",
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
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
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
            <div className="flex justify-center items-center w-full max-w-[768px]">
              <SearchBar className="mx-auto" placeholder="City car" />
            </div>
            <div>
              {[
                { label: "Compact Cars", bodyType: "CITYCAR" },
                { label: "Family Cars", bodyType: "SUV" },
                { label: "Performance", bodyType: "SPORTLUX" },
                { label: "Electric", fuelTypes: ["ELECTRIC"] },
              ].map((c) => {
                const params = new URLSearchParams();
                if (c.bodyType) {
                  params.set("bodyType", c.bodyType);
                }
                if (c.fuelTypes) {
                  c.fuelTypes.forEach((fuel) =>
                    params.append("fuelTypes", fuel)
                  );
                }
                return (
                  <Link
                    key={c.label}
                    href={`/browse?${params.toString()}`}
                    className="text-white bg-maroon hover:bg-red px-(--space-m) py-(--space-2xs) rounded-full text-0 font-medium transition-all hover:shadow-lg hover:scale-105"
                  >
                    {c.label}
                  </Link>
                );
              })}
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
          {categories.map((cat) => {
            // Map category titles to bodyType or fuelTypes
            const params = new URLSearchParams();
            if (cat.title === "City & Compact") {
              params.set("bodyType", "CITYCAR");
            } else if (cat.title === "Luxury & Performance") {
              params.set("bodyType", "SPORTLUX");
            } else if (cat.title === "Family Cars") {
              params.set("bodyType", "SUV");
            }
            return (
              <Link
                key={cat.title}
                href={`/browse?${params.toString()}`}
                className="group relative shadow-lg rounded-tr-5xl rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div
                  className={`w-full h-full flex flex-col justify-center p-(--space-m-xl) gap-y-(--space-l) inset-0 bg-gradient-to-br rounded-tr-xl rounded-xl ${cat.gradient}`}
                >
                  <div>
                    <h3 className="text-3 font-bold text-white mb-2 line-height-12">
                      {cat.title}
                    </h3>
                    <p className="text-0 text-white/90">{cat.description}</p>
                  </div>
                  <div className="relative aspect-[2/1] w-full">
                    <Image
                      src={cat.image}
                      alt={cat.title}
                      fill
                      className="object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-(--space-xl) shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-(--space-xl) items-center">
          <div className="space-y-(--space-l)">
            <div className="mb-(--space-m)">
              <h2 className="text-4 font-bold text-gray-900 mb-(--space-2xs)">
                Why Choose CarJai?
              </h2>
              <p className="text-0 text-gray-600">
                Your trusted partner for buying and selling cars
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-(--space-s)">
              {[
                {
                  icon: (
                    <svg
                      className="w-6 h-6 text-maroon"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ),
                  title: "Verified Sellers",
                  desc: "Every seller is verified with ID and document checks",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6 text-maroon"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  ),
                  title: "Full History",
                  desc: "Complete vehicle history and maintenance records",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6 text-maroon"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                  title: "Best Prices",
                  desc: "Competitive pricing with transparent fee structure",
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6 text-maroon"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  ),
                  title: "Quick Process",
                  desc: "Buy or sell your car in just a few simple steps",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-3 p-(--space-m) rounded-xl bg-white hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-maroon/10 rounded-lg flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1 text-0">
                      {feature.title}
                    </h4>
                    <p className="text--1 text-gray-600 leading-relaxed">
                      {feature.desc}
                    </p>
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

      <Cta />
    </div>
  );
}
