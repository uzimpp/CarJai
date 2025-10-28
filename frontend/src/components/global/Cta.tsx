import Link from "next/link";

export default function Cta() {
  return (
    /* CTA Section */
    <section className="bg-black rounded-3xl shadow-xl p-(--space-xl) border-2 border-maroon/10 !mb-0">
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
            href="/browse"
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
  );
}
