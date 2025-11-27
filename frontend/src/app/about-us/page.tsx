import Cta from "@/components/global/Cta";

export default function AboutUs() {
  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Hero Section */}
      <section className="text-center mb-(--space-2xl)">
        <div className="relative">
          <h1 className="text-6 font-bold text-maroon mb-(--space-s) leading-tight">
            About CarJai
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-maroon to-red mx-auto mb-(--space-m) rounded-full"></div>
          <p className="text-2 text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Trusted second-hand car marketplace, where every transaction is
            built on <span className="font-bold text-maroon">transparency</span>
            ,<span className="font-bold text-maroon"> trust</span>, and
            <span className="font-bold text-maroon"> genuine care</span>.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mb-(--space-2xl)">
        <div className="grid md:grid-cols-2 gap-(--space-xl) items-center">
          <div>
            <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
              Our Mission
            </h2>
            <p className="text-1 text-gray-600 mb-(--space-m) leading-relaxed">
              We&apos;re revolutionizing the second-hand car market in Thailand
              by eliminating the pain points that plague both buyers and
              sellers. Our platform ensures every transaction is smooth,
              transparent, and trustworthy.
            </p>
            <div className="space-y-(--space-s)">
              {[
                "Unreliable listings with hidden issues",
                "Complex and unfair negotiation processes",
                "Incomplete and inconsistent vehicle information",
              ].map((problem, index) => (
                <div key={index} className="flex items-center gap-(--space-s)">
                  <div className="w-2 h-2 bg-maroon rounded-full flex-shrink-0"></div>
                  <span className="text-0 text-gray-600">{problem}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-maroon/10 to-red/10 rounded-2xl p-(--space-xl) h-80 flex items-center justify-center border border-maroon/20 shadow-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-maroon rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2 font-bold text-maroon mb-(--space-2xs)">
                  Our Goal
                </h3>
                <p className="text-0 text-gray-600">
                  Make car buying & selling effortless
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why CarJai Section */}
      <section className="mb-(--space-2xl)">
        <div className="text-center mb-(--space-xl)">
          <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
            Why &quot;CarJai&quot;?
          </h2>
          <p className="text-1 text-gray-600 max-w-2xl mx-auto">
            Our name reflects our core values and commitment to putting people
            first
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-(--space-xl) items-center">
          <div className="space-y-(--space-m)">
            <div className="flex items-center gap-(--space-s)">
              <div className="w-12 h-12 bg-maroon/10 rounded-full flex items-center justify-center flex-shrink-0">
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
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2 font-bold text-gray-900">Car</h3>
                <p className="text-0 text-gray-600">
                  The vehicle at the heart of our business
                </p>
              </div>
            </div>
            <div className="flex items-center gap-(--space-s)">
              <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2 font-bold text-gray-900">Jai (Heart)</h3>
                <p className="text-0 text-gray-600">
                  Sincerity, transparency, and trust in every interaction
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-maroon to-red rounded-2xl p-(--space-xl) text-white">
            <blockquote className="text-2 font-medium italic mb-(--space-s)">
              &quot;Trust is the foundation of every successful car
              transaction&quot;
            </blockquote>
            <p className="text-0 text-white/90">
              We believe that when both buyers and sellers can trust the
              process, everyone wins. That&apos;s why we&apos;ve built CarJai
              with transparency and reliability at its core.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="mb-(--space-2xl)">
        <div className="text-center mb-(--space-xl)">
          <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
            More Than Just a Listing Platform
          </h2>
          <p className="text-1 text-gray-600 max-w-2xl mx-auto">
            We&apos;re building a community where car transactions happen with
            confidence and care
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-(--space-xl)">
          {/* For Sellers */}
          <div className="bg-gradient-to-br from-maroon/10 to-red/10 rounded-2xl p-(--space-xl) border border-maroon/20">
            <div className="flex items-center gap-(--space-s) mb-(--space-m)">
              <div className="w-10 h-10 bg-maroon rounded-full flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-3 font-bold text-gray-900">For Sellers</h3>
            </div>
            <div className="space-y-(--space-s)">
              {[
                "List with confidence - transparent information presentation",
                "Reach serious buyers ready to make decisions",
                "Sell faster with our reliable verification system",
                "No hidden fees or surprise charges",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-(--space-s)">
                  <div className="w-5 h-5 bg-maroon rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-0 text-gray-700 leading-relaxed">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* For Buyers */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-(--space-xl) border border-gray-200">
            <div className="flex items-center gap-(--space-s) mb-(--space-m)">
              <div className="w-10 h-10 bg-maroon rounded-full flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-3 font-bold text-gray-900">For Buyers</h3>
            </div>
            <div className="space-y-(--space-s)">
              {[
                "Make informed decisions with verified information",
                "Contact sellers directly - no middlemen",
                "Confidence in every purchase with our guarantee",
                "Comprehensive vehicle history and documentation",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-(--space-s)">
                  <div className="w-5 h-5 bg-maroon rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-0 text-gray-700 leading-relaxed">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mb-(--space-2xl)">
        <div className="text-center mb-(--space-xl)">
          <h2 className="text-4 font-bold text-gray-900 mb-(--space-s)">
            Our Core Values
          </h2>
          <p className="text-1 text-gray-600 max-w-2xl mx-auto">
            Every decision we make is guided by these fundamental principles
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-(--space-m)">
          {[
            {
              icon: (
                <svg
                  className="w-8 h-8 text-maroon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
              ),
              title: "Fairness",
              description:
                "No deception, hidden information, or unfair practices. Every transaction is transparent and honest.",
            },
            {
              icon: (
                <svg
                  className="w-8 h-8 text-maroon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              ),
              title: "Transparency",
              description:
                "Complete information that&apos;s verifiable at every step. What you see is what you get.",
            },
            {
              icon: (
                <svg
                  className="w-8 h-8 text-maroon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              ),
              title: "Trustworthiness",
              description:
                "High-level security systems and verification processes to protect every user.",
            },
          ].map((value, index) => (
            <div
              key={index}
              className="text-center p-(--space-m) rounded-xl hover:shadow-md transition-all bg-white border border-gray-200"
            >
              <div className="flex justify-center mb-(--space-s)">
                <div className="w-16 h-16 bg-maroon/10 rounded-full flex items-center justify-center">
                  {value.icon}
                </div>
              </div>
              <h3 className="text-2 font-bold text-gray-900 mb-(--space-2xs)">
                {value.title}
              </h3>
              <p className="text-0 text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Cta />
    </div>
  );
}
